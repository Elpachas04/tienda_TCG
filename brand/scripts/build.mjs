// Genera el kit de marca completo de LayerVault en out/LayerVault-marca/
import { mkdir, writeFile, readFile, rm, cp } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lockup, wordmark, mark, THEMES } from './lockups.mjs';
import { emblem, cardMark } from './emblem.mjs';
import { svg, BRAND } from './svg.mjs';
import { png, htmlPng, close } from './render.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));          // brand/
const REPO = join(ROOT, '..');
const OUT = join(ROOT, 'out/LayerVault-marca');
const LOGO = join(REPO, 'src/assets/logo/logo.png');
const FONTS = join(ROOT, 'node_modules/@fontsource');
const dir = async p => { await mkdir(join(OUT, p), { recursive: true }); return join(OUT, p); };
const save = async (p, content) => { await writeFile(join(OUT, p), content); return join(OUT, p); };
const sizeOf = s => s.match(/width="(\d+)" height="(\d+)"/).slice(1).map(Number);
const magick = (...args) => execFileSync('convert', args);
const b64 = async p => (await readFile(p)).toString('base64');

await rm(OUT, { recursive: true, force: true });

// ── 1. SVG vectoriales ────────────────────────────────────────────────────────
const svgFiles = {};
await dir('svg/emblema'); await dir('svg/monograma'); await dir('svg/logotipo'); await dir('svg/logo-horizontal'); await dir('svg/logo-vertical');
for (const t of Object.keys(THEMES)) {
  svgFiles[`emblema-${t}`] = await save(`svg/emblema/emblema-${t}.svg`, mark(t, 'emblem'));
  svgFiles[`monograma-${t}`] = await save(`svg/monograma/monograma-${t}.svg`, mark(t, 'card'));
  svgFiles[`logotipo-${t}`] = await save(`svg/logotipo/logotipo-${t}.svg`, wordmark(t));
  await save(`svg/logotipo/logotipo-lema-${t}.svg`, wordmark(t, { tagline: true }));
  await save(`svg/logotipo/logotipo-clasico-${t}.svg`, wordmark(t, { caps: true, tagline: true }));
  svgFiles[`horizontal-${t}`] = await save(`svg/logo-horizontal/logo-horizontal-${t}.svg`, lockup(t, 'horizontal'));
  svgFiles[`vertical-${t}`] = await save(`svg/logo-vertical/logo-vertical-${t}.svg`, lockup(t, 'vertical'));
  await save(`svg/logo-vertical/logo-vertical-clasico-${t}.svg`, lockup(t, 'vertical', { caps: true }));
}

// ── 2. PNG de los vectoriales a varios tamaños ───────────────────────────────
const raster = async (svgPath, outPath, width) => {
  const s = await readFile(svgPath, 'utf8');
  const [w, h] = sizeOf(s);
  await png(s, outPath, width, Math.round((h / w) * width));
};
await dir('png/emblema'); await dir('png/logo-horizontal'); await dir('png/logo-vertical'); await dir('png/logotipo'); await dir('png/monograma');
for (const t of ['dorado', 'dorado-fondo', 'sobre-claro', 'crema', 'negro', 'oro', 'blanco']) {
  for (const w of [2048, 1024, 512, 256]) await raster(svgFiles[`emblema-${t}`], join(OUT, `png/emblema/emblema-${t}-${w}.png`), w);
  for (const w of [3000, 1500, 800]) await raster(svgFiles[`horizontal-${t}`], join(OUT, `png/logo-horizontal/logo-horizontal-${t}-${w}.png`), w);
  for (const w of [2000, 1000, 500]) await raster(svgFiles[`vertical-${t}`], join(OUT, `png/logo-vertical/logo-vertical-${t}-${w}.png`), w);
  for (const w of [2000, 1000]) await raster(svgFiles[`logotipo-${t}`], join(OUT, `png/logotipo/logotipo-${t}-${w}.png`), w);
  for (const w of [1024, 512]) await raster(svgFiles[`monograma-${t}`], join(OUT, `png/monograma/monograma-${t}-${w}.png`), w);
}

