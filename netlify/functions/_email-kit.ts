// Piezas comunes de los emails al cliente (Brevo). HTML de email: tablas y estilos en línea,
// porque Gmail y Outlook ignoran casi todo lo demás. Misma línea visual que la web (rediseño "Foil"):
// fondo casi negro, titulares en crema, el dorado solo para detalles.

export const SITE_URL      = "https://layervault.es";
export const CONTACT_EMAIL = "hola@layervault.es";
export const WHATSAPP      = "34644794412";
export const WHATSAPP_TXT  = "644 794 412";
export const BIZUM         = "674 012 922";

const C = {
  page:    "#0e0e0e",
  card:    "#161513",
  panel:   "#1e1c19",
  line:    "#2c2925",
  brass:   "#6B5A26",
  gold:    "#C9A84C",
  foil:    "#F3DC95",
  cream:   "#F5F0E8",
  text:    "#C4BEB3",
  muted:   "#8F8A80",
};

const FONT_DISPLAY = "'Bricolage Grotesque','Hanken Grotesk',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const FONT_BODY    = "'Hanken Grotesk',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

export function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function eur(n: number): string {
  return `${n.toFixed(2).replace(".", ",")}&nbsp;&euro;`;
}

export function trackingUrl(orderId: string): string {
  return `${SITE_URL}/seguimiento?id=${encodeURIComponent(orderId)}`;
}

/** Hueco vertical. En email los márgenes no son fiables; una fila con altura sí. */
export function gap(px: number): string {
  return `<tr><td height="${px}" style="height:${px}px;line-height:${px}px;font-size:0;">&nbsp;</td></tr>`;
}

export function paragraph(html: string, opts: { size?: number; color?: string; lineHeight?: number } = {}): string {
  return `<tr><td style="font-family:${FONT_BODY};font-size:${opts.size ?? 16}px;line-height:${opts.lineHeight ?? 1.6};color:${opts.color ?? C.text};">${html}</td></tr>`;
}

export function strong(html: string): string {
  return `<strong style="color:${C.cream};font-weight:600;">${html}</strong>`;
}

export function link(href: string, label: string): string {
  return `<a href="${href}" style="color:${C.gold};text-decoration:underline;text-underline-offset:2px;">${label}</a>`;
}

/** Enlace a Google Maps (abre la app de mapas en el móvil) */
export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** Enlace secundario suelto, debajo del botón */
export function textLink(href: string, label: string): string {
  return paragraph(link(href, label), { size: 14 });
}

/** Botón principal: crema, como en la web */
export function button(href: string, label: string): string {
  return `<tr><td>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td bgcolor="${C.cream}" style="border-radius:999px;background:${C.cream};">
        <a href="${href}" style="display:inline-block;padding:14px 28px;font-family:${FONT_BODY};font-size:15px;font-weight:700;line-height:1;color:#121212;text-decoration:none;border-radius:999px;">${label}</a>
      </td>
    </tr></table>
  </td></tr>`;
}

/** Bloque con fondo propio y título pequeño. `accent` le pone el borde latón para lo importante (el pago). */
export function panel(title: string, inner: string, opts: { accent?: boolean } = {}): string {
  return `<tr><td>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.panel}"
           style="background:${C.panel};border-radius:12px;border:1px solid ${opts.accent ? C.brass : C.line};">
      <tr><td style="padding:22px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="font-family:${FONT_DISPLAY};font-size:17px;font-weight:700;line-height:1.3;color:${C.cream};padding-bottom:14px;">${title}</td></tr>
          ${inner}
        </table>
      </td></tr>
    </table>
  </td></tr>`;
}

/** Dato grande con su etiqueta encima (Bizum, concepto, nº de seguimiento) */
export function bigValue(label: string, value: string, opts: { gold?: boolean; last?: boolean } = {}): string {
  return `<tr><td style="padding-bottom:${opts.last ? 0 : 16}px;">
    <div style="font-family:${FONT_BODY};font-size:13px;line-height:1.4;color:${C.muted};">${label}</div>
    <div style="font-family:${FONT_DISPLAY};font-size:24px;font-weight:700;line-height:1.25;letter-spacing:0.5px;color:${opts.gold ? C.foil : C.cream};">${value}</div>
  </td></tr>`;
}

/** Fila etiqueta / valor alineado a la derecha */
export function row(label: string, value: string, opts: { sub?: string; top?: boolean; total?: boolean } = {}): string {
  const border = opts.top ? `border-top:1px solid ${C.line};` : "";
  const pad = opts.top ? "14px 0 0" : "0 0 12px";
  return `<tr><td style="${border}padding:${pad};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="${opts.total ? "bottom" : "top"}" style="font-family:${FONT_BODY};font-size:15px;line-height:1.45;color:${opts.total ? C.cream : C.text};${opts.total ? "font-weight:700;" : ""}">
        ${label}${opts.sub ? `<div style="font-size:13px;color:${C.muted};padding-top:2px;">${opts.sub}</div>` : ""}
      </td>
      <td valign="${opts.total ? "bottom" : "top"}" align="right" style="padding-left:16px;white-space:nowrap;font-family:${opts.total ? FONT_DISPLAY : FONT_BODY};font-size:${opts.total ? 22 : 15}px;font-weight:${opts.total ? 700 : 500};line-height:1.3;color:${C.cream};">${value}</td>
    </tr></table>
  </td></tr>`;
}

