// Logotipo (texto en trazados) y composiciones del logo: horizontal y vertical, en cada combinación de color
import { fonts, textPath } from './glyphs.mjs';
import { emblem, cardMark, METAL } from './emblem.mjs';
import { svg, monoInk, BRAND } from './svg.mjs';

const f = n => +n.toFixed(2);

/** Temas de color: cómo se pinta cada parte */
export const THEMES = {
  dorado:        { emblem: 'metal', word: 'metal', tag: BRAND.gold, bg: null, label: 'Dorado (sobre oscuro)' },
  'dorado-fondo': { emblem: 'metal', word: 'metal', tag: BRAND.gold, bg: BRAND.black, label: 'Dorado con fondo negro' },
  'sobre-claro': { emblem: 'metal', word: BRAND.black, tag: BRAND.brass, bg: null, label: 'Para fondos claros' },
  oro:           { emblem: BRAND.gold, word: BRAND.gold, tag: BRAND.gold, bg: null, label: 'Oro plano (una tinta)' },
  crema:         { emblem: BRAND.cream, word: BRAND.cream, tag: BRAND.cream, bg: null, label: 'Crema (una tinta, sobre oscuro)' },
  negro:         { emblem: BRAND.black, word: BRAND.black, tag: BRAND.black, bg: null, label: 'Negro (una tinta, sobre claro)' },
  blanco:        { emblem: '#FFFFFF', word: '#FFFFFF', tag: '#FFFFFF', bg: null, label: 'Blanco (una tinta, sobre foto)' },
};

const textGradient = (id, y1, y2) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${f(y1)}" x2="0" y2="${f(y2)}">
  <stop offset="0" stop-color="#F3DC95"/><stop offset=".42" stop-color="#D9B85E"/><stop offset=".75" stop-color="${METAL.mid}"/><stop offset="1" stop-color="#9C7B33"/>
</linearGradient>`;

/** Emblema (o carta) como bloque colocable: devuelve defs y cuerpo a escala dentro de una caja */
function markBlock(theme, x, y, size, uid, kind = 'emblem') {
  const make = kind === 'card' ? cardMark : emblem;
  const s = size / 512;
  if (theme.emblem === 'metal') {
    const e = make({ id: uid });
    return { defs: e.defs, body: `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">${e.body}</g>` };
  }
  const e = make({ variant: 'mono', color: theme.emblem });
  return { defs: '', body: `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">${monoInk(e.body, theme.emblem)}</g>` };
}

function words(caps) {
  const word = caps
    ? textPath(fonts.wordmark, 'LAYERVAULT', 100, { tracking: 0.02 })
    : textPath(fonts.wordmark, 'LayerVault', 100, { tracking: -0.02 });
  const tag = textPath(fonts.tagline, 'TCG 3D SHOP', 100, { tracking: 0.3 });
  return { word, tag };
}

/** Solo el logotipo */
export function wordmark(themeName, { caps = false, tagline = false } = {}) {
  const t = THEMES[themeName];
  const { word, tag } = words(caps);
  const pad = 24, wordSize = 100;
  const tagScale = tagline ? (word.width * 0.62) / tag.width : 0;
  const tagH = tagline ? (tag.bottom - tag.top) * tagScale : 0;
  const w = word.width + pad * 2;
  const h = (word.bottom - word.top) + (tagline ? tagH + 26 : 0) + pad * 2;
  const wy = pad - word.top;
  const gid = `wg-${themeName}-${caps ? 'c' : 'n'}`;
  const fill = t.word === 'metal' ? `url(#${gid})` : t.word;
  let body = `<path transform="translate(${pad} ${f(wy)})" d="${word.d}" fill="${fill}"/>`;
  if (tagline) {
    const ty = wy + word.bottom + 26 - tag.top * tagScale;
    const tx = pad + (word.width - tag.width * tagScale) / 2;
    body += `<path transform="translate(${f(tx)} ${f(ty)}) scale(${f(tagScale)})" d="${tag.d}" fill="${t.tag}"/>`;
  }
  const defs = t.word === 'metal' ? `<defs>${textGradient(gid, wy + word.top, wy + word.bottom)}</defs>` : '';
  return svg({ w: Math.ceil(w), h: Math.ceil(h), bg: t.bg, defs, body, title: 'LayerVault' });
}

