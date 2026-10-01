import type { Handler } from "@netlify/functions";
import { originOk, MAX_BODY } from "./_guard";
import { verifyAdminSession } from "./_admin-auth";
import { ORDER_STATUSES } from "../../src/app/shared/constants/order-status";

// LV-YYMMDD-XXXX
const ORDER_ID_RE = /^LV-\d{6}-[A-Z2-9]{4}$/;

// Refleja las propiedades de fecha usadas por get-order-status.ts
const STATUS_DATE_PROPERTY: Record<string, string> = {
  "Pago recibido":    "Fecha pago recibido",
  "En producción":    "Fecha producción",
  "Preparando envío": "Fecha preparando",
  "Enviado":          "Fecha enviado",
  "Entregado":        "Fecha entregado",
};

const handler: Handler = async (event) => {
  const headers = { "Content-Type": "application/json" };

  if (event.httpMethod !== "PATCH") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "method_not_allowed" }) };
  }
  if (!originOk(event.headers)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: "forbidden" }) };
  }
  if (!verifyAdminSession(event.headers["cookie"])) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "unauthorized" }) };
  }
  if (event.body && event.body.length > MAX_BODY) {
    return { statusCode: 413, headers, body: JSON.stringify({ error: "payload_too_large" }) };
  }

  let orderId: string;
  let status: string;
  try {
    const raw = JSON.parse(event.body ?? "{}") as { orderId?: unknown; status?: unknown };
    if (typeof raw.orderId !== "string" || !ORDER_ID_RE.test(raw.orderId)) throw new Error("invalid");
    if (typeof raw.status !== "string" || !(ORDER_STATUSES as readonly string[]).includes(raw.status)) throw new Error("invalid");
    orderId = raw.orderId;
    status  = raw.status;
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "bad_request" }) };
  }

  const notionToken = process.env["NOTION_TOKEN"];
  const notionDb     = process.env["NOTION_DATABASE_ID"];
  if (!notionToken || !notionDb) {
    return { statusCode: 503, headers, body: JSON.stringify({ error: "unavailable" }) };
  }

  try {
    const queryRes = await fetch(`https://api.notion.com/v1/databases/${notionDb}/query`, {
      method: "POST",
      headers: {
        "Authorization":  `Bearer ${notionToken}`,
        "Content-Type":   "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({ filter: { property: "ID Pedido", title: { equals: orderId } } }),
    });

    if (!queryRes.ok) {
      console.error("Notion query error:", queryRes.status, await queryRes.text());
      return { statusCode: 500, headers, body: JSON.stringify({ error: "notion_error" }) };
    }

    const data = await queryRes.json() as { results: Array<{ id: string }> };
    if (data.results.length === 0) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: "not_found" }) };
    }

    const pageId = data.results[0].id;
    const properties: Record<string, unknown> = { "Estado": { select: { name: status } } };
    const dateProperty = STATUS_DATE_PROPERTY[status];
    if (dateProperty) {
      properties[dateProperty] = { date: { start: new Date().toISOString() } };
    }

    const updateRes = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: {
        "Authorization":  `Bearer ${notionToken}`,
        "Content-Type":   "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({ properties }),
    });

    if (!updateRes.ok) {
      console.error("Notion update error:", updateRes.status, await updateRes.text());
      return { statusCode: 500, headers, body: JSON.stringify({ error: "notion_error" }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("Error updating Notion:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "server_error" }) };
  }
};

export { handler };
