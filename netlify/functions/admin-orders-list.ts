import type { Handler } from "@netlify/functions";
import { requestOk } from "./_guard";
import { verifyAdminSession } from "./_admin-auth";

interface OrderListItem {
  orderId:        string;
  customerName:   string;
  total:          number;
  status:         string;
  createdAt:      string;
  deliveryMethod: string;
}

function titleText(prop: unknown): string {
  const p = prop as { title?: Array<{ plain_text?: string }> } | undefined;
  return p?.title?.[0]?.plain_text ?? "";
}
function richText(prop: unknown): string {
  const p = prop as { rich_text?: Array<{ plain_text?: string }> } | undefined;
  return p?.rich_text?.[0]?.plain_text ?? "";
}
function selectName(prop: unknown): string {
  const p = prop as { select?: { name?: string } } | undefined;
  return p?.select?.name ?? "";
}
function numberVal(prop: unknown): number {
  const p = prop as { number?: number } | undefined;
  return p?.number ?? 0;
}

const handler: Handler = async (event) => {
  const headers = { "Content-Type": "application/json" };

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "method_not_allowed" }) };
  }
  if (!requestOk(event.headers)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: "forbidden" }) };
  }
  if (!verifyAdminSession(event.headers["cookie"])) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "unauthorized" }) };
  }

  const notionToken = process.env["NOTION_TOKEN"];
  const notionDb     = process.env["NOTION_DATABASE_ID"];
  if (!notionToken || !notionDb) {
    return { statusCode: 503, headers, body: JSON.stringify({ error: "unavailable" }) };
  }

  const statusFilter = event.queryStringParameters?.["status"];
  const limitParam    = Number(event.queryStringParameters?.["limit"] ?? "50");
  const limit          = Number.isFinite(limitParam) ? Math.min(Math.max(Math.floor(limitParam), 1), 100) : 50;

  const query: Record<string, unknown> = {
    sorts:     [{ property: "Fecha", direction: "descending" }],
    page_size: limit,
  };
  if (statusFilter) {
    query["filter"] = { property: "Estado", select: { equals: statusFilter } };
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${notionDb}/query`, {
      method: "POST",
      headers: {
        "Authorization":  `Bearer ${notionToken}`,
        "Content-Type":   "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify(query),
    });

    if (!res.ok) {
      console.error("Notion query error:", res.status, await res.text());
      return { statusCode: 500, headers, body: JSON.stringify({ error: "notion_error" }) };
    }

    const data   = await res.json() as { results: unknown[] };
    const orders: OrderListItem[] = data.results.map((page) => {
      const p     = page as Record<string, unknown>;
      const props = p["properties"] as Record<string, unknown>;
      return {
        orderId:        titleText(props["ID Pedido"]),
        customerName:   richText(props["Cliente"]),
        total:          numberVal(props["Total"]),
        status:         selectName(props["Estado"]),
        createdAt:      (p["created_time"] as string) ?? "",
        deliveryMethod: selectName(props["Entrega"]),
      };
    });

    return { statusCode: 200, headers, body: JSON.stringify({ orders }) };
  } catch (err) {
    console.error("Error querying Notion:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "server_error" }) };
  }
};

export { handler };