/** Logo completo: emblema + logotipo (+ lema) */
export function lockup(themeName, layout = 'horizontal', { caps = false, mark = 'emblem' } = {}) {
  const t = THEMES[themeName];
  const { word, tag } = words(caps);
  const uid = `${layout}-${themeName}-${mark}`;
  const gid = `${uid}-wg`;
  const wordFill = t.word === 'metal' ? `url(#${gid})` : t.word;
  const wordH = word.bottom - word.top;

  if (layout === 'horizontal') {
    const pad = 40, E = 300;                        // emblema de 300 px de alto
    const ws = (E * 0.36) / (-word.top);            // altura de mayúscula ≈ 36 % del emblema
    const tagScale = (word.width * ws * 0.62) / tag.width;
    const tagH = (tag.bottom - tag.top) * tagScale;
    const gap = E * 0.12;
    const blockH = wordH * ws + 22 + tagH;
    const textX = pad + E + gap;
    const top = pad + (E - blockH) / 2;
    const wy = top - word.top * ws;
    const ty = wy + word.bottom * ws + 22 - tag.top * tagScale;
    const w = textX + word.width * ws + pad;
    const h = E + pad * 2;
    const m = markBlock(t, pad, pad, E, uid, mark);
    const defs = `<defs>${t.word === 'metal' ? textGradient(gid, wy + word.top * ws, wy + word.bottom * ws) : ''}</defs>${m.defs}`;
    const body = `${m.body}
      <path transform="translate(${f(textX)} ${f(wy)}) scale(${f(ws)})" d="${word.d}" fill="${wordFill}"/>
      <path transform="translate(${f(textX)} ${f(ty)}) scale(${f(tagScale)})" d="${tag.d}" fill="${t.tag}"/>`;
    return svg({ w: Math.ceil(w), h: Math.ceil(h), bg: t.bg, defs, body });
  }

  // vertical: emblema arriba, logotipo y lema centrados debajo
  const pad = 48, E = 420;
  const ws = (E * 1.05) / word.width;
  const tagScale = (word.width * ws * 0.62) / tag.width;
  const tagH = (tag.bottom - tag.top) * tagScale;
  const w = Math.max(E, word.width * ws) + pad * 2;
  const wy = pad + E + 30 - word.top * ws;
  const ty = wy + word.bottom * ws + 24 - tag.top * tagScale;
  const h = ty + tag.bottom * tagScale + pad;
  const m = markBlock(t, (w - E) / 2, pad, E, uid, mark);
  const wx = (w - word.width * ws) / 2, tx = (w - tag.width * tagScale) / 2;
  const defs = `<defs>${t.word === 'metal' ? textGradient(gid, wy + word.top * ws, wy + word.bottom * ws) : ''}</defs>${m.defs}`;
  const body = `${m.body}
    <path transform="translate(${f(wx)} ${f(wy)}) scale(${f(ws)})" d="${word.d}" fill="${wordFill}"/>
    <path transform="translate(${f(tx)} ${f(ty)}) scale(${f(tagScale)})" d="${tag.d}" fill="${t.tag}"/>`;
  return svg({ w: Math.ceil(w), h: Math.ceil(h), bg: t.bg, defs, body });
}

/** Emblema o carta sueltos en 512×512 */
export function mark(themeName, kind = 'emblem', { bg } = {}) {
  const t = THEMES[themeName];
  const m = markBlock(t, 0, 0, 512, `m-${kind}-${themeName}`, kind);
  return svg({ w: 512, h: 512, bg: bg ?? t.bg, defs: m.defs, body: m.body, title: 'LayerVault' });
}
