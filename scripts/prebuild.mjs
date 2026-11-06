// Antes de `ng build`: trae el catálogo real (el que se edita en el admin) y genera a partir de él
// la lista de páginas a prerenderizar y el sitemap. Así las fichas salen en el HTML con sus datos.
//   node scripts/prebuild.mjs          → usa el catálogo del repo (src/assets/data/products.json)
//   node scripts/prebuild.mjs --live   → antes lo descarga de producción (lo hace Netlify en cada deploy)
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { buildMerchantFeed } from './lib/merchant-feed.mjs';
import { fetchReviewSummary } from './lib/review-summary.mjs';

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
const pages = ['/', '/catalog', ...products.map(p => `/product/${p.id}`), '/legal', '/privacidad', '/cookies'];

// /404 se prerenderiza para tener un HTML propio, pero no va al sitemap
await writeFile('prerender-routes.txt', [...pages, '/404'].join('\n') + '\n');

const today = new Date().toISOString().slice(0, 10);
const urls = pages.map(path => `  <url>\n    <loc>${path === '/' ? SITE + '/' : SITE + path}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`);
await writeFile('public/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);

console.log(`prebuild: ${pages.length} páginas en el sitemap y en el prerender`);

await mkdir('public/feeds', { recursive: true });
await writeFile('public/feeds/google-merchant.xml',
  buildMerchantFeed({ site: SITE, brand: catalog.settings?.shopName ?? 'LayerVault', products, categories: catalog.categories }));
console.log('prebuild: feed de Google Merchant en /feeds/google-merchant.xml');

// Sin --live se deja el resumen que haya (vacío en el repo), para que el build local no dependa de producción
if (live) {
  try {
    const summary = await fetchReviewSummary({ site: SITE, enabled: !!catalog.settings?.reviewsVisible });
    await writeFile('src/assets/data/review-summary.json', JSON.stringify(summary, null, 2) + '\n');
    console.log(`prebuild: valoraciones de ${Object.keys(summary).length} productos en los datos estructurados`);
  } catch (err) {
    console.warn(`prebuild: no se pudieron leer las valoraciones (${err.message}); la ficha sale sin nota media`);
  }
}

// Cloudinary crea cada tamaño de foto la primera vez que alguien lo pide, y eso tarda segundos.
// En cada deploy pedimos por adelantado los que usa la web (mismas transformaciones que cloudinary.service.ts),
// en AVIF y WebP, que es lo que sirven Chrome y Safari con f_auto. Si falla, no para el build.
if (live) {
  const BASE = 'https://res.cloudinary.com/dew1whfdu/image/upload';
  const SIZES = [
    'f_auto,q_auto:good,c_fit,w_360,h_360',   // stageCard
    'f_auto,q_auto:good,c_fit,w_700,h_700',   // stageDetail
    'f_auto,q_auto:low,c_fit,w_120,h_120',    // stageThumb
  ];
  const ids = [...new Set(products.flatMap(p => p.images ?? []))].filter(Boolean);
  const jobs = ids.flatMap(id => SIZES.flatMap(t => ['image/avif,image/webp,*/*', 'image/webp,*/*'].map(accept => ({ url: `${BASE}/${t}/${id}`, accept }))));
  const started = Date.now();
  let ok = 0;
  const worker = async () => {
    while (jobs.length && Date.now() - started < 120_000) {
      const { url, accept } = jobs.shift();
      try {
        const res = await fetch(url, { headers: { Accept: accept }, signal: AbortSignal.timeout(20_000) });
        await res.arrayBuffer();
        if (res.ok) ok++;
      } catch { /* siguiente */ }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  console.log(`prebuild: ${ok} fotos preparadas en Cloudinary (${Math.round((Date.now() - started) / 1000)} s)`);
}
