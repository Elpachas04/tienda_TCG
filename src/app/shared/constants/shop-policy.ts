// Fuente única de verdad de las condiciones de venta: envío, descuentos y devoluciones.
// La usan el checkout, netlify/functions/shipping-price.ts, los datos estructurados de la ficha (SeoService)
// y el feed de Google Merchant (scripts/prebuild.mjs, que lo importa tal cual con Node).
// Por eso este archivo solo lleva datos: sin imports ni sintaxis exclusiva de TypeScript (enums, decoradores…).
// Si cambias algo aquí, revisa que el texto de /legal siga diciendo lo mismo.

export const SHOP_COUNTRY = 'ES';
export const SHOP_CURRENCY = 'EUR';

export const SHIPPING = {
  zone: 'Península',
  carrier: 'Correos',
  price: 5.92,
  /** Subtotal de artículos (antes de descuentos) a partir del cual el envío es gratis */
  freeFrom: 40,
  /** Prefijos de CP sin envío: Baleares, Las Palmas, Santa Cruz de Tenerife, Ceuta y Melilla */
  excludedPostalPrefixes: ['07', '35', '38', '51', '52'] as readonly string[],
  /** Días laborables de fabricación antes de entregar a Correos */
  handlingDays: { min: 3, max: 7 },
  /** Días laborables que tarda Correos en Península */
  transitDays: { min: 1, max: 3 },
} as const;

export const RETURNS = {
  /** Días desde la recepción para pedir la devolución */
  days: 7,
  /** No se reembolsa dinero: se da un vale por el mismo importe (o pieza nueva si viene defectuosa) */
  refund: 'store-credit',
} as const;

/** Descuento de la moneda ₿erry (sección /berry): se aplica a partir de un subtotal mínimo */
export const BERRY = {
  minSubtotal: 35,
  discount: 5,
} as const;

export function shipsTo(postalCode: string): boolean {
  return !SHIPPING.excludedPostalPrefixes.includes(postalCode.slice(0, 2));
}

export function shippingCostFor(subtotal: number): number {
  return subtotal >= SHIPPING.freeFrom ? 0 : SHIPPING.price;
}

export function berryDiscountFor(subtotal: number, berryActive: boolean): number {
  return berryActive && subtotal >= BERRY.minSubtotal ? BERRY.discount : 0;
}

/** Cálculo del total, compartido por el checkout y la validación del pedido en el servidor */
export function orderTotals(subtotal: number, delivery: 'pickup' | 'shipping', berryActive: boolean) {
  const shipping = delivery === 'shipping' ? shippingCostFor(subtotal) : 0;
  const discount = berryDiscountFor(subtotal, berryActive);
  return { subtotal, shipping, discount, total: Math.max(0, round2(subtotal + shipping - discount)) };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