// ── 3. Logo ilustrado original: recortes y tamaños ───────────────────────────
await dir('original');
const orig = join(OUT, 'original');
magick(LOGO, '-trim', '+repage', join(orig, 'logo-ilustrado-completo.png'));
magick(LOGO, '-crop', '1117x885+0+42', '+repage', '-trim', '+repage', join(orig, 'emblema-ilustrado.png'));
for (const w of [1024, 512, 256]) {
  magick(join(orig, 'logo-ilustrado-completo.png'), '-resize', `${w}x`, '-strip', join(orig, `logo-ilustrado-completo-${w}.png`));
  magick(join(orig, 'emblema-ilustrado.png'), '-resize', `${w}x${w}`, '-gravity', 'center', '-background', 'none', '-extent', `${w}x${w}`, '-strip', join(orig, `emblema-ilustrado-${w}.png`));
  magick(join(orig, `emblema-ilustrado-${w}.png`), '-quality', '86', join(orig, `emblema-ilustrado-${w}.webp`));
}
for (const [name, bg] of [['negro', BRAND.black], ['crema', BRAND.cream]]) {
  magick(join(orig, 'logo-ilustrado-completo.png'), '-resize', '1400x1400', '-gravity', 'center', '-background', bg, '-extent', '1800x1800', '-strip', join(orig, `logo-ilustrado-fondo-${name}-1800.png`));
}

