# Flujo de pedido

## De la cesta al Bizum

1. **Cesta** (`CartService`, en `localStorage`). El cliente ve cuánto le falta para el envío gratis.
2. **Checkout** (`/checkout`): datos, entrega (en mano o Correos con código postal y oficina), notas, casilla de
   recordatorio y, si las invitaciones están activas, código de descuento.
3. **`POST /api/order`** → `send-telegram.ts`:
   - valida cada campo y el *honeypot*;
   - comprueba el código de descuento, si lo hay;
   - **recalcula el total con `orderTotals()`** y rechaza el pedido si no coincide con el del navegador;
   - avisa por Telegram, guarda el pedido en Notion, gasta el código y borra la cesta guardada;
   - devuelve el número de pedido `LV-XXXXXX`.
4. **`POST /api/confirmation`** → `send-confirmation.ts`: email «Pedido recibido» con el importe, el Bizum y el
   resumen (incluida la línea de descuento).
5. El cliente hace el Bizum con el número de pedido como concepto.

## Después del pago

El vendedor cambia el estado en **Admin → Pedidos** (`admin-order-status.ts`, que actualiza Notion). Estados en
`src/app/shared/constants/order-status.ts`:

`Pendiente de pago` → `Pago recibido` → `En producción` → `Preparando envío` → `Enviado` → `Entregado`

Avisan al cliente por email: **Pago recibido**, **Enviado** (o «Listo para recoger» si es en mano) y **Entregado**
(con enlace para valorar, el código de invitación si están activas y el vale para quien invitó si toca).

El cliente puede consultar el estado en `/seguimiento?id=LV-…` (`get-order-status.ts`).

## El total

`orderTotals(subtotal, entrega, { berryActive, couponAmount })` en `shop-policy.ts`:

1. **Envío:** 0 si es en mano; si es por Correos, 0 desde 40 € de subtotal y 5,92 € por debajo.
2. **Descuento:** el mayor entre ₿erry (5 € desde 35 €) y el cupón (5 € desde 25 €). Nunca los dos.
3. **Total** = subtotal + envío − descuento, redondeado a céntimos.

La misma función corre en el navegador y en el servidor, así que el precio que ve el cliente es el que se valida.

## Endpoints

| Ruta | Función | Para qué |
|---|---|---|
| `POST /api/order` | `send-telegram.ts` | Crear el pedido |
| `POST /api/confirmation` | `send-confirmation.ts` | Email de confirmación |
| `GET /api/shipping?cp=` | `shipping-price.ts` | Precio y zona de envío por CP |
| `GET /.netlify/functions/get-order-status?id=` | `get-order-status.ts` | Estado del pedido |
| `POST /api/coupon` | `coupon-check.ts` | Comprobar un código de descuento |
| `POST/DELETE/GET /api/checkout-draft` | `checkout-draft.ts` | Cesta guardada para el recordatorio |
| `GET /api/products` | `products-get.ts` | Catálogo |
| `/api/review`, `/api/reviews`, `/api/restock` | varios | Valoraciones y avisos |
| `/api/admin/*` | `admin-*.ts` | Panel de administración (requiere sesión) |

Funciones programadas: `checkout-reminders.ts` (cada hora).
