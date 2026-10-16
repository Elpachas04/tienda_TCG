// Antes de `ng build`: trae el catálogo real (el que se edita en el admin) y genera a partir de él
// la lista de páginas a prerenderizar y el sitemap. Así las fichas salen en el HTML con sus datos.
//   node scripts/prebuild.mjs          → usa el catálogo del repo (src/assets/data/products.json)
//   node scripts/prebuild.mjs --live   → antes lo descarga de producción (lo hace Netlify en cada deploy)
import { readFile, writeFile } from 'node:fs/promises';

const SITE = 'https://layervault.es';
const SEED = 'src/assets/data/products.json';
const live = process.argv.includes('--live') || process.env.NETLIFY === 'true';

let catalog = JSON.parse(await readFile(SEED, 'utf8'));

if (live) {
  try {
    const res = await fetch(`${SITE}/api/products`, {
      headers: { Referer: `${SITE}/` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const remote = await res.json();
    if (!Array.isArray(remote?.products) || remote.products.length === 0) throw new Error('catálogo vacío');
    catalog = remote;
    await writeFile(SEED, JSON.stringify(catalog, null, 2) + '\n');
    console.log(`prebuild: catálogo de producción (${catalog.products.length} productos)`);
  } catch (err) {
    console.warn(`prebuild: no se pudo descargar el catálogo (${err.message}); se usa el del repo`);
  }
}

const products = catalog.products.filter(p => !p.hidden);
const pages = ['/', '/catalog', ...products.map(p => `/product/${p.id}`), '/legal', '/privacidad'];

// /404 se prerenderiza para tener un HTML propio, pero no va al sitemap
await writeFile('prerender-routes.txt', [...pages, '/404'].join('\n') + '\n');

const today = new Date().toISOString().slice(0, 10);
const urls = pages.map(path => `  <url>\n    <loc>${path === '/' ? SITE + '/' : SITE + path}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`);
await writeFile('public/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);

console.log(`prebuild: ${pages.length} páginas en el sitemap y en el prerender`);
