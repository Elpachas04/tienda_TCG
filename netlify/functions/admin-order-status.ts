import type { Handler } from "@netlify/functions";
import { originOk, MAX_BODY } from "./_guard";
import { verifyAdminSession } from "./_admin-auth";
import { ORDER_STATUSES } from "../../src/app/shared/constants/order-status";
import { EMAIL_STATUSES, sendStatusEmail } from "./_order-emails";

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

function richText(prop: unknown): string {
  const p = prop as { rich_text?: Array<{ plain_text?: string }> } | undefined;
  return (p?.rich_text ?? []).map(t => t.plain_text ?? "").join("");
}

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
  let trackingNumber: string | undefined;
  try {
    const raw = JSON.parse(event.body ?? "{}") as { orderId?: unknown; status?: unknown; trackingNumber?: unknown };
    if (typeof raw.orderId !== "string" || !ORDER_ID_RE.test(raw.orderId)) throw new Error("invalid");
    if (typeof raw.status !== "string" || !(ORDER_STATUSES as readonly string[]).includes(raw.status)) throw new Error("invalid");
    if (raw.trackingNumber !== undefined && (typeof raw.trackingNumber !== "string" || !/^[A-Za-z0-9 -]{0,40}$/.test(raw.trackingNumber))) throw new Error("invalid");
    orderId = raw.orderId;
    status  = raw.status;
    trackingNumber = (raw.trackingNumber as string | undefined)?.trim() || undefined;
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

    const data = await queryRes.json() as { results: Array<{ id: string; properties: Record<string, unknown> }> };
    if (data.results.length === 0) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: "not_found" }) };
    }

    const pageId = data.results[0].id;
    const props  = data.results[0].properties ?? {};
    const previousStatus = (props["Estado"] as { select?: { name?: string } } | undefined)?.select?.name ?? "";
    const properties: Record<string, unknown> = { "Estado": { select: { name: status } } };
    if (trackingNumber) properties["Tracking"] = { rich_text: [{ text: { content: trackingNumber } }] };
    const dateProperty = STATUS_DATE_PROPERTY[status];
    if (dateProperty) {
      properties[dateProperty] = { date: { start: new Date().toISOString() } };
    }

    const patchPage = (props: Record<string, unknown>) => fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: {
        "Authorization":  `Bearer ${notionToken}`,
        "Content-Type":   "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({ properties: props }),
    });

    let updateRes = await patchPage(properties);
    if (updateRes.status === 400) {
      // Si falta en Notion alguna columna opcional (fechas, Tracking), Notion rechaza todo: se guarda al menos el estado
      console.error("Notion update 400, reintentando solo con Estado:", await updateRes.text());
      updateRes = await patchPage({ "Estado": properties["Estado"] });
    }

    if (!updateRes.ok) {
      console.error("Notion update error:", updateRes.status, await updateRes.text());
      return { statusCode: 500, headers, body: JSON.stringify({ error: "notion_error" }) };
    }

    // Solo se avisa al cliente cuando el estado cambia de verdad a uno que lo merece (sin duplicados)
    let emailSent = false;
    if (status !== previousStatus && (EMAIL_STATUSES as readonly string[]).includes(status)) {
      const contacto = richText(props["Contacto"]);
      const customerEmail = contacto.split("/")[0]?.trim() ?? "";
      emailSent = await sendStatusEmail(status, {
        orderId,
        customerName:  richText(props["Cliente"]),
        customerEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) ? customerEmail : "",
        pickup:        (props["Entrega"] as { select?: { name?: string } } | undefined)?.select?.name === "En mano",
        trackingNumber,
      });
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, emailSent }) };
  } catch (err) {
    console.error("Error updating Notion:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "server_error" }) };
  }
};

export { handler };
