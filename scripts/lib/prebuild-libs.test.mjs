import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarize } from './review-summary.mjs';
import { buildMerchantFeed } from './merchant-feed.mjs';

test('summarize: media redondeada a un decimal por producto, sin contar dos veces el mismo producto', () => {
  const out = summarize([
    { rating: 5, productIds: ['a', 'b'] },
    { rating: 4, productIds: ['a', 'a'] },
    { rating: 4, productIds: ['a'] },
    { rating: 'x', productIds: ['a'] },
  ]);
  assert.deepEqual(out, { a: { average: 4.3, count: 3 }, b: { average: 5, count: 1 } });
});

test('buildMerchantFeed: una entrada por variante, agrupadas y con el texto escapado', () => {
  const xml = buildMerchantFeed({
    site: 'https://example.com',
    brand: 'LV',
    categories: [{ id: 'tools', label: 'Herramientas' }],
    products: [
      { id: 'apl', sku: 'APL', name: 'A & B', description: 'd', category: 'tools', images: ['img1'], price: 20, available: true,
        variants: [{ label: '60 cartas', price: 20 }, { label: '100 cartas', price: 25 }] },
      { id: 'sin-foto', name: 'X', description: 'd', category: 'tools', images: [], price: 5, available: true },
    ],
  });
  assert.equal((xml.match(/<item>/g) ?? []).length, 2);
  assert.match(xml, /<g:id>APL-100-cartas<\/g:id>/);
  assert.match(xml, /<g:price>25\.00 EUR<\/g:price>/);
  assert.match(xml, /<g:item_group_id>APL<\/g:item_group_id>/);
  assert.match(xml, /<g:title>A &amp; B 60 cartas · Accesorio para cartas TCG<\/g:title>/);
  assert.match(xml, /<g:link>https:\/\/example\.com\/product\/apl\?variante=100-cartas<\/g:link>/);
  assert.doesNotMatch(xml, /sin-foto/);
});
