// netlify/functions/send-telegram.ts
// Copia este archivo a netlify/functions/send-telegram.ts en tu proyecto Angular

import type { Handler, HandlerEvent } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const order = JSON.parse(event.body || "{}");

    const itemsList = order.items
      .map((item: any) => {
        let line = `• ${item.quantity}x *${item.productName}*`;
        if (item.variant) line += ` (${item.variant})`;
        if (item.color) line += ` — Color: ${item.color}`;
        line += ` — ${(item.quantity * item.unitPrice).toFixed(2)}€`;
        if (item.notes) line += `\n  📝 ${item.notes}`;
        return line;
      })
      .join("\n");

    const message = `
🏴‍☠️ *NUEVO PEDIDO — TCG 3D Shop*
━━━━━━━━━━━━━━━━━━━━

👤 *Cliente:* ${order.customerName}
📞 *Contacto:* ${order.customerContact}
🚚 *Entrega:* ${order.deliveryMethod === "pickup" ? "En mano" : "Envío"}

📦 *Productos:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━
💰 *Total:* ${order.totalAmount.toFixed(2)}€
💳 *Depósito 50%:* ${order.depositAmount.toFixed(2)}€

${order.notes ? `📝 *Notas:* ${order.notes}` : ""}
🕐 ${new Date().toLocaleString("es-ES")}
    `.trim();

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error("Missing Telegram env vars");
      return { statusCode: 500, body: "Missing Telegram configuration" };
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to send notification" }),
    };
  }
};

export { handler };
