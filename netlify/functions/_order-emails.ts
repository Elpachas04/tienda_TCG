// Emails automáticos al cambiar el estado de un pedido desde el admin.
// Misma estética que el de "Pedido recibido" (send-confirmation.ts), en versión corta.

const BREVO_API  = "https://api.brevo.com/v3/smtp/email";
const FROM_EMAIL = "hola@layervault.es";
const FROM_NAME  = "LayerVault";
const SITE_URL   = "https://layervault.es";
const WHATSAPP   = "34644794412";

export interface OrderEmailData {
  orderId:        string;
  customerName:   string;
  customerEmail:  string;
  pickup:         boolean;
  trackingNumber?: string;
}

/** Estados que avisan al cliente. El resto solo se guardan en Notion. */
export const EMAIL_STATUSES = ["Pago recibido", "Enviado"] as const;

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function content(status: string, d: OrderEmailData): { subject: string; title: string; body: string } | null {
  const name = esc(d.customerName.split(" ")[0] || d.customerName);
  if (status === "Pago recibido") {
    return {
      subject: `Pago recibido · ${d.orderId}`,
      title: "Pago recibido",
      body: `Hola ${name}, ya tenemos tu Bizum. Tu pedido entra en fabricaci&oacute;n y estar&aacute; listo en 3&ndash;7 d&iacute;as laborables.
             ${d.pickup ? "Cuando est&eacute; listo te escribimos por WhatsApp para quedar." : "Cuando salga hacia tu oficina de Correos te mandamos otro email con el seguimiento."}`,
    };
  }
  if (status === "Enviado") {
    if (d.pickup) {
      return {
        subject: `Tu pedido está listo · ${d.orderId}`,
        title: "Listo para recoger",
        body: `Hola ${name}, tu pedido ya est&aacute; terminado. Te escribimos por WhatsApp para acordar d&oacute;nde y cu&aacute;ndo lo recoges.`,
      };
    }
    const tracking = d.trackingNumber
      ? `<p style="margin:20px 0 0;font-size:12px;color:#888;">N&uacute;mero de seguimiento de Correos</p>
         <p style="margin:4px 0 0;font-size:18px;letter-spacing:1px;color:#F5F0E8;">${esc(d.trackingNumber)}</p>
         <p style="margin:12px 0 0;"><a href="https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking-number=${encodeURIComponent(d.trackingNumber)}" style="color:#C9A84C;">Seguir el env&iacute;o en Correos</a></p>`
      : "";
    return {
      subject: `Tu pedido va de camino · ${d.orderId}`,
      title: "Pedido enviado",
      body: `Hola ${name}, tu pedido ya est&aacute; en Correos camino de la oficina que elegiste. Te avisar&aacute;n cuando llegue.${tracking}`,
    };
  }
  return null;
}

function layout(title: string, body: string, orderId: string): string {
  const trackingUrl = `${SITE_URL}/seguimiento?id=${encodeURIComponent(orderId)}`;
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#111111;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;padding:40px 20px;"><tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1a1a1a;border-radius:16px;border:1px solid #2a2a2a;">
      <tr><td style="background:#0B0B0F;padding:28px 40px;border-bottom:1px solid #332b15;border-radius:16px 16px 0 0;">
        <p style="margin:0;font-size:22px;font-weight:bold;color:#F5F0E8;">LayerVault</p>
      </td></tr>
      <tr><td style="padding:36px 40px;">
        <h1 style="margin:0 0 16px;font-size:28px;color:#F5F0E8;">${title}</h1>
        <div style="font-size:15px;line-height:1.6;color:#bbbbbb;">${body}</div>
        <p style="margin:28px 0 0;font-size:12px;color:#888;">Pedido</p>
        <p style="margin:4px 0 0;font-size:16px;color:#C9A84C;">${esc(orderId)}</p>
        <p style="margin:24px 0 0;"><a href="${trackingUrl}" style="display:inline-block;background:#F5F0E8;color:#121212;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 22px;border-radius:999px;">Ver estado del pedido</a></p>
      </td></tr>
      <tr><td style="padding:20px 40px 30px;border-top:1px solid #2a2a2a;">
        <p style="margin:0;font-size:12px;color:#888;line-height:1.7;">&iquest;Dudas? Escr&iacute;benos por <a href="https://wa.me/${WHATSAPP}" style="color:#C9A84C;">WhatsApp</a> o a <a href="mailto:${FROM_EMAIL}" style="color:#C9A84C;">${FROM_EMAIL}</a>.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

/** Devuelve true si se ha enviado. Nunca lanza: un fallo del email no debe deshacer el cambio de estado. */
export async function sendStatusEmail(status: string, d: OrderEmailData): Promise<boolean> {
  const apiKey = process.env["BREVO_API_KEY"];
  const c = content(status, d);
  if (!apiKey || !c || !d.customerEmail) return false;
  try {
    const res = await fetch(BREVO_API, {
      method: "POST",
      headers: { "accept": "application/json", "content-type": "application/json; charset=utf-8", "api-key": apiKey },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: d.customerEmail, name: d.customerName }],
        subject: c.subject,
        htmlContent: layout(c.title, c.body, d.orderId),
      }),
    });
    if (!res.ok) console.error("Brevo error:", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("Brevo error:", err);
    return false;
  }
}
