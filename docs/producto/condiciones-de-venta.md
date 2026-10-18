# Condiciones de venta

**Fuente única de verdad:** `src/app/shared/constants/shop-policy.ts`. El checkout, el servidor
(`send-telegram.ts`, `shipping-price.ts`), los datos estructurados, el feed de Google, los emails y la página `/legal`
leen de ahí. **Para cambiar una condición se cambia ese archivo**, no los textos.

Si cambias algo, revisa que `/legal` siga diciendo lo mismo y actualiza Merchant Center (envío y devoluciones se
configuran también allí).

## Envío

| Concepto | Valor | Constante |
|---|---|---|
| Zona | Península (España) | `SHIPPING.zone` |
| Transportista | Correos, entrega en oficina | `SHIPPING.carrier` |
| Precio | 5,92 € | `SHIPPING.price` |
| Envío gratis | Desde **40 €** de artículos, antes de descuentos | `SHIPPING.freeFrom` |
| Sin envío | CP que empiezan por 07 (Baleares), 35 y 38 (Canarias), 51 (Ceuta), 52 (Melilla) | `SHIPPING.excludedPostalPrefixes` |
| Fabricación | 3–7 días laborables desde el pago | `SHIPPING.handlingDays` |
| Tránsito Correos | 1–3 días laborables | `SHIPPING.transitDays` |
| Recogida en mano | Gratis, se queda por WhatsApp (Barcelona) | — |

## Pago

- **Bizum** al 674 012 922, con el número de pedido como concepto (`BIZUM` en `_email-kit.ts`).
- Se confirma en menos de 1 hora, de lunes a sábado.
- La fabricación empieza cuando llega el pago.

## Descuentos

Nunca se suman dos descuentos: se aplica el mayor. El envío gratis sí es compatible con cualquier descuento.

| Descuento | Importe | Mínimo de cesta | Cómo se consigue | Constante |
|---|---|---|---|---|
| ₿erry | 5 € | 35 € | Moneda escondida (`/gum-gum-berry`), una vez por dispositivo | `BERRY` |
| Invitación (amigo) | 5 € | 25 € | Código `NAKAMA-…` de un cliente, una vez por email | `REFERRAL.friendDiscount` |
| Vale (quien invita) | 5 € | 25 € | Llega cuando se entrega el pedido del amigo; personal, un uso, 180 días | `REFERRAL.referrerReward` |

Las invitaciones están **apagadas por defecto** y se activan en Admin → Invitaciones.

**Ejemplo:** cesta de 50 € con envío y código de invitación → envío gratis (≥ 40 €) y −5 € → **45 €**.

El total lo calcula `orderTotals()` (mismo archivo) tanto en el checkout como en el servidor; si no coinciden, el
servidor rechaza el pedido.

## Devoluciones

| Concepto | Valor | Constante |
|---|---|---|
| Plazo | 7 días desde la recepción | `RETURNS.days` |
| Si el cliente se arrepiente | Devuelve la pieza y recibe un **vale** por el mismo importe (no se reembolsa dinero) | `RETURNS.refund = 'store-credit'` |
| Si llega defectuosa | Se revisa el caso; si procede, la devuelve y se le envía una nueva | — |
| Cómo | Escribiendo a hola@layervault.es; envío de vuelta por Correos | — |

Texto legal completo: `/legal` → «Envíos y devoluciones» (`legal.component.ts`).
