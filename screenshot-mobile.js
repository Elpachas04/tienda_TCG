const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const dir = 'C:/Users/Antony/AppData/Local/Temp/claude/mobile-screenshots';
  fs.mkdirSync(dir, { recursive: true });

  // ── LANDING: primera pantalla (hero) ──
  await page.goto('http://localhost:4201/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: dir + '/L1-landing-hero.png' });

  // ── LANDING: scroll a la sección colores ──
  await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'instant' }));
  await page.waitForTimeout(600);
  await page.screenshot({ path: dir + '/L2-landing-colors.png' });

  // ── LANDING: scroll final (footer) ──
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: dir + '/L3-landing-footer.png' });

  // ── CATALOG: primera pantalla ──
  await page.goto('http://localhost:4201/catalog', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: dir + '/C1-catalog-top.png' });

  // ── CATALOG: scroll a productos ──
  await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: dir + '/C2-catalog-products.png' });

  // ── PRODUCT DETAIL: primera pantalla ──
  const href = await page.getAttribute('a[href*="/product/"]', 'href');
  if (href) {
    await page.goto('http://localhost:4201' + href, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: dir + '/PD1-detail-top.png' });
    await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'instant' }));
    await page.waitForTimeout(400);
    await page.screenshot({ path: dir + '/PD2-detail-info.png' });
  }

  // ── CART DRAWER ──
  await page.goto('http://localhost:4201/catalog', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    localStorage.setItem('tcg3d_cart', JSON.stringify([
      { productId: 'p1', productSku: 'SKU-001', productName: 'Deckbox Premium Display', quantity: 2, unitPrice: 19.99, color: 'Negro', variant: 'M' },
      { productId: 'p2', productSku: 'SKU-002', productName: 'Playmat Pirata', quantity: 1, unitPrice: 24.50, color: 'Rojo' }
    ]));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  // Open cart drawer via badge
  const badge = await page.locator('button.rounded-full.bg-lv-gold').first();
  if (badge) { await badge.click(); await page.waitForTimeout(500); }
  await page.screenshot({ path: dir + '/D1-cart-drawer.png' });

  // ── CHECKOUT: primera pantalla ──
  await page.evaluate(() => {
    localStorage.setItem('tcg3d_cart', JSON.stringify([
      { productId: 'p1', productSku: 'SKU-001', productName: 'Deckbox Premium Display', quantity: 1, unitPrice: 19.99, color: 'Negro' }
    ]));
  });
  await page.goto('http://localhost:4201/checkout', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: dir + '/CH1-checkout-top.png' });

  // ── CHECKOUT: scroll al formulario ──
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: dir + '/CH2-checkout-form.png' });

  // ── CHECKOUT: modo envío ──
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(200);
  const btns = await page.locator('button').all();
  for (const b of btns) {
    const t = await b.textContent();
    if (t && t.includes('ENVÍO')) { await b.click(); break; }
  }
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: dir + '/CH3-checkout-shipping.png' });

  // ── TRACKING ──
  await page.goto('http://localhost:4201/seguimiento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: dir + '/T1-tracking.png' });

  await browser.close();
  console.log('Done. Screenshots in', dir);
})().catch(e => { console.error(e.message); process.exit(1); });
