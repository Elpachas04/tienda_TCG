# Tests

```bash
npm run test:scripts
```

Usa el runner nativo de Node (`node:test`), sin dependencias extra. Archivos en `scripts/lib/*.test.mjs` y
`scripts/tests/*.test.mjs`.

| Archivo | Qué comprueba |
|---|---|
| `scripts/lib/shop-policy.test.mjs` | Reglas de precio: umbral de envío gratis, recogida, ₿erry, cupones, que no se sumen descuentos, redondeo, CP sin envío |
| `scripts/lib/prebuild-libs.test.mjs` | Feed de Merchant Center (variantes, ids, títulos, enlaces, escapado) y resumen de valoraciones |
| `scripts/tests/checkout-drafts.test.mjs` | Recordatorio de cesta de principio a fin: guardar, validar contra el catálogo, recordar una vez, restaurar, baja en dos pasos, plazos |
| `scripts/tests/referrals.test.mjs` | Invitaciones de principio a fin: apagadas por defecto, código propio, pedido del amigo con su total, código ya usado, vale personal y de un uso, mínimo de cesta |

## Cómo funcionan los de integración

Compilan las **funciones de Netlify reales** con `esbuild` en una carpeta temporal y sustituyen:

- `@netlify/blobs` por un almacén en memoria (`scripts/tests/fake-blobs.mjs`);
- `fetch` por dobles de Brevo y Telegram que guardan lo que se habría enviado.

Así se prueba el código que va a producción, no una copia.

## Cuándo añadir un test

- Cualquier cambio en `shop-policy.ts` o en el cálculo del total.
- Una función de Netlify nueva con reglas (plazos, límites, validaciones).
- Un generador del prebuild (feed, sitemap, resúmenes).

## Antes de abrir un PR

1. `npm run test:scripts` en verde.
2. Build de producción sin errores (`ng build --configuration production`).
3. Si toca interfaz o emails: revisarlo en el navegador (móvil y escritorio).
