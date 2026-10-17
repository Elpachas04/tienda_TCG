// Emails automáticos al cambiar el estado de un pedido desde el admin.
// Maquetación común en _email-kit.ts (la misma que el de "Pedido recibido", send-confirmation.ts).

import { reviewUrl } from "./_reviews";
import { inviteBlock } from "./_referrals";
import { esc, layout, bigValue, button, link, mapsUrl, paragraph, progress, strong, trackingUrl } from "./_email-kit";

const BREVO_API  = "https://api.brevo.com/v3/smtp/email";
const FROM_EMAIL = "hola@layervault.es";
const FROM_NAME  = "LayerVault";

export interface OrderEmailData {
  orderId:        string;
  customerName:   string;
  customerEmail:  string;
  pickup:         boolean;
  trackingNumber?: string;
  oficina?:       string;   // "Nombre · Dirección, CP Localidad" (columna "Oficina" de Notion)
  inviteCode?:    string;   // código para invitar (solo con las invitaciones activadas, email de "Entregado")
}

/** Estados que avisan al cliente. El resto solo se guardan en Notion. */
export const EMAIL_STATUSES = ["Pago recibido", "Enviado", "Entregado"] as const;

interface EmailContent { subject: string; html: string }

/** Oficina de destino, con la dirección como enlace a Maps */
function officeBlock(oficina?: string): string {
  if (!oficina) return "";
  const [nombre, direccion] = oficina.split(" · ");
  return `<tr><td>
    <div style="font-family:'Hanken Grotesk',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.4;color:#8F8A80;">Tu oficina</div>
    <div style="font-family:'Hanken Grotesk',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:#F5F0E8;padding-top:2px;">${esc(nombre)}</div>
    ${direccion ? `<div style="font-family:'Hanken Grotesk',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;">${link(mapsUrl(oficina.replace(" · ", ", ")), esc(direccion))}</div>` : ""}
  </td></tr>`;
}

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
        blocks: [
          progress(3, false),
          d.trackingNumber ? bigValue("N&uacute;mero de seguimiento", esc(d.trackingNumber), { gold: true, last: true }) : "",
          officeBlock(d.oficina),
          d.trackingNumber ? button(correosUrl, "Seguir el env&iacute;o en Correos") : statusButton,
        ],
      }),
    };
  }
  if (status === "Entregado") {
    return {
      subject: `¿Ha llegado todo bien? · ${d.orderId}`,
      html: layout({
        preheader: "¿Qué te ha parecido? Valora tu pedido en un minuto.",
        orderId: d.orderId, greeting,
        title: "Ya lo tienes",
        lede: "Esperamos que te guste. &iquest;Nos cuentas qu&eacute; te parece? Es un minuto y nos ayuda much&iacute;simo.",
        blocks: [
          progress(4, d.pickup),
          button(reviewUrl(d.orderId), "Valorar mi pedido"),
          d.inviteCode ? inviteBlock(d.inviteCode) : "",
          paragraph(`Si hay alg&uacute;n problema, escr&iacute;benos en los ${strong("7 d&iacute;as")} siguientes. Si tiene un defecto, nos la devuelves y te enviamos una nueva; si te has arrepentido, nos la devuelves y te damos un vale por el importe.`, { size: 14 }),
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
