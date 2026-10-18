// Emblema de LayerVault en vectorial: puerta de cámara acorazada con la carta "LV" en el centro.
// Redibujo simplificado del logo ilustrado (src/assets/logo/logo.png) para que se vea nítido a cualquier tamaño.
import { fonts, textPath } from './glyphs.mjs';

const C = 256; // centro del lienzo 512 × 512
const rad = d => (d * Math.PI) / 180;
const pt = (r, deg) => [C + r * Math.cos(rad(deg)), C + r * Math.sin(rad(deg))];
const f = n => +n.toFixed(2);

export const METAL = {
  light: '#F7E7B6', hi: '#E8CC84', mid: '#C9A84C', low: '#9C7B33', deep: '#6B5A26',
  ink: '#241B0E', void: '#120F0B', engrave: '#3A2D14',
};

function defs(id) {
  return `<defs>
    <linearGradient id="${id}-metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${METAL.light}"/><stop offset=".25" stop-color="${METAL.hi}"/>
      <stop offset=".52" stop-color="${METAL.mid}"/><stop offset=".78" stop-color="${METAL.low}"/>
      <stop offset="1" stop-color="${METAL.deep}"/>
    </linearGradient>
    <linearGradient id="${id}-bar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${METAL.light}"/><stop offset=".45" stop-color="${METAL.mid}"/>
      <stop offset="1" stop-color="${METAL.deep}"/>
    </linearGradient>
    <linearGradient id="${id}-card" x1=".15" y1="0" x2=".85" y2="1">
      <stop offset="0" stop-color="#F3DC95"/><stop offset=".45" stop-color="#D7B866"/>
      <stop offset="1" stop-color="#A8853A"/>
    </linearGradient>
    <radialGradient id="${id}-void" cx=".5" cy=".42" r=".6">
      <stop offset="0" stop-color="#2A2219"/><stop offset="1" stop-color="${METAL.void}"/>
    </radialGradient>
    <radialGradient id="${id}-knob" cx=".35" cy=".3" r=".75">
      <stop offset="0" stop-color="${METAL.light}"/><stop offset=".5" stop-color="${METAL.mid}"/>
      <stop offset="1" stop-color="${METAL.deep}"/>
    </radialGradient>
  </defs>`;
}

function monogram() {
  // "LV" en Cinzel 800 centrado en la carta, con la V solapando un poco la L como en el original
  const size = 126;
  const L = textPath(fonts.monogram, 'L', size);
  const V = textPath(fonts.monogram, 'V', size);
  const overlap = 0.2 * size;
  const width = L.width + V.width - overlap;
  const x0 = C - width / 2;
  const capH = -L.top; // altura de mayúscula (top es negativo)
  const y0 = C + capH / 2;
  return {
    d: `<path transform="translate(${f(x0)} ${f(y0)})" d="${L.d}"/><path transform="translate(${f(x0 + L.width - overlap)} ${f(y0)})" d="${V.d}"/>`,
  };
}

/**
 * variant: 'metal' (dorado con relieve) o 'mono' (una tinta, con huecos transparentes)
 * color: tinta del modo mono
 */
