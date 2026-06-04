import type { Handler } from "@netlify/functions";

export type OrderStatus =
  | "pending_payment"
  | "payment_received"
  | "in_production"
  | "preparing_shipment"
  | "shipped"
  | "delivered";

export interface OrderStatusItem {
  productId:   string;
  productSku?: string;
  productName: string;
  quantity:    number;
  variant?:    string;
  color?:      string;
}

export interface OrderStatusResponse {
  orderId:         string;
  status:          OrderStatus;
  createdAt:       string;
  customerName:    string;
  items:           OrderStatusItem[];
  trackingNumber?: string;
  sellerNote?:     string;
}

const STATUS_MAP: Record<string, OrderStatus> = {
  "Pendiente de pago": "pending_payment",
  "Pago recibido":     "payment_received",
  "En producción":     "in_production",
  "Preparando envío":  "preparing_shipment",
  "Enviado":           "shipped",
  "Entregado":         "delivered",
};

// LV-YYMMDD-XXXX
const ORDER_ID_RE = /^LV-\d{6}-[A-Z2-9]{4}$/;

function richText(prop: unknown): string {
  const p = prop as { rich_text?: Array<{ plain_text?: string }> } | undefined;
  return p?.rich_text?.[0]?.plain_text ?? "";
}

const handler: Handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "method_not_allowed" }) };
  }

  const id = (event.queryStringParameters?.["id"] ?? "").trim().toUpperCase();

  if (!id || !ORDER_ID_RE.test(id)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "invalid_id" }) };
  }

  const notionToken = process.env["NOTION_TOKEN"];
  const notionDb    = process.env["NOTION_DATABASE_ID"];

  if (!notionToken || !notionDb) {
    return { statusCode: 503, headers, body: JSON.stringify({ error: "unavailable" }) };
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${notionDb}/query`, {
      method: "POST",
      headers: {
        "Authorization":  `Bearer ${notionToken}`,
        "Content-Type":   "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        filter: {
          property: "ID Pedido",
          title:    { equals: id },
        },
      }),
    });

    if (!res.ok) {
      console.error("Notion query error:", res.status, await res.text());
      return { statusCode: 500, headers, body: JSON.stringify({ error: "notion_error" }) };
    }

    const data = await res.json() as { results: unknown[] };

    if (!data.results || data.results.length === 0) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: "not_found" }) };
    }

    const page   = data.results[0] as Record<string, unknown>;
    const props  = page["properties"] as Record<string, unknown>;
    const created = page["created_time"] as string;

    const statusLabel = (props["Estado"] as { select?: { name?: string } })?.select?.name ?? "";
    const status: OrderStatus = STATUS_MAP[statusLabel] ?? "pending_payment";

    const itemsJsonStr = richText(props["Items JSON"]);
    let items: OrderStatusItem[] = [];
    try {
      items = JSON.parse(itemsJsonStr) as OrderStatusItem[];
    } catch {
      items = [];
    }

    const trackingNumber = richText(props["Tracking"]) || undefined;
    const sellerNote     = richText(props["Nota pública"]) || undefined;

    const order: OrderStatusResponse = {
      orderId:      id,
      status,
      createdAt:    created,
      customerName: richText(props["Cliente"]),
      items,
      trackingNumber,
      sellerNote,
    };

    return { statusCode: 200, headers, body: JSON.stringify(order) };

  } catch (err) {
    console.error("Error querying Notion:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "server_error" }) };
  }
};

export { handler };
