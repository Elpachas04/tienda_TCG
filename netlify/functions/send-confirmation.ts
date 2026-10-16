import type { Handler, HandlerEvent } from "@netlify/functions";
import { originOk, MAX_BODY } from "./_guard";
import {
  BIZUM, CONTACT_EMAIL, bigValue, button, esc, eur, layout, panel, paragraph, row, strong, trackingUrl,
} from "./_email-kit";

const BREVO_API  = "https://api.brevo.com/v3/smtp/email";
const FROM_EMAIL = CONTACT_EMAIL;
const FROM_NAME  = "LayerVault";
const BCC_EMAIL  = CONTACT_EMAIL;

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  if (!originOk(event.headers)) {
    return { statusCode: 403, body: "Forbidden" };
  }

  if ((event.body?.length ?? 0) > MAX_BODY) {
    return { statusCode: 413, body: "Payload Too Large" };
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

  const { customerName, customerEmail, items, deliveryLine, deliveryMethod, oficina, total, orderId } = body as {
    customerName:   string;
    customerEmail:  string;
    items:          { name: string; qty: number; variant?: string; color?: string; leader?: string; price: number }[];
    deliveryLine:   string;
    deliveryMethod?: string;
    oficina?:       { nombre: string; direccion: string; codigoPostal: string; localidad: string };
    total:          number;
    orderId:        string;
  };

  if (!customerEmail || !customerName || !items) {
    return { statusCode: 400, body: JSON.stringify({ error: "Datos incompletos" }) };
  }

  type Item = { name: string; qty: number; variant?: string; color?: string; leader?: string; price: number };
  const pickup = deliveryMethod !== "shipping";
  const firstName = esc(customerName.trim().split(/\s+/)[0] || customerName);

  const itemRows = (items as Item[]).map(i => {
    const detail = [i.variant, i.color, i.leader ? `Líder: ${i.leader}` : undefined].filter(Boolean).map(v => esc(v as string)).join(" &middot; ");
    return row(`${i.qty > 1 ? `${i.qty} &times; ` : ""}${esc(i.name)}`, eur(i.price * i.qty), { sub: detail || undefined });
  }).join("");

  // La entrega va como una línea más del pedido, con su coste a la derecha (deliveryLine: "Correos · CP 08015 — 4.50 €")
  const shippingCost = Number(deliveryLine.match(/([\d.,]+)\s*€\s*$/)?.[1]?.replace(",", ".") ?? NaN);
  const deliveryRow = pickup
    ? row("Entrega en mano", "Gratis", { sub: "Quedamos por WhatsApp" })
    : row("Env&iacute;o a oficina de Correos", Number.isFinite(shippingCost) ? eur(shippingCost) : "", {
        sub: oficina
          ? `${esc(oficina.nombre)}<br>${esc(oficina.direccion)}, ${esc(oficina.codigoPostal)} ${esc(oficina.localidad)}`
          : esc(deliveryLine.replace(/\s+—\s+[\d.,]+\s*€\s*$/, "")),
      });

  const html = layout({
    preheader: orderId
      ? `Haz el Bizum al ${BIZUM} con el concepto ${esc(orderId)} y nos ponemos con tu pedido.`
      : "Hemos recibido tu pedido.",
    orderId,
    greeting: `Hola, ${firstName}`,
    title: "Pedido recibido",
    lede: "Solo falta el Bizum. En cuanto llegue te lo confirmamos, en menos de 1&nbsp;hora de lunes a s&aacute;bado.",
    blocks: [
      orderId ? panel("Paga con Bizum", `
        ${bigValue("Bizum al", BIZUM)}
        ${bigValue("Concepto: ponlo tal cual", esc(orderId), { gold: true, last: true })}
      `, { accent: true }) : "",

      panel("Tu pedido", `
        ${itemRows}
        ${deliveryRow}
        ${row("Total", eur(total as number), { top: true, total: true })}
      `),

      paragraph(pickup
        ? `Despu&eacute;s lo fabricamos en ${strong("3&ndash;7 d&iacute;as laborables")} y te escribimos por WhatsApp para d&aacute;rtelo en mano.`
        : `Despu&eacute;s lo fabricamos en ${strong("3&ndash;7 d&iacute;as laborables")} y lo enviamos a tu oficina de Correos. Te mandaremos el n&uacute;mero de seguimiento.`),

      orderId ? button(trackingUrl(orderId), "Ver el estado del pedido") : "",
    ],
  });

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
        subject:     orderId ? `Pedido recibido · ${orderId}` : "Pedido recibido · LayerVault",
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