export function emblem({ variant = 'metal', color = METAL.mid, id = 'lv' } = {}) {
  const mono = variant === 'mono';
  const metal = `url(#${id}-metal)`, bar = `url(#${id}-bar)`, knob = `url(#${id}-knob)`;
  const ink = mono ? color : null;
  const parts = [];
  // Cerrojo: barra maciza con un brillo encima (un degradado por caja no pinta líneas horizontales)
  const bolt = (x1, y1, x2, y2, w) => mono
    ? `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${ink}" stroke-width="${w}" stroke-linecap="round"/>`
    : `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${METAL.low}" stroke-width="${w}" stroke-linecap="round"/>
       <line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${METAL.mid}" stroke-width="${w - 6}" stroke-linecap="round"/>
       <line x1="${f(x1)}" y1="${f(y1 - w / 5)}" x2="${f(x2)}" y2="${f(y2 - w / 5)}" stroke="${METAL.light}" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>`;

  // Bisagras a la izquierda (la "C" del original)
  const hinge = (y) => `
    <rect x="70" y="${y - 15}" width="150" height="30" rx="6" fill="${ink ?? bar}"/>
    <rect x="56" y="${y - 36}" width="34" height="72" rx="10" fill="${ink ?? knob}" ${mono ? '' : `stroke="${METAL.engrave}" stroke-width="2"`}/>
    ${mono ? '' : `<line x1="58" y1="${y}" x2="88" y2="${y}" stroke="${METAL.engrave}" stroke-width="2"/>`}`;
  parts.push(`<rect x="78" y="150" width="26" height="212" rx="6" fill="${ink ?? bar}"/>`);
  parts.push(hinge(148), hinge(364));

  // Cerrojos a la derecha y a la izquierda
  for (const deg of [-46, 0, 46]) {
    const [x1, y1] = pt(150, deg), [x2, y2] = pt(236, deg);
    parts.push(bolt(x1, y1, x2, y2, 18));
    const [kx, ky] = pt(244, deg);
    parts.push(`<circle cx="${f(kx)}" cy="${f(ky)}" r="21" fill="${ink ?? knob}" ${mono ? '' : `stroke="${METAL.engrave}" stroke-width="2"`}/>`);
    if (!mono) parts.push(`<circle cx="${f(kx)}" cy="${f(ky)}" r="9" fill="none" stroke="${METAL.engrave}" stroke-width="2" opacity=".6"/>`);
  }

  // Anillo de la puerta con remaches
  if (mono) {
    parts.push(`<circle cx="${C}" cy="${C}" r="196" fill="none" stroke="${ink}" stroke-width="30"/>`);
  } else {
    parts.push(`<circle cx="${C}" cy="${C}" r="196" fill="none" stroke="${metal}" stroke-width="30"/>`);
    parts.push(`<circle cx="${C}" cy="${C}" r="211" fill="none" stroke="${METAL.engrave}" stroke-width="2"/>`);
    parts.push(`<circle cx="${C}" cy="${C}" r="181" fill="none" stroke="${METAL.engrave}" stroke-width="2"/>`);
  }
  for (let i = 0; i < 24; i++) {
    const [x, y] = pt(196, i * 15 + 7.5);
    parts.push(`<circle cx="${f(x)}" cy="${f(y)}" r="4.6" fill="${mono ? 'var(--knock, #000)' : METAL.engrave}" ${mono ? 'data-knock="1"' : ''}/>`);
    if (!mono) parts.push(`<circle cx="${f(x - 1)}" cy="${f(y - 1)}" r="2.6" fill="${METAL.light}" opacity=".85"/>`);
  }

  // Interior de la cámara y engranaje (en una tinta, el interior se recorta para que no se vean las bisagras detrás)
  parts.push(mono
    ? `<circle cx="${C}" cy="${C}" r="181" fill="var(--knock, #000)" data-knock="1"/>`
    : `<circle cx="${C}" cy="${C}" r="180" fill="url(#${id}-void)"/>`);
  parts.push(`<circle cx="${C}" cy="${C}" r="164" fill="none" stroke="${ink ?? METAL.low}" stroke-width="12" stroke-dasharray="11 9" ${mono ? '' : 'opacity=".9"'}/>`);
  parts.push(`<circle cx="${C}" cy="${C}" r="150" fill="none" stroke="${ink ?? METAL.mid}" stroke-width="3" ${mono ? '' : 'opacity=".55"'}/>`);

  // Los cerrojos pasan por delante del interior (se repiten los tramos interiores)
  for (const deg of [-46, 0, 46]) {
    const [x1, y1] = pt(84, deg), [x2, y2] = pt(182, deg);
    parts.push(bolt(x1, y1, x2, y2, 16));
  }

  // La carta
  const cw = 170, ch = 240, cx = C - cw / 2, cy = C - ch / 2;
  const frame = (inset, notch) => {
    const x1 = cx + inset, x2 = cx + cw - inset, y1 = cy + inset, y2 = cy + ch - inset, m = C;
    return `M${x1} ${y1} H${m - notch} L${m - notch / 2} ${y1 + notch / 2} H${m + notch / 2} L${m + notch} ${y1} H${x2} V${y2} H${m + notch} L${m + notch / 2} ${y2 - notch / 2} H${m - notch / 2} L${m - notch} ${y2} H${x1} Z`;
  };
  const mg = monogram();
  if (mono) {
    parts.push(`<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="16" fill="${ink}"/>`);
    parts.push(`<path d="${frame(12, 26)}" fill="none" stroke="var(--knock, #000)" stroke-width="3" data-knock="1"/>`);
    parts.push(`<g fill="var(--knock, #000)" data-knock="1">${mg.d}</g>`);
  } else {
    parts.push(`<rect x="${cx - 6}" y="${cy - 6}" width="${cw + 12}" height="${ch + 12}" rx="20" fill="${METAL.ink}" opacity=".85"/>`);
    parts.push(`<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="16" fill="url(#${id}-card)" stroke="${METAL.engrave}" stroke-width="2.5"/>`);
    parts.push(`<path d="${frame(12, 26)}" fill="none" stroke="${METAL.engrave}" stroke-width="2.4" opacity=".75"/>`);
    parts.push(`<path d="${frame(19, 20)}" fill="none" stroke="${METAL.light}" stroke-width="1.2" opacity=".55"/>`);
    // trazos tipo circuito, como el grabado de la carta original
    parts.push(`<g fill="none" stroke="${METAL.low}" stroke-width="1.4" opacity=".55" stroke-linecap="round">
      <path d="M${cx + 30} ${cy + 64} h22 l14 14 v22"/><path d="M${cx + cw - 30} ${cy + 64} h-22 l-14 14 v22"/>
      <path d="M${cx + 30} ${cy + ch - 64} h22 l14 -14 v-22"/><path d="M${cx + cw - 30} ${cy + ch - 64} h-22 l-14 -14 v-22"/>
    </g>`);
    // monograma grabado: luz desplazada + tinta
    parts.push(`<g fill="${METAL.light}" opacity=".7" transform="translate(1.4 2)">${mg.d}</g>`);
    parts.push(`<g fill="${METAL.ink}">${mg.d}</g>`);
  }

  // La composición (bisagras a la izquierda, cerrojos a la derecha) se desplaza para quedar centrada en el lienzo
  return { defs: mono ? '' : defs(id), body: `<g transform="translate(-32 0)">${parts.join('\n')}</g>` };
}

