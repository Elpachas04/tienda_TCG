import type { Handler, HandlerEvent } from "@netlify/functions";

const BREVO_API    = "https://api.brevo.com/v3/smtp/email";
const FROM_EMAIL   = "hola@layervault.es";
const FROM_NAME    = "LayerVault";
const BCC_EMAIL    = "hola@layervault.es";
const CONTACT_EMAIL = "hola@layervault.es";
const SITE_URL     = "https://layervault.es";

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env["BREVO_API_KEY"];
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "BREVO_API_KEY no configurada" }) };
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "JSON invalido" }) };
  }

  const { customerName, customerEmail, items, deliveryLine, total, orderId } = body as {
    customerName:  string;
    customerEmail: string;
    items:         { name: string; qty: number; variant?: string; color?: string; price: number }[];
    deliveryLine:  string;
    total:         number;
    orderId:       string;
  };

  if (!customerEmail || !customerName || !items) {
    return { statusCode: 400, body: JSON.stringify({ error: "Datos incompletos" }) };
  }

  const trackingUrl = orderId ? `${SITE_URL}/seguimiento?ref=${encodeURIComponent(orderId)}` : `${SITE_URL}/seguimiento`;

  const itemRows = (items as { name: string; qty: number; variant?: string; color?: string; price: number }[])
    .map(i => {
      const detail = [i.variant, i.color].filter(Boolean).map(v => esc(v as string)).join(" &middot; ");
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#f0f0f0;font-family:'Barlow',Arial,sans-serif;font-size:14px;">
            <strong style="color:#C9A84C;">${i.qty}&times;</strong> ${esc(i.name)}
            ${detail ? `<br><span style="color:#888;font-size:12px;">${detail}</span>` : ""}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;text-align:right;color:#C9A84C;font-family:'Barlow',Arial,sans-serif;font-size:14px;white-space:nowrap;">
            ${(i.price * i.qty).toFixed(2)} &euro;
          </td>
        </tr>`;
    }).join("");

  const steps = [
    ["01", "Te contactamos por Telegram para confirmar detalles"],
    ["02", "Abonas el total por Bizum o transferencia"],
    ["03", "Fabricamos en 3&ndash;7 d&iacute;as laborables"],
    ["04", "Entrega o recogida acordada contigo"],
  ].map(([n, t]) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
      <tr>
        <td width="28" style="font-family:Impact,Arial,sans-serif;font-size:20px;color:#3a3020;vertical-align:top;">${n}</td>
        <td style="font-size:13px;color:#aaa;vertical-align:top;padding-left:8px;">${t}</td>
      </tr>
    </table>`).join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
</head>
<body style="margin:0;padding:0;background:#111111;font-family:'Barlow',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">

        <!-- Header -->
        <tr>
          <td style="background:#0B0B0F;padding:32px 40px;border-bottom:1px solid #332b15;">
            <p style="margin:0;font-family:Impact,Arial,sans-serif;font-size:28px;letter-spacing:3px;color:#C9A84C;">LAYERVAULT</p>
            <p style="margin:6px 0 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#888;">Barcelona &middot; Impresi&oacute;n 3D TCG</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">

            <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C9A84C;">&mdash; Confirmaci&oacute;n de pedido</p>
            <h1 style="margin:0 0 24px;font-family:Impact,Arial,sans-serif;font-size:36px;color:#f0f0f0;letter-spacing:2px;">PEDIDO RECIBIDO</h1>

            <p style="margin:0 0 24px;font-size:14px;color:#aaa;line-height:1.6;">
              Hola <strong style="color:#f0f0f0;">${esc(customerName)}</strong>,<br>
              hemos recibido tu pedido. Te respondemos por Telegram en menos de 1 hora para coordinar el pago y los detalles.
            </p>

            <!-- Items -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              ${itemRows}
            </table>

            <!-- Entrega + Total -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="padding:8px 0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Entrega</td>
                <td style="padding:8px 0;font-size:13px;color:#f0f0f0;text-align:right;">${esc(deliveryLine)}</td>
              </tr>
              <tr>
                <td style="padding:12px 0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;border-top:1px solid #2a2a2a;"><strong>Total</strong></td>
                <td style="padding:12px 0;font-size:22px;color:#C9A84C;text-align:right;font-family:Impact,Arial,sans-serif;border-top:1px solid #2a2a2a;">
                  ${(total as number).toFixed(2)} &euro;
                </td>
              </tr>
            </table>

            ${orderId ? `
            <!-- Referencia -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#111118;border-radius:12px;margin-bottom:20px;">
              <tr><td style="padding:16px 24px;">
                <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#888;">N&uacute;mero de pedido</p>
                <p style="margin:0;font-family:Impact,Arial,sans-serif;font-size:22px;letter-spacing:2px;color:#C9A84C;">${esc(orderId)}</p>
              </td></tr>
            </table>

            <!-- Botón seguimiento -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td align="center">
                <a href="${trackingUrl}"
                   style="display:inline-block;background:#C9A84C;color:#000000;font-family:Impact,Arial,sans-serif;font-size:13px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 32px;border-radius:100px;">
                  Ver estado del pedido &rarr;
                </a>
              </td></tr>
            </table>
            ` : ""}

            <!-- Pasos -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#111118;border-radius:12px;margin-bottom:28px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 14px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;">Pr&oacute;ximos pasos</p>
                ${steps}
              </td></tr>
            </table>

            <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">
              &iquest;Dudas? Esc&iacute;rbenos a
              <a href="mailto:${CONTACT_EMAIL}" style="color:#C9A84C;text-decoration:none;">${CONTACT_EMAIL}</a>
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0B0B0F;padding:20px 40px;border-top:1px solid #2a2a2a;text-align:center;">
            <p style="margin:0;font-size:11px;color:#444;letter-spacing:1px;text-transform:uppercase;">
              LayerVault &middot; Barcelona &middot; layervault.es
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const res = await fetch(BREVO_API, {
      method: "POST",
      headers: {
        "accept":       "application/json",
        "content-type": "application/json; charset=utf-8",
        "api-key":      apiKey,
      },
      body: JSON.stringify({
        sender:      { name: FROM_NAME, email: FROM_EMAIL },
        to:          [{ email: customerEmail, name: customerName }],
        bcc:         [{ email: BCC_EMAIL }],
        subject:     "Pedido recibido - LayerVault",
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: 502, body: JSON.stringify({ error: err }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};

export { handler };