// ── 4. Iconos para web y app ─────────────────────────────────────────────────
await dir('iconos');
const ic = join(OUT, 'iconos');
// Icono pequeño: la carta "LV" sobre cuadrado negro redondeado (la puerta no se distingue por debajo de ~64 px)
const smallIcon = (() => {
  const c = cardMark({ id: 'ico' });
  return svg({ w: 512, h: 512, defs: c.defs, body: `<rect width="512" height="512" rx="112" fill="${BRAND.black}"/><g transform="translate(46 46) scale(.82)">${c.body}</g>`, title: 'LayerVault' });
})();
// Icono grande: el emblema sobre negro con un halo cálido
const bigIcon = (inset = 0.86, rx = 0) => {
  const e = emblem({ id: `big${Math.round(inset * 100)}` });
  const s = inset, off = (512 - 512 * s) / 2;
  return svg({ w: 512, h: 512, defs: `${e.defs}<defs><radialGradient id="halo" cx=".5" cy=".46" r=".55"><stop offset="0" stop-color="#2b251c"/><stop offset="1" stop-color="${BRAND.black}"/></radialGradient></defs>`,
    body: `<rect width="512" height="512" rx="${rx}" fill="url(#halo)"/><g transform="translate(${off} ${off}) scale(${s})">${e.body}</g>`, title: 'LayerVault' });
};
await save('iconos/favicon.svg', smallIcon);
for (const s of [16, 32, 48, 64, 96, 128]) await png(smallIcon, join(ic, `favicon-${s}.png`), s, s);
magick(join(ic, 'favicon-16.png'), join(ic, 'favicon-32.png'), join(ic, 'favicon-48.png'), join(ic, 'favicon.ico'));
await png(bigIcon(0.84), join(ic, 'apple-touch-icon.png'), 180, 180, { transparent: false });
await png(bigIcon(0.86), join(ic, 'icon-192.png'), 192, 192);
await png(bigIcon(0.86), join(ic, 'icon-512.png'), 512, 512);
await png(bigIcon(0.62), join(ic, 'icon-maskable-512.png'), 512, 512, { transparent: false }); // zona segura del 80 %
await png(bigIcon(0.62), join(ic, 'icon-maskable-192.png'), 192, 192, { transparent: false });
await save('iconos/site.webmanifest', JSON.stringify({
  name: 'LayerVault — Accesorios TCG', short_name: 'LayerVault', lang: 'es', start_url: '/', display: 'standalone',
  background_color: BRAND.black, theme_color: BRAND.black,
  icons: [
    { src: '/assets/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/assets/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/assets/brand/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2) + '\n');

// ── 5. Redes sociales ────────────────────────────────────────────────────────
await dir('redes');
const fontCss = `
  @font-face { font-family: Bricolage; src: url(data:font/woff2;base64,${await b64(join(FONTS, 'bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff2'))}) format('woff2'); }
  @font-face { font-family: Hanken; src: url(data:font/woff2;base64,${await b64(join(FONTS, 'hanken-grotesk/files/hanken-grotesk-latin-600-normal.woff2'))}) format('woff2'); }`;
const emb = (id) => { const e = emblem({ id }); return svg({ w: 512, h: 512, defs: e.defs, body: e.body }); };
const word = await readFile(svgFiles['logotipo-dorado'], 'utf8');
// El SVG del logotipo trae 24 px de margen interno: al colocarlo se respeta su proporción y se compensa ese margen
const [, , wordW, wordH] = word.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
const wordSized = (w) => word.replace(/width="\d+" height="\d+"/, `width="${w}" height="${Math.round(w * wordH / wordW)}"`);
const wordPad = (w) => Math.round(24 * w / wordW);
const page = (w, h, inner) => `<!doctype html><html><head><style>${fontCss}
  *{margin:0;box-sizing:border-box} html,body{width:${w}px;height:${h}px;background:${BRAND.black};overflow:hidden}
  .stage{position:absolute;inset:0;background:radial-gradient(60% 70% at 30% 45%, #2e281f 0%, #1a1714 45%, ${BRAND.black} 80%)}
  .rule{height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.55) 20%,rgba(201,168,76,.55) 80%,transparent)}
  .h{font-family:Bricolage;font-weight:700;color:${BRAND.cream};letter-spacing:-.03em;line-height:.95}
  .p{font-family:Hanken;font-weight:600;color:rgba(245,240,232,.72)}
  .gold{color:${BRAND.gold}} svg{display:block}
</style></head><body><div class="stage"></div>${inner}</body></html>`;

// Imagen para compartir enlaces (Open Graph / X) 1200×630
await htmlPng(page(1200, 630, `
  <div style="position:absolute;left:70px;top:95px;width:440px;height:440px">${emb('og').replace(/width="512" height="512"/, 'width="440" height="440"')}</div>
  <div style="position:absolute;left:570px;top:150px;width:560px">
    <div style="margin-left:${-wordPad(430)}px;margin-top:${-wordPad(430)}px">${wordSized(430)}</div>
    <div class="rule" style="margin:${26 - wordPad(430)}px 0 30px;width:470px"></div>
    <div class="h" style="font-size:54px">La primera carta que ven es tu caja.</div>
    <div class="p" style="font-size:24px;margin-top:22px;line-height:1.35">Deckboxes y accesorios TCG<br>impresos en 3D en Barcelona</div>
  </div>`), join(OUT, 'redes/og-image-1200x630.png'), 1200, 630);
magick(join(OUT, 'redes/og-image-1200x630.png'), '-quality', '88', '-strip', join(OUT, 'redes/og-image-1200x630.jpg'));

// Foto de perfil (Instagram, WhatsApp, TikTok…) 1080×1080: el emblema en el centro (los perfiles recortan en círculo)
await htmlPng(page(1080, 1080, `<div class="stage" style="background:radial-gradient(50% 50% at 50% 48%, #30291f 0%, #1a1714 55%, ${BRAND.black} 85%)"></div>
  <div style="position:absolute;left:170px;top:170px;width:740px;height:740px">${emb('pf').replace(/width="512" height="512"/, 'width="740" height="740"')}</div>`),
  join(OUT, 'redes/perfil-1080.png'), 1080, 1080);
magick(join(OUT, 'redes/perfil-1080.png'), '-resize', '640x640', join(OUT, 'redes/perfil-640.png'));
magick(join(OUT, 'redes/perfil-1080.png'), '-resize', '320x320', join(OUT, 'redes/perfil-320.png'));

// Cabecera de X / Twitter 1500×500
const hor = await readFile(svgFiles['horizontal-dorado'], 'utf8');
const [hw, hh] = sizeOf(hor);
await htmlPng(page(1500, 500, `<div class="stage" style="background:radial-gradient(45% 80% at 50% 50%, #2e281f 0%, #1a1714 50%, ${BRAND.black} 85%)"></div>
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-56%)">${hor.replace(/width="\d+" height="\d+"/, `width="${Math.round(hw * 0.78)}" height="${Math.round(hh * 0.78)}"`)}</div>
  <div class="rule" style="position:absolute;left:350px;right:350px;bottom:96px"></div>`),
  join(OUT, 'redes/cabecera-x-1500x500.png'), 1500, 500);

// Portada de Facebook 1640×624
await htmlPng(page(1640, 624, `<div class="stage" style="background:radial-gradient(45% 80% at 50% 50%, #2e281f 0%, #1a1714 50%, ${BRAND.black} 85%)"></div>
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)">${hor.replace(/width="\d+" height="\d+"/, `width="${Math.round(hw * 0.86)}" height="${Math.round(hh * 0.86)}"`)}</div>`),
  join(OUT, 'redes/portada-facebook-1640x624.png'), 1640, 624);

// Historia (Instagram / WhatsApp) 1080×1920 con la marca: plantilla con zona libre en el centro
const ver = await readFile(svgFiles['vertical-dorado'], 'utf8');
const [vw, vh] = sizeOf(ver);
await htmlPng(page(1080, 1920, `<div class="stage" style="background:radial-gradient(70% 45% at 50% 30%, #2e281f 0%, #1a1714 50%, ${BRAND.black} 85%)"></div>
  <div style="position:absolute;left:50%;top:260px;transform:translateX(-50%)">${ver.replace(/width="\d+" height="\d+"/, `width="${Math.round(vw * 1.1)}" height="${Math.round(vh * 1.1)}"`)}</div>
  <div class="h" style="position:absolute;left:90px;right:90px;top:1180px;font-size:92px;text-align:center">La primera carta que ven es tu caja.</div>
  <div class="rule" style="position:absolute;left:200px;right:200px;top:1560px"></div>
  <div class="p" style="position:absolute;left:0;right:0;top:1610px;text-align:center;font-size:40px">layervault.es</div>`),
  join(OUT, 'redes/historia-1080x1920.png'), 1080, 1920);

// Publicación cuadrada genérica 1080×1350 (formato vertical de Instagram)
await htmlPng(page(1080, 1350, `<div class="stage" style="background:radial-gradient(60% 45% at 50% 38%, #2e281f 0%, #1a1714 50%, ${BRAND.black} 85%)"></div>
  <div style="position:absolute;left:290px;top:150px;width:500px;height:500px">${emb('post').replace(/width="512" height="512"/, 'width="500" height="500"')}</div>
  <div class="h" style="position:absolute;left:90px;right:90px;top:760px;font-size:84px;text-align:center">Hecho en Barcelona.<br><span class="gold">Impreso para tu mazo.</span></div>
  <div class="p" style="position:absolute;left:0;right:0;bottom:110px;text-align:center;font-size:34px">layervault.es</div>`),
  join(OUT, 'redes/publicacion-1080x1350.png'), 1080, 1350);

// Lámina de marca: todas las versiones en una imagen, para enseñar el kit de un vistazo
const fit = (s, w, h) => s.replace(/width="\d+" height="\d+"/, `width="${w}" height="${h}"`);
const svgOf = async (key) => readFile(svgFiles[key], 'utf8');
const cell = (bg, inner, label, dark = true) => `<div style="background:${bg};border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:28px">
  ${inner}<div class="p" style="font-size:17px;color:${dark ? 'rgba(245,240,232,.6)' : 'rgba(18,18,18,.6)'}">${label}</div></div>`;
const horSized = async (k) => { const s = await svgOf(k); const [w, h] = sizeOf(s); return fit(s, 440, Math.round(440 * h / w)); };
const swatches = [['lv-black', BRAND.black], ['lv-surface', '#1a1a1a'], ['lv-border', '#2a2a2a'], ['lv-brass', BRAND.brass], ['lv-gold', BRAND.gold], ['lv-foil', '#F3DC95'], ['lv-cream', BRAND.cream], ['lv-muted', '#8F8A80']];
await htmlPng(page(1800, 1136, `<div style="position:absolute;inset:0;background:#0e0e0e"></div>
  <div style="position:absolute;inset:60px;display:grid;align-content:start;grid-template-columns:repeat(3,1fr);grid-template-rows:auto 330px 330px 230px;gap:22px">
    <div style="grid-column:1/-1;display:flex;align-items:baseline;justify-content:space-between;padding:0 6px 8px">
      <div class="h" style="font-size:56px">Kit de marca</div><div class="p" style="font-size:20px">LayerVault · layervault.es</div></div>
    ${cell(BRAND.black, await horSized('horizontal-dorado'), 'Dorado · sobre oscuro')}
    ${cell(BRAND.cream, await horSized('horizontal-sobre-claro'), 'Sobre claro', false)}
    ${cell('#3b3026', await horSized('horizontal-crema'), 'Crema · una tinta')}
    ${cell(BRAND.black, await horSized('horizontal-oro'), 'Oro · una tinta')}
    ${cell('#ffffff', await horSized('horizontal-negro'), 'Negro · una tinta', false)}
    ${cell('linear-gradient(135deg,#5b4a3a,#20303a)', await horSized('horizontal-blanco'), 'Blanco · sobre foto')}
    ${cell(BRAND.black, `<div style="display:flex;align-items:end;gap:26px">${fit(await svgOf('emblema-dorado'), 150, 150)}${fit(await svgOf('monograma-dorado'), 96, 96)}
      ${[48, 32, 16].map(s => `<img src="data:image/png;base64,${readFileSync(join(OUT, `iconos/favicon-${s}.png`)).toString('base64')}" width="${s}" height="${s}">`).join('')}</div>`, 'Emblema · monograma · favicon 48/32/16')}
    <div style="grid-column:2/-1;background:${BRAND.black};border-radius:18px;padding:28px;display:grid;grid-template-columns:repeat(8,1fr);gap:14px">
      ${swatches.map(([n, c]) => `<div style="display:flex;flex-direction:column;gap:10px"><div style="flex:1;border-radius:12px;background:${c};border:1px solid rgba(245,240,232,.12)"></div>
        <div class="p" style="font-size:15px;color:${BRAND.cream}">${n}</div><div class="p" style="font-size:14px;margin-top:-6px">${c.toUpperCase()}</div></div>`).join('')}
    </div>
  </div>`), join(OUT, 'lamina-de-marca.png'), 1800, 1136);

await close();

// ── 6. Vectoriales versionados y archivos de la web ──────────────────────────
// brand/svg/ es la fuente vectorial que se guarda en el repo; con --web se copian a la web los iconos y la imagen OG
await rm(join(ROOT, 'svg'), { recursive: true, force: true });
await cp(join(OUT, 'svg'), join(ROOT, 'svg'), { recursive: true });

if (process.argv.includes('--web')) {
  const web = [
    ['iconos/site.webmanifest', 'public/site.webmanifest'],
    ['iconos/apple-touch-icon.png', 'src/assets/apple-touch-icon.png'],
    ['iconos/icon-192.png', 'src/assets/brand/icon-192.png'],
    ['iconos/icon-512.png', 'src/assets/brand/icon-512.png'],
    ['iconos/icon-maskable-512.png', 'src/assets/brand/icon-maskable-512.png'],
    ['redes/og-image-1200x630.jpg', 'src/assets/og-image.jpg'],
  ];
  for (const [from, to] of web) {
    await mkdir(dirname(join(REPO, to)), { recursive: true });
    await cp(join(OUT, from), join(REPO, to));
  }
  console.log(`copiados ${web.length} archivos a la web`);
}
console.log('kit generado en', OUT);
