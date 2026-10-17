// Prueba de integración de las invitaciones: compila las funciones reales con esbuild contra un almacén en memoria
// (fake-blobs.mjs) y dobles de Brevo y Telegram, y recorre el ciclo completo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = await mkdtemp(join(tmpdir(), 'lv-referrals-'));
const load = async (entry, name) => {
  await build({
    entryPoints: [join(here, '../../netlify/functions', entry)],
    bundle: true, platform: 'node', format: 'esm', logLevel: 'warning',
    alias: { '@netlify/blobs': join(here, 'fake-blobs.mjs') },
    external: ['@netlify/functions'],
    outfile: join(out, `${name}.mjs`),
  });
  return import(pathToFileURL(join(out, `${name}.mjs`)).href);
};

process.env.ADMIN_SECRET = 'test-secret';
process.env.BREVO_API_KEY = 'k';
process.env.TELEGRAM_BOT_TOKEN = 't';
process.env.TELEGRAM_CHAT_ID = 'c';
const emails = [];
const telegrams = [];
globalThis.fetch = async (url, init) => {
  if (String(url).includes('brevo')) { emails.push(JSON.parse(init.body)); return new Response('{}', { status: 201 }); }
  if (String(url).includes('telegram')) { telegrams.push(JSON.parse(init.body).text); return new Response('{}'); }
  throw new Error('unexpected fetch ' + url);
};

const referrals = await load('_referrals.ts', 'referrals');
const { default: couponFn } = await load('coupon-check.ts', 'coupon');
const { handler: orderFn } = await load('send-telegram.ts', 'order');

const ORIGIN = 'https://layervault.es';
const checkCoupon = async (code, email) => (await couponFn(new Request(`${ORIGIN}/api/coupon`, {
  method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json' }, body: JSON.stringify({ code, email }),
}))).json();
const order = (email, couponCode, totalAmount) => orderFn({
  httpMethod: 'POST', headers: { origin: ORIGIN },
  body: JSON.stringify({
    customerName: 'Bea Ruiz', customerEmail: email, customerPhone: '612345678', deliveryMethod: 'shipping', postalCode: '08015',
    items: [{ productId: 'deckbox-ventana', productName: 'Leader Display Box', quantity: 2, unitPrice: 25 }],
    couponCode, totalAmount,
  }),
});

let invite, orderId;

test('apagadas: no hay códigos válidos', async () => {
  // El catálogo del repo trae las invitaciones apagadas
  assert.equal(await referrals.referralsEnabled(), false);
  assert.equal((await checkCoupon('NAKAMA-AAAAA', 'bea@mail.com')).reason, 'disabled');
});

test('activadas: el cliente tiene un código fijo y no puede usar el suyo', async () => {
  const { getStore } = await import(pathToFileURL(join(here, 'fake-blobs.mjs')).href);
  await getStore('products').setJSON('catalog', { settings: { referralsEnabled: true } });
  invite = await referrals.inviteCodeFor('ana@mail.com', 'Ana López');
  assert.match(invite, /^NAKAMA-[A-Z2-9]{5}$/);
  assert.equal(await referrals.inviteCodeFor('ana@mail.com'), invite, 'siempre el mismo');
  assert.equal((await checkCoupon(invite, 'ana@mail.com')).reason, 'own_code');
  const ok = await checkCoupon(invite.toLowerCase(), 'bea@mail.com');
  assert.equal(ok.ok, true);
  assert.equal(ok.amount, 5);
});

test('pedido del amigo: 50 € con envío gratis y 5 € menos; el código queda gastado para ese email', async () => {
  assert.equal((await order('bea@mail.com', invite, 50)).statusCode, 400, 'sin descontar no cuadra');
  const res = await order('bea@mail.com', invite, 45);
  assert.equal(res.statusCode, 200, res.body);
  orderId = JSON.parse(res.body).orderId;
  assert.match(telegrams.at(-1), /Envío:<\/b> Gratis/);
  assert.match(telegrams.at(-1), new RegExp(`Invitación ${invite}:</b> −5\\.00€`));
  assert.equal((await checkCoupon(invite, 'bea@mail.com')).reason, 'already_used');
  assert.equal((await order('bea@mail.com', invite, 45)).statusCode, 400, 'no se puede repetir');
});

test('entregado: quien invitó recibe un vale personal de un solo uso', async () => {
  assert.equal(await referrals.rewardReferrer(orderId), true);
  assert.equal(await referrals.rewardReferrer(orderId), false, 'solo una vez');
  const mail = emails.at(-1);
  assert.equal(mail.to[0].email, 'ana@mail.com');
  const vale = mail.htmlContent.match(/VALE-[A-Z2-9]{6}/)[0];
  assert.equal((await checkCoupon(vale, 'bea@mail.com')).reason, 'not_found', 'es personal');

  const res = await orderFn({
    httpMethod: 'POST', headers: { origin: ORIGIN },
    body: JSON.stringify({ customerName: 'Ana', customerEmail: 'ana@mail.com', customerPhone: '612345678', deliveryMethod: 'pickup',
      items: [{ productId: 'deckbox-ventana', productName: 'Leader Display Box', quantity: 2, unitPrice: 15 }], couponCode: vale, totalAmount: 25 }),
  });
  assert.equal(res.statusCode, 200, res.body);
  assert.equal((await checkCoupon(vale, 'ana@mail.com')).reason, 'already_used');
});

test('por debajo del mínimo el código no descuenta ni se gasta', async () => {
  const res = await orderFn({
    httpMethod: 'POST', headers: { origin: ORIGIN },
    body: JSON.stringify({ customerName: 'Carla', customerEmail: 'carla@mail.com', customerPhone: '612345678', deliveryMethod: 'pickup',
      items: [{ productId: 'deckbox-ventana', productName: 'Leader Display Box', quantity: 1, unitPrice: 15 }], couponCode: invite, totalAmount: 15 }),
  });
  assert.equal(res.statusCode, 200, res.body);
  assert.equal((await checkCoupon(invite, 'carla@mail.com')).ok, true, 'sigue disponible para Carla');
});