/** Lista numerada con círculos */
export function steps(items: string[]): string {
  return items.map((t, i) => `<tr><td style="padding-bottom:${i === items.length - 1 ? 0 : 14}px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="top" width="26" style="width:26px;">
        <div style="width:24px;height:24px;border-radius:12px;border:1px solid ${C.brass};text-align:center;font-family:${FONT_BODY};font-size:12px;font-weight:700;line-height:24px;color:${C.gold};">${i + 1}</div>
      </td>
      <td valign="top" style="padding-left:12px;font-family:${FONT_BODY};font-size:15px;line-height:1.5;color:${C.text};padding-top:2px;">${t}</td>
    </tr></table>
  </td></tr>`).join("");
}

/**
 * Barra de progreso del pedido. `done` = pasos terminados; el siguiente se marca como "en curso".
 * Pasos: pedido, pago, fabricación, envío (o recogida).
 */
export function progress(done: number, pickup: boolean): string {
  const labels = ["Pedido", "Pago", "Fabricación", pickup ? "Recogida" : "Envío"];
  const cells = labels.map((label, i) => {
    const state = i < done ? "done" : i === done ? "now" : "todo";
    const bar   = state === "done" ? C.gold : state === "now" ? C.brass : C.line;
    const color = state === "todo" ? C.muted : C.cream;
    const weight = state === "now" ? 700 : 500;
    return `<td width="25%" valign="top" style="width:25%;padding:0 ${i === 3 ? 0 : 4}px 0 ${i === 0 ? 0 : 4}px;">
      <div style="height:4px;line-height:4px;font-size:0;border-radius:2px;background:${bar};">&nbsp;</div>
      <div style="padding-top:8px;font-family:${FONT_BODY};font-size:12px;line-height:1.3;font-weight:${weight};color:${color};">${label}</div>
    </td>`;
  }).join("");
  return `<tr><td>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${cells}</tr></table>
  </td></tr>`;
}

export interface LayoutOptions {
  preheader: string;   // texto que se ve en la bandeja de entrada junto al asunto
  orderId?:  string;
  greeting:  string;   // "Hola, Marta" — va solo, encima del titular
  title:     string;
  lede:      string;   // una o dos frases, no más
  blocks:    string[]; // filas <tr> (paragraph, panel, button…); entre bloques se pone aire
}

export function layout(o: LayoutOptions): string {
  const body = o.blocks.filter(Boolean).join(gap(28));
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @media (max-width: 620px) {
      .lv-pad { padding-left: 22px !important; padding-right: 22px !important; }
      .lv-title { font-size: 28px !important; }
    }
    a { color: ${C.gold}; }
  </style>
</head>
<body style="margin:0;padding:0;background:${C.page};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.page};">${o.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}" style="background:${C.page};">
    <tr><td align="center" style="padding:32px 12px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.card}"
             style="width:100%;max-width:600px;background:${C.card};border:1px solid ${C.line};border-radius:18px;">

        <!-- Filete dorado -->
        <tr><td height="3" bgcolor="${C.gold}" style="height:3px;line-height:3px;font-size:0;border-radius:18px 18px 0 0;background:${C.gold};background-image:linear-gradient(90deg,${C.brass},${C.foil} 50%,${C.brass});">&nbsp;</td></tr>

        <!-- Cabecera -->
        <tr><td class="lv-pad" style="padding:26px 40px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="font-family:${FONT_DISPLAY};font-size:20px;font-weight:700;letter-spacing:-0.3px;color:${C.cream};">
              <a href="${SITE_URL}" style="color:${C.cream};text-decoration:none;">LayerVault</a>
            </td>
            ${o.orderId ? `<td align="right" style="font-family:${FONT_BODY};font-size:13px;color:${C.muted};white-space:nowrap;">Pedido ${esc(o.orderId)}</td>` : ""}
          </tr></table>
        </td></tr>

        <!-- Titular: saludo, titular y una entradilla corta con aire entre cada cosa -->
        <tr><td class="lv-pad" style="padding:44px 40px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${paragraph(o.greeting, { size: 16, color: C.muted })}
            ${gap(10)}
            <tr><td class="lv-title" style="font-family:${FONT_DISPLAY};font-size:36px;font-weight:700;line-height:1.1;letter-spacing:-0.9px;color:${C.cream};">${o.title}</td></tr>
            ${gap(18)}
            <tr><td>
              <table role="presentation" width="460" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:460px;">
                ${paragraph(o.lede, { size: 17, lineHeight: 1.7 })}
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Contenido -->
        <tr><td class="lv-pad" style="padding:36px 40px 44px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${body}
          </table>
        </td></tr>

        <!-- Pie -->
        <tr><td class="lv-pad" style="padding:22px 40px 28px;border-top:1px solid ${C.line};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${paragraph(`&iquest;Dudas? ${link(`https://wa.me/${WHATSAPP}`, "WhatsApp")} o responde a este email.`, { size: 14, color: C.muted })}
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
