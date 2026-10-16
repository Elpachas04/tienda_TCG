// Emails automáticos al cambiar el estado de un pedido desde el admin.
// Maquetación común en _email-kit.ts (la misma que el de "Pedido recibido", send-confirmation.ts).

import { esc, layout, bigValue, button, progress, trackingUrl } from "./_email-kit";

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

// Los emails de estado son cortos a propósito: qué ha cambiado, en qué paso está y un botón.
function content(status: string, d: OrderEmailData): EmailContent | null {
  const greeting = `Hola, ${esc(d.customerName.trim().split(/\s+/)[0] || d.customerName)}`;
  const statusButton = button(trackingUrl(d.orderId), "Ver el estado del pedido");

  if (status === "Pago recibido") {
    return {
      subject: `Pago recibido · ${d.orderId}`,
      html: layout({
        preheader: "Tu pedido entra en fabricación: estará listo en 3–7 días laborables.",
        orderId: d.orderId, greeting,
        title: "Pago recibido",
        lede: d.pickup
          ? "Tu pedido entra en fabricaci&oacute;n. En 3&ndash;7 d&iacute;as laborables estar&aacute; listo y te escribimos por WhatsApp para quedar."
          : "Tu pedido entra en fabricaci&oacute;n. En 3&ndash;7 d&iacute;as laborables sale hacia tu oficina de Correos y te mandamos el seguimiento.",
        blocks: [progress(2, d.pickup), statusButton],
      }),
    };
  }

  if (status === "Enviado" && d.pickup) {
    return {
      subject: `Tu pedido está listo · ${d.orderId}`,
      html: layout({
        preheader: "Tu pedido está terminado. Te escribimos por WhatsApp para quedar.",
        orderId: d.orderId, greeting,
        title: "Listo para recoger",
        lede: "Tu pedido ya est&aacute; terminado. Te escribimos por WhatsApp para quedar.",
        blocks: [progress(3, true), statusButton],
      }),
    };
  }

  if (status === "Enviado") {
    const correosUrl = d.trackingNumber
      ? `https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking-number=${encodeURIComponent(d.trackingNumber)}`
      : "";
    return {
      subject: `Tu pedido va de camino · ${d.orderId}`,
      html: layout({
        preheader: d.trackingNumber ? `Seguimiento de Correos: ${d.trackingNumber}` : "Tu pedido ya está en Correos.",
        orderId: d.orderId, greeting,
        title: "Tu pedido va de camino",
        lede: "Ya est&aacute; en Correos, rumbo a la oficina que elegiste. Cuando llegue, Correos te avisar&aacute; para que pases a recogerlo.",
        blocks: d.trackingNumber
          ? [
              progress(3, false),
              bigValue("N&uacute;mero de seguimiento", esc(d.trackingNumber), { gold: true, last: true }),
              button(correosUrl, "Seguir el env&iacute;o en Correos"),
            ]
          : [progress(3, false), statusButton],
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
