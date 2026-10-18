// Genera docs/marca/assets/paleta.svg a partir de los colores de tailwind.config.js,
// para que la paleta de la guía de marca nunca se desincronice del código.
//   npm run docs:paleta
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const colors = require('../tailwind.config.js').theme.extend.colors;

// Orden y papel de cada color en la guía (los que no estén aquí salen al final como "otros")
const ROLES = {
  'lv-void':    'Fondo más profundo (la cesta)',
  'lv-deep':    'Fondo profundo',
  'lv-black':   'Fondo de la web',
  'lv-surface': 'Superficie',
  'lv-raised':  'Superficie elevada',
  'lv-border':  'Bordes',
  'lv-cream':   'Texto y botón principal',
  'lv-muted':   'Texto secundario',
  'lv-gold':    'Oro: brillo foil y detalles',
  'lv-foil':    'Oro claro: hover y destellos',
  'lv-brass':   'Latón: borde de lo importante',
};

const entries = [
  ...Object.keys(ROLES).filter(k => colors[k]).map(k => [k, colors[k], ROLES[k]]),
  ...Object.entries(colors).filter(([k]) => !ROLES[k]).map(([k, v]) => [k, v, 'otros']),
];

const COLS = 4, W = 220, H = 150, GAP = 16, PAD = 24;
const rows = Math.ceil(entries.length / COLS);
const width = PAD * 2 + COLS * W + (COLS - 1) * GAP;
const height = PAD * 2 + rows * H + (rows - 1) * GAP;

const luminance = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const cards = entries.map(([name, hex, role], i) => {
  const x = PAD + (i % COLS) * (W + GAP);
  const y = PAD + Math.floor(i / COLS) * (H + GAP);
  return `
  <g transform="translate(${x} ${y})">
    <rect width="${W}" height="${H}" rx="14" fill="#161513" stroke="#2c2925"/>
    <rect x="10" y="10" width="${W - 20}" height="76" rx="9" fill="${hex}" stroke="${luminance(hex) < 0.03 ? '#3a3631' : 'none'}"/>
    <text x="14" y="108" font-size="15" font-weight="700" fill="#F5F0E8">${name}</text>
    <text x="${W - 14}" y="108" font-size="13" text-anchor="end" fill="#C9A84C">${hex.toUpperCase()}</text>
    <text x="14" y="132" font-size="12" fill="#8F8A80">${role}</text>
  </g>`;
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Hanken Grotesk, Helvetica, Arial, sans-serif">
  <rect width="100%" height="100%" fill="#0e0e0e"/>${cards}
</svg>
`;

await mkdir('docs/marca/assets', { recursive: true });
await writeFile('docs/marca/assets/paleta.svg', svg);
console.log(`docs/marca/assets/paleta.svg: ${entries.length} colores`);
