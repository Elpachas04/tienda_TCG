import type { Handler, HandlerEvent } from "@netlify/functions";
import { originOk } from "./_guard";

// ── Helpers ────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeStr(value: unknown, maxLen: number, fieldName: string): string {
  if (typeof value !== "string") throw new ValidationError(`${fieldName} debe ser texto`);
  const cleaned = value.replace(/\0/g, "").replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  if (cleaned.length === 0) throw new ValidationError(`${fieldName} no puede estar vacío`);
  if (cleaned.length > maxLen) throw new ValidationError(`${fieldName} demasiado largo (máx ${maxLen})`);
  return cleaned;
}

function sanitizeOptionalStr(value: unknown, maxLen: number): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/\0/g, "").replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  return cleaned.length > 0 ? cleaned.slice(0, maxLen) : undefined;
}

const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateOrderId(): string {
  const now = new Date();
  const yy  = String(now.getFullYear()).slice(2);
  const mm  = String(now.getMonth() + 1).padStart(2, "0");
  const dd  = String(now.getDate()).padStart(2, "0");
  let rand  = "";
  for (let i = 0; i < 4; i++) rand += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
  return `LV-${yy}${mm}${dd}-${rand}`;
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

// ── Types ──────────────────────────────────────────────────────────────────

interface ValidatedItem {
  productId:   string;
  productSku?: string;
  productName: string;
  quantity:    number;
  unitPrice:   number;
  variant?:    string;
  color?:      string;
  notes?:      string;
}

interface ValidatedOficina {
  nombre:       string;
  direccion:    string;
  codigoPostal: string;
  localidad:    string;
  telefono:     string;
}

interface ValidatedOrder {
  orderId:        string;
  customerName:   string;
  customerEmail:  string;
  customerPhone: string;
  deliveryMethod: "pickup" | "shipping";
  postalCode?:     string;
  shippingZone?:   string;
  shippingCost?:   number;
  oficina?:        ValidatedOficina;
  notes?:          string;
  totalAmount:     number;
  items:           ValidatedItem[];
}

// ── Validation ─────────────────────────────────────────────────────────────

function validateOrder(body: unknown, orderId: string): ValidatedOrder {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Cuerpo de la petición inválido");
  }

  const raw = body as Record<string, unknown>;

  // Honeypot: bots fill hidden fields, humans never see them
  if (typeof raw["_hp"] === "string" && raw["_hp"].length > 0) {
    throw new ValidationError("Bad request");
  }

  const customerName  = sanitizeStr(raw["customerName"],  100, "Nombre");
  const customerEmail = sanitizeStr(raw["customerEmail"], 254, "Email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customerEmail)) {
    throw new ValidationError("Email no válido");
  }
  const customerPhone = sanitizeStr(raw["customerPhone"], 20, "Teléfono");

  if (raw["deliveryMethod"] !== "pickup" && raw["deliveryMethod"] !== "shipping") {
    throw new ValidationError("Método de entrega inválido");
  }
  const deliveryMethod = raw["deliveryMethod"] as "pickup" | "shipping";

  const notes = sanitizeOptionalStr(raw["notes"], 500);

  if (!Array.isArray(raw["items"]) || raw["items"].length === 0) {
    throw new ValidationError("El pedido no contiene artículos");
  }
  if (raw["items"].length > 50) {
    throw new ValidationError("Demasiados artículos en el pedido");
  }

  const items: ValidatedItem[] = (raw["items"] as unknown[]).map((item, idx) => {
    if (!item || typeof item !== "object") throw new ValidationError(`Artículo ${idx + 1} inválido`);
    const i = item as Record<string, unknown>;
    const productName = sanitizeStr(i["productName"], 200, `Artículo ${idx + 1} nombre`);
    const productId   = sanitizeStr(i["productId"],   100, `Artículo ${idx + 1} id`);
    const quantity = i["quantity"];
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new ValidationError(`Artículo ${idx + 1}: cantidad inválida`);
    }
    const unitPrice = i["unitPrice"];
    if (typeof unitPrice !== "number" || unitPrice <= 0 || unitPrice >= 100_000 || !isFinite(unitPrice)) {
      throw new ValidationError(`Artículo ${idx + 1}: precio inválido`);
    }
    return {
      productId,
      productSku: sanitizeOptionalStr(i["productSku"], 20),
      productName,
      quantity,
      unitPrice,
      variant: sanitizeOptionalStr(i["variant"], 100),
      color:   sanitizeOptionalStr(i["color"],   100),
      notes:   sanitizeOptionalStr(i["notes"],   500),
    };
  });

  const shippingCost = typeof raw["shippingCost"] === "number" && isFinite(raw["shippingCost"])
    ? raw["shippingCost"]
    : undefined;

  const itemsSubtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const expectedTotal = itemsSubtotal + (shippingCost ?? 0);
  const claimedTotal  = raw["totalAmount"];
  if (typeof claimedTotal !== "number" || !isFinite(claimedTotal) || Math.abs(claimedTotal - expectedTotal) > 1) {
    throw new ValidationError("Total del pedido no coincide con los artículos");
  }

  const postalCode   = sanitizeOptionalStr(raw["postalCode"],   10);
  const shippingZone = sanitizeOptionalStr(raw["shippingZone"], 100);

  let oficina: ValidatedOficina | undefined;
  if (raw["oficina"] && typeof raw["oficina"] === "object" && !Array.isArray(raw["oficina"])) {
    const o = raw["oficina"] as Record<string, unknown>;
    try {
      oficina = {
        nombre:       sanitizeStr(o["nombre"],       200, "Oficina nombre"),
        direccion:    sanitizeStr(o["direccion"],     300, "Oficina dirección"),
        codigoPostal: sanitizeStr(o["codigoPostal"],  10, "Oficina CP"),
        localidad:    sanitizeStr(o["localidad"],     200, "Oficina localidad"),
        telefono:     sanitizeStr(o["telefono"],       50, "Oficina teléfono"),
      };
    } catch {
      // Oficina is optional — skip if malformed
    }
  }

  return {
    orderId,
    customerName,
    customerEmail,
    customerPhone,
    deliveryMethod,
    postalCode,
    shippingZone,
    shippingCost,
    oficina,
    notes,
    totalAmount: claimedTotal,
    items,
  };
}

