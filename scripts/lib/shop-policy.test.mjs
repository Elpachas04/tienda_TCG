import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BERRY, REFERRAL, SHIPPING, orderTotals, shipsTo } from '../../src/app/shared/constants/shop-policy.ts';

test('orderTotals: envío cobrado por debajo del umbral y gratis desde él', () => {
  assert.equal(orderTotals(SHIPPING.freeFrom - 0.01, 'shipping').shipping, SHIPPING.price);
  assert.equal(orderTotals(SHIPPING.freeFrom, 'shipping').shipping, 0);
});

test('orderTotals: la recogida en mano nunca paga envío', () => {
  assert.equal(orderTotals(10, 'pickup').total, 10);
});

test('orderTotals: ₿erry descuenta solo desde su mínimo y el umbral de envío usa el subtotal sin descuento', () => {
  const below = orderTotals(BERRY.minSubtotal - 1, 'pickup', { berryActive: true });
  assert.equal(below.discount, 0);
  const atFree = orderTotals(SHIPPING.freeFrom, 'shipping', { berryActive: true });
  assert.deepEqual(atFree, { subtotal: SHIPPING.freeFrom, shipping: 0, discount: BERRY.discount, discountSource: 'berry', total: SHIPPING.freeFrom - BERRY.discount });
});

test('orderTotals: redondea a céntimos', () => {
  assert.equal(orderTotals(0.1 + 0.2, 'shipping').total, 6.22);
});

test('shipsTo: excluye islas, Ceuta y Melilla', () => {
  assert.equal(shipsTo('08015'), true);
  for (const cp of ['07001', '35001', '38001', '51001', '52001']) assert.equal(shipsTo(cp), false);
});

test('orderTotals: cupón desde su mínimo, compatible con el envío gratis y sin sumarse a ₿erry', () => {
  assert.equal(orderTotals(REFERRAL.minSubtotal - 1, 'pickup', { couponAmount: 5 }).discount, 0);
  const t = orderTotals(50, 'shipping', { couponAmount: REFERRAL.friendDiscount, berryActive: true });
  assert.equal(t.shipping, 0);
  assert.equal(t.discount, Math.max(REFERRAL.friendDiscount, BERRY.discount));
  assert.equal(t.total, 50 - t.discount);
});
