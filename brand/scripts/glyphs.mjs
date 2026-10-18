// Convierte texto a trazados SVG con las fuentes de la marca (para que el logo no dependa de fuentes instaladas)
import opentype from 'opentype.js';
import { readFileSync } from 'node:fs';

const F = p => opentype.parse(readFileSync(new URL(`../node_modules/@fontsource/${p}`, import.meta.url)).buffer);
export const fonts = {
  monogram: F('cinzel/files/cinzel-latin-800-normal.woff'),
  wordmark: F('bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff'),
  wordmarkBold: F('bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff'),
  tagline: F('hanken-grotesk/files/hanken-grotesk-latin-700-normal.woff'),
};

/** Trazado de un texto, con su caja. tracking en unidades de em (0.1 = 10 %).
 *  Glifo a glifo (sin sustituciones OpenType: algunas fuentes usan tablas que opentype.js no soporta). */
export function textPath(font, text, size, { tracking = 0, kerning = true } = {}) {
  let x = 0;
  const parts = [];
  let top = Infinity, bottom = -Infinity, left = Infinity;
  const glyphs = [...text].map(ch => font.charToGlyph(ch));
  glyphs.forEach((g, i) => {
    const p = g.getPath(x, 0, size);
    parts.push(p.toPathData(2));
    const bb = p.getBoundingBox();
    if (isFinite(bb.y1)) { top = Math.min(top, bb.y1); bottom = Math.max(bottom, bb.y2); left = Math.min(left, bb.x1); }
    let adv = g.advanceWidth * size / font.unitsPerEm;
    if (kerning && i < glyphs.length - 1) adv += font.getKerningValue(g, glyphs[i + 1]) * size / font.unitsPerEm;
    x += adv + tracking * size;
  });
  const width = x - tracking * size;
  return { d: parts.join(' '), width, top, bottom, left };
}