// ── Telegram message builder ───────────────────────────────────────────────

function buildMessage(order: ValidatedOrder): string {
  const itemLines = order.items.map(item => {
    const ref  = item.productSku ?? item.productId;
    let line   = `• ${item.quantity}× <b>${escapeHtml(item.productName)}</b> <code>[${escapeHtml(ref)}]</code>`;
    if (item.variant) line += ` (${escapeHtml(item.variant)})`;
    if (item.color)   line += ` — Color: ${escapeHtml(item.color)}`;
    line += ` — ${(item.quantity * item.unitPrice).toFixed(2)}€`;
    if (item.notes)   line += `\n  📝 <i>${escapeHtml(item.notes)}</i>`;
    return line;
  }).join("\n");

  let deliveryLabel = order.deliveryMethod === "pickup" ? "En mano" : "Envío";
  if (order.deliveryMethod === "shipping" && order.postalCode) {
    deliveryLabel += ` · CP ${escapeHtml(order.postalCode)}`;
    if (order.shippingZone) deliveryLabel += ` (${escapeHtml(order.shippingZone)})`;
  }

  const lines: string[] = [
    `🏴‍☠️ <b>NUEVO PEDIDO — LayerVault</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🔑 <b>ID Pedido:</b> <code>${escapeHtml(order.orderId)}</code>`,
    ``,
    `👤 <b>Cliente:</b> ${escapeHtml(order.customerName)}`,
    `📧 <b>Email:</b> ${escapeHtml(order.customerEmail)}`,
    `📞 <b>Teléfono:</b> ${escapeHtml(order.customerPhone)}`,
    `🚚 <b>Entrega:</b> ${deliveryLabel}`,
  ];

  if (order.shippingCost) {
    lines.push(`📮 <b>Envío:</b> ${order.shippingCost.toFixed(2)}€`);
  }

  if (order.oficina) {
    lines.push(`🏣 <b>Oficina:</b> ${escapeHtml(order.oficina.nombre)}`);
    lines.push(`   📍 ${escapeHtml(order.oficina.direccion)}, ${escapeHtml(order.oficina.codigoPostal)} ${escapeHtml(order.oficina.localidad)}`);
    lines.push(`   📞 ${escapeHtml(order.oficina.telefono)}`);
  }

  lines.push(``);
  lines.push(`📦 <b>Productos:</b>`);
  lines.push(itemLines);
  lines.push(``);
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`💰 <b>Total:</b> ${order.totalAmount.toFixed(2)}€`);

  if (order.notes) {
    lines.push(`📝 <b>Notas:</b> ${escapeHtml(order.notes)}`);
  }

  lines.push(`🕐 ${new Date().toLocaleString("es-ES")}`);

  return lines.join("\n");
}

