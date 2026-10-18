// Utilidades para componer SVG de marca
export const BRAND = {
  black: '#121212', void: '#0B0B0F', deep: '#0E0E0E', cream: '#F5F0E8', gold: '#C9A84C', foil: '#F3DC95', brass: '#6B5A26',
};

let maskSeq = 0;

/** Pieza a una tinta: lo marcado con data-knock se recorta (queda transparente) mediante una máscara */
export function monoInk(body, color, box = '0 0 512 512') {
  const id = `m${++maskSeq}`;
  const [x, y, w, h] = box.split(' ').map(Number);
  const maskBody = body
    .replace(/fill="var\(--knock, #000\)"/g, 'fill="#000"')
    .replace(/stroke="var\(--knock, #000\)"/g, 'stroke="#000"')
    .replace(new RegExp(`(fill|stroke)="${color.replace('#', '\\#')}"`, 'g'), '$1="#fff"');
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${w}" height="${h}">${maskBody}</mask>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" mask="url(#${id})"/>`;
}

export function svg({ w, h, viewBox = `0 0 ${w} ${h}`, bg = null, body, defs = '', title = 'LayerVault' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${viewBox}" role="img" aria-label="${title}">
<title>${title}</title>
${defs}
${bg ? `<rect x="${viewBox.split(' ')[0]}" y="${viewBox.split(' ')[1]}" width="100%" height="100%" fill="${bg}"/>` : ''}
${body}
</svg>
`;
}

/** Coloca un SVG de 512×512 dentro de otro en (x, y) a escala s */
export const place = (inner, x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">${inner}</g>`;
