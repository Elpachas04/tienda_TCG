// Prueba de integración del recordatorio de checkout: compila las funciones de Netlify con esbuild,
// sustituyendo @netlify/blobs por un almacén en memoria (fake-blobs.mjs) y fetch por un doble de Brevo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = await mkdtemp(join(tmpdir(), 'lv-drafts-'));
for (const name of ['checkout-draft', 'checkout-reminders']) {
  await build({
    entryPoints: [join(here, `../../netlify/functions/${name}.ts`)],
    bundle: true, platform: 'node', format: 'esm', logLevel: 'warning',
    alias: { '@netlify/blobs': join(here, 'fake-blobs.mjs') },
    external: ['@netlify/functions'],
    outfile: join(out, `${name}.mjs`),
  });
}

process.env.ADMIN_SECRET = 'test-secret';
process.env.BREVO_API_KEY = 'k';
const sent = [];
globalThis.fetch = async (url, init) => {
  if (String(url).includes('brevo')) { sent.push(JSON.parse(init.body)); return new Response('{}', { status: 201 }); }
  throw new Error('unexpected fetch ' + url);
};

const { default: draftFn } = await import(pathToFileURL(join(out, 'checkout-draft.mjs')).href);
const { default: reminders } = await import(pathToFileURL(join(out, 'checkout-reminders.mjs')).href);
const store = () => globalThis.__stores.get('checkout-drafts');
const hash = e => createHash('sha256').update(e).digest('hex');
const ORIGIN = { Origin: 'https://layervault.es', 'Content-Type': 'application/json' };
const call = (method, body, qs = '') => draftFn(new Request(`https://layervault.es/api/checkout-draft${qs}`, { method, headers: ORIGIN, body: body && JSON.stringify(body) }));
const item = { productId: 'deckbox-ventana', productName: 'NOMBRE FALSO <script>', color: 'Negro', quantity: 2, unitPrice: 15 };

test('guarda la cesta con el nombre del catálogo y descarta productos inexistentes', async () => {
  const res = await call('POST', { email: 'Ana@Mail.com', name: 'Ana López', items: [item, { productId: 'no-existe', quantity: 1, unitPrice: 5 }] });
  assert.equal(res.status, 200);
  const d = JSON.parse(store().get(`draft/${hash('ana@mail.com')}`));
  assert.equal(d.items.length, 1);
  assert.equal(d.items[0].productName, 'Leader Display Box');
});

test('rechaza sin Origin válido y sin email válido', async () => {
  const r1 = await draftFn(new Request('https://layervault.es/api/checkout-draft', { method: 'POST', body: '{}' }));
  assert.equal(r1.status, 403);
  assert.equal((await call('POST', { email: 'x', items: [item] })).status, 400);
});

test('recordatorio: una vez a las 24 h, con enlaces firmados; no se repite', async () => {
  const key = `draft/${hash('ana@mail.com')}`;
  const d = JSON.parse(store().get(key));
  store().set(key, JSON.stringify({ ...d, updatedAt: new Date(Date.now() - 25 * 3600e3).toISOString() }));
  await reminders();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to[0].email, 'ana@mail.com');
  assert.match(sent[0].htmlContent, /Hola, Ana/);
  assert.doesNotMatch(sent[0].htmlContent, /NOMBRE FALSO/);
  await reminders();
  assert.equal(sent.length, 1, 'no repite');

  const ref = decodeURIComponent(sent[0].htmlContent.match(/recuperar=([^"&]+)/)[1]);
  const restored = await (await call('GET', undefined, `?recuperar=${encodeURIComponent(ref)}`)).json();
  assert.equal(restored.items[0].quantity, 2);
  assert.equal((await call('GET', undefined, `?recuperar=${ref.slice(0, -2)}xx`)).status, 404);

  const confirm = await (await call('GET', undefined, `?baja=${encodeURIComponent(ref)}`)).text();
  assert.match(confirm, /<form method="post">/);
  assert.ok(store().has(key), 'GET no borra');
  await call('POST', undefined, `?baja=${encodeURIComponent(ref)}`);
  assert.ok(!store().has(key), 'POST de la baja borra');
});

test('no vuelve a escribir al mismo email dentro de los 30 días', async () => {
  await call('POST', { email: 'ana@mail.com', items: [item] });
  const key = `draft/${hash('ana@mail.com')}`;
  const d = JSON.parse(store().get(key));
  store().set(key, JSON.stringify({ ...d, updatedAt: new Date(Date.now() - 25 * 3600e3).toISOString() }));
  await reminders();
  assert.equal(sent.length, 1);
  assert.ok(!store().has(key));
});

test('borra cestas de más de 7 días y no escribe pasadas 72 h', async () => {
  await call('POST', { email: 'viejo@mail.com', items: [item] });
  await call('POST', { email: 'tarde@mail.com', items: [item] });
  const set = (e, h) => { const k = `draft/${hash(e)}`; const d = JSON.parse(store().get(k)); store().set(k, JSON.stringify({ ...d, updatedAt: new Date(Date.now() - h * 3600e3).toISOString() })); };
  set('viejo@mail.com', 8 * 24);
  set('tarde@mail.com', 80);
  await reminders();
  assert.equal(sent.length, 1);
  assert.ok(!store().has(`draft/${hash('viejo@mail.com')}`));
  assert.ok(store().has(`draft/${hash('tarde@mail.com')}`));
});

test('DELETE borra al desmarcar la casilla', async () => {
  await call('DELETE', { email: 'tarde@mail.com' });
  assert.ok(!store().has(`draft/${hash('tarde@mail.com')}`));
});
