// Renderiza SVG/HTML a PNG con Chromium headless (el mismo motor que el navegador, así el PNG es fiel al SVG).
// Usa el Chromium de Playwright; CHROMIUM_PATH permite apuntar a otro ejecutable.
import { chromium } from 'playwright';

let browser;
async function open() {
  browser ??= await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  return browser;
}
export async function close() { await browser?.close(); browser = null; }

async function shot(html, outPath, w, h, transparent) {
  const page = await (await open()).newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.screenshot({ path: outPath, omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
  await page.close();
}

/** svgString → PNG en outPath a w×h (si transparent, sin fondo) */
export async function png(svgString, outPath, w, h, { transparent = true } = {}) {
  const sized = svgString.replace(/<svg([^>]*?) width="[^"]*" height="[^"]*"/, `<svg$1 width="${w}" height="${h}"`);
  await shot(`<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block}</style></head><body>${sized}</body></html>`, outPath, w, h, transparent);
}

/** HTML arbitrario → PNG (composiciones de redes) */
export async function htmlPng(html, outPath, w, h, { transparent = false } = {}) {
  await shot(html, outPath, w, h, transparent);
}