// ── Notion writer ──────────────────────────────────────────────────────────

async function writeOrderToNotion(order: ValidatedOrder, token: string, dbId: string): Promise<void> {
  const productosSummary = order.items
    .map(i => `${i.quantity}× [${i.productSku ?? i.productId}] ${i.productName}${i.variant ? ` (${i.variant})` : ""}${i.color ? ` — ${i.color}` : ""}`)
    .join(", ")
    .slice(0, 1900);

  const itemsJson = JSON.stringify(
    order.items.map(i => ({
      productId:   i.productId,
      productSku:  i.productSku,
      productName: i.productName,
      quantity:    i.quantity,
      variant:     i.variant,
      color:       i.color,
    }))
  ).slice(0, 1900);

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      parent: { database_id: dbId },
      properties: {
        "ID Pedido": { title: [{ text: { content: order.orderId } }] },
        "Estado":    { select: { name: "Pendiente de pago" } },
        "Cliente":   { rich_text: [{ text: { content: order.customerName } }] },
        "Contacto":  { rich_text: [{ text: { content: `${order.customerEmail} / ${order.customerPhone}` } }] },
        "Total":     { number: order.totalAmount },
        "Entrega":   { select: { name: order.deliveryMethod === "pickup" ? "En mano" : "Envío" } },
        "Productos": { rich_text: [{ text: { content: productosSummary } }] },
        "Items JSON":{ rich_text: [{ text: { content: itemsJson } }] },
        "Fecha":     { date: { start: new Date().toISOString() } },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion API ${res.status}: ${body}`);
  }
}

// ── Handler ────────────────────────────────────────────────────────────────

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  if (!originOk(event.headers)) {
    return { statusCode: 403, body: "Forbidden" };
  }

  if (event.body && event.body.length > 16_384) {
    return { statusCode: 413, body: "Payload Too Large" };
  }

  const botToken  = process.env["TELEGRAM_BOT_TOKEN"];
  const chatId    = process.env["TELEGRAM_CHAT_ID"];
  const notionToken = process.env["NOTION_TOKEN"];
  const notionDb    = process.env["NOTION_DATABASE_ID"];

  if (!botToken || !chatId) {
    console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID env vars");
    return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error" }) };
  }

  const orderId = generateOrderId();

  let order: ValidatedOrder;
  try {
    const raw: unknown = JSON.parse(event.body ?? "{}");
    order = validateOrder(raw, orderId);
  } catch (err) {
    if (err instanceof ValidationError) {
      return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
    }
    return { statusCode: 400, body: JSON.stringify({ error: "Petición malformada" }) };
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id:    chatId,
          text:       buildMessage(order),
          parse_mode: "HTML",
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Telegram API error:", response.status, errBody);
      throw new Error(`Telegram API error: ${response.status}`);
    }
  } catch (err) {
    console.error("Error sending Telegram message:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Error al enviar la notificación" }) };
  }

  // Notion write is non-critical — log errors but don't fail the request
  if (notionToken && notionDb) {
    try {
      await writeOrderToNotion(order, notionToken, notionDb);
    } catch (err) {
      console.error("Error writing to Notion (non-critical):", err);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ success: true, orderId }) };
};

export { handler };
