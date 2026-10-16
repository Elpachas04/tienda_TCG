// Emails automáticos al cambiar el estado de un pedido desde el admin.
// Maquetación común en _email-kit.ts (la misma que el de "Pedido recibido", send-confirmation.ts).

import { esc, layout, panel, bigValue, button, link, paragraph, progress, strong, trackingUrl } from "./_email-kit";

const BREVO_API  = "https://api.brevo.com/v3/smtp/email";
const FROM_EMAIL = "hola@layervault.es";
const FROM_NAME  = "LayerVault";

export interface OrderEmailData {
  orderId:        string;
  customerName:   string;
  customerEmail:  string;
  pickup:         boolean;
  trackingNumber?: string;
}

/** Estados que avisan al cliente. El resto solo se guardan en Notion. */
export const EMAIL_STATUSES = ["Pago recibido", "Enviado"] as const;

interface EmailContent { subject: string; html: string }

function content(status: string, d: OrderEmailData): EmailContent | null {
  const name = esc(d.customerName.trim().split(/\s+/)[0] || d.customerName);
  const statusButton = button(trackingUrl(d.orderId), "Ver el estado del pedido");

  if (status === "Pago recibido") {
    return {
      subject: `Pago recibido · ${d.orderId}`,
      html: layout({
        preheader: "Tu pedido entra en fabricación: estará listo en 3–7 días laborables.",
        orderId: d.orderId,
        title: "Pago recibido",
        lede: `Hola ${name}, ya tenemos tu Bizum. Tu pedido entra en fabricaci&oacute;n.`,
        blocks: [
          progress(2, d.pickup),
          paragraph(`Lo tendremos listo en ${strong("3&ndash;7 d&iacute;as laborables")}. ${d.pickup
            ? "Cuando est&eacute; terminado te escribimos por WhatsApp para quedar."
            : "Cuando salga hacia tu oficina de Correos te mandamos otro email con el n&uacute;mero de seguimiento."}`),
          statusButton,
        ],
      }),
    };
  }

  if (status === "Enviado") {
    if (d.pickup) {
      return {
        subject: `Tu pedido está listo · ${d.orderId}`,
        html: layout({
          preheader: "Tu pedido está terminado. Te escribimos por WhatsApp para quedar.",
          orderId: d.orderId,
          title: "Listo para recoger",
          lede: `Hola ${name}, tu pedido ya est&aacute; terminado.`,
          blocks: [
            progress(3, true),
            paragraph("Te escribimos por WhatsApp para acordar d&oacute;nde y cu&aacute;ndo te lo damos."),
            statusButton,
          ],
        }),
      };
    }
    const correosUrl = d.trackingNumber
      ? `https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking-number=${encodeURIComponent(d.trackingNumber)}`
      : "";
    return {
      subject: `Tu pedido va de camino · ${d.orderId}`,
      html: layout({
        preheader: d.trackingNumber ? `Seguimiento de Correos: ${d.trackingNumber}` : "Tu pedido ya está en Correos.",
        orderId: d.orderId,
        title: "Tu pedido va de camino",
        lede: `Hola ${name}, tu pedido ya est&aacute; en Correos, camino de la oficina que elegiste. Correos te avisar&aacute; cuando llegue.`,
        blocks: [
          progress(3, false),
          d.trackingNumber ? panel("Seguimiento", `
            ${bigValue("N&uacute;mero de Correos", esc(d.trackingNumber), { gold: true })}
            ${paragraph(link(correosUrl, "Seguir el env&iacute;o en Correos"), { size: 15 })}
          `, { accent: true }) : "",
          statusButton,
        ],
      }),
    };
  }
  return null;
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
        htmlContent: c.html,
      }),
    });
    if (!res.ok) console.error("Brevo error:", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("Brevo error:", err);
    return false;
  }
}