/** Monograma solo (la carta con "LV"): para tamaños pequeños donde la puerta no se distingue */
export function cardMark({ variant = 'metal', color = METAL.mid, id = 'lvc' } = {}) {
  const mono = variant === 'mono';
  const cw = 300, ch = 420, cx = C - cw / 2, cy = C - ch / 2;
  const size = 196;
  const L = textPath(fonts.monogram, 'L', size), V = textPath(fonts.monogram, 'V', size);
  const overlap = 0.2 * size, width = L.width + V.width - overlap;
  const x0 = C - width / 2, y0 = C + (-L.top) / 2;
  const lv = `<path transform="translate(${f(x0)} ${f(y0)})" d="${L.d}"/><path transform="translate(${f(x0 + L.width - overlap)} ${f(y0)})" d="${V.d}"/>`;
  if (mono) {
    return { defs: '', body: `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="30" fill="${color}"/>
      <rect x="${cx + 18}" y="${cy + 18}" width="${cw - 36}" height="${ch - 36}" rx="18" fill="none" stroke="var(--knock, #000)" stroke-width="5" data-knock="1"/>
      <g fill="var(--knock, #000)" data-knock="1">${lv}</g>` };
  }
  return {
    defs: defs(id),
    body: `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="30" fill="url(#${id}-card)" stroke="${METAL.engrave}" stroke-width="4"/>
      <rect x="${cx + 18}" y="${cy + 18}" width="${cw - 36}" height="${ch - 36}" rx="18" fill="none" stroke="${METAL.engrave}" stroke-width="3.5" opacity=".7"/>
      <rect x="${cx + 28}" y="${cy + 28}" width="${cw - 56}" height="${ch - 56}" rx="12" fill="none" stroke="${METAL.light}" stroke-width="1.6" opacity=".55"/>
      <g fill="${METAL.light}" opacity=".7" transform="translate(2 3)">${lv}</g>
      <g fill="${METAL.ink}">${lv}</g>`,
  };
}
