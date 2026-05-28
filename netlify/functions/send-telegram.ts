import type { Handler, HandlerEvent } from "@netlify/functions";

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
  // Strip null bytes and ASCII control chars (except \n \t)
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

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

// ── Validation ─────────────────────────────────────────────────────────────

interface ValidatedItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  variant?: string;
  color?: string;
  notes?: string;
}

interface ValidatedOrder {
  customerName: string;
  customerContact: string;
  deliveryMethod: "pickup" | "shipping";
  notes?: string;
  totalAmount: number;
  depositAmount: number;
  items: ValidatedItem[];
}

function validateOrder(body: unknown): ValidatedOrder {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Cuerpo de la petición inválido");
  }

  const raw = body as Record<string, unknown>;

  const customerName    = sanitizeStr(raw["customerName"],    100, "Nombre");
  const customerContact = sanitizeStr(raw["customerContact"], 200, "Contacto");

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
    const quantity = i["quantity"];
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new ValidationError(`Artículo ${idx + 1}: cantidad inválida`);
    }
    const unitPrice = i["unitPrice"];
    if (typeof unitPrice !== "number" || unitPrice <= 0 || unitPrice >= 100_000 || !isFinite(unitPrice)) {
      throw new ValidationError(`Artículo ${idx + 1}: precio inválido`);
    }
    return {
      productName,
      quantity,
      unitPrice,
      variant: sanitizeOptionalStr(i["variant"], 100),
      color:   sanitizeOptionalStr(i["color"],   100),
      notes:   sanitizeOptionalStr(i["notes"],   500),
    };
  });

  // Cross-check totals (allow ±1€ for floating point drift)
  const expectedTotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const claimedTotal  = raw["totalAmount"];
  if (typeof claimedTotal !== "number" || !isFinite(claimedTotal) || Math.abs(claimedTotal - expectedTotal) > 1) {
    throw new ValidationError("Total del pedido no coincide con los artículos");
  }

  const depositAmount = raw["depositAmount"];
  if (typeof depositAmount !== "number" || !isFinite(depositAmount) || depositAmount <= 0) {
    throw new ValidationError("Depósito inválido");
  }

  return {
    customerName,
    customerContact,
    deliveryMethod,
    notes,
    totalAmount: claimedTotal,
    depositAmount,
    items,
  };
}

// ── Message builder ────────────────────────────────────────────────────────

function buildMessage(order: ValidatedOrder): string {
  const itemLines = order.items.map(item => {
    let line = `• ${item.quantity}x <b>${escapeHtml(item.productName)}</b>`;
    if (item.variant) line += ` (${escapeHtml(item.variant)})`;
    if (item.color)   line += ` — Color: ${escapeHtml(item.color)}`;
    line += ` — ${(item.quantity * item.unitPrice).toFixed(2)}€`;
    if (item.notes)   line += `\n  📝 <i>${escapeHtml(item.notes)}</i>`;
    return line;
  }).join("\n");

  const deliveryLabel = order.deliveryMethod === "pickup" ? "En mano (Barcelona)" : "Envío";

  return [
    `🏴‍☠️ <b>NUEVO PEDIDO — LayerVault</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `👤 <b>Cliente:</b> ${escapeHtml(order.customerName)}`,
    `📞 <b>Contacto:</b> ${escapeHtml(order.customerContact)}`,
    `🚚 <b>Entrega:</b> ${deliveryLabel}`,
    ``,
    `📦 <b>Productos:</b>`,
    itemLines,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `💰 <b>Total:</b> ${order.totalAmount.toFixed(2)}€`,
    `💳 <b>Depósito 50%:</b> ${order.depositAmount.toFixed(2)}€`,
    order.notes ? `📝 <b>Notas:</b> ${escapeHtml(order.notes)}` : "",
    `🕐 ${new Date().toLocaleString("es-ES")}`,
  ].filter(line => line !== "").join("\n");
}

// ── Handler ────────────────────────────────────────────────────────────────

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Reject suspiciously large bodies (>16 KB)
  if (event.body && event.body.length > 16_384) {
    return { statusCode: 413, body: "Payload Too Large" };
  }

  const botToken = process.env["TELEGRAM_BOT_TOKEN"];
  const chatId   = process.env["TELEGRAM_CHAT_ID"];

  if (!botToken || !chatId) {
    console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID env vars");
    return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error" }) };
  }

  let order: ValidatedOrder;
  try {
    const raw: unknown = JSON.parse(event.body ?? "{}");
    order = validateOrder(raw);
  } catch (err) {
    if (err instanceof ValidationError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: err.message }),
      };
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
          chat_id: chatId,
          text: buildMessage(order),
          parse_mode: "HTML",
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Telegram API error:", response.status, errBody);
      throw new Error(`Telegram API error: ${response.status}`);
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("Error sending Telegram message:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Error al enviar la notificación" }) };
  }
};

export { handler };
