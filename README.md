# LayerVault — Tienda TCG 3D · Barcelona

Tienda web de accesorios impresos en 3D para One Piece TCG. Vendedor único. Los pedidos llegan por Telegram y email de confirmación automático.

## Stack

- **Angular 18** — standalone components + signals
- **TailwindCSS 3** — tokens `lv-*` (lv-gold, lv-cream, lv-black…)
- **Netlify** — hosting, Functions, SSR
- **Brevo** — email de confirmación al cliente
- **Notion** — base de datos de pedidos
- **Telegram Bot** — notificación instantánea al vendedor
- **Cloudinary** — imágenes de producto

## Desarrollo local

```bash
npm install
npm start          # http://localhost:4200
```

## Build

```bash
ng build --configuration production
```

## Variables de entorno

Ver `.env.example` en la raíz. Necesarias en Netlify:

```
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
NOTION_TOKEN
NOTION_DATABASE_ID
BREVO_API_KEY
```

## Flujo de pedido

1. Cliente rellena checkout → email (obligatorio) + teléfono (opcional)
2. `POST /api/order` → Netlify Function `send-telegram.ts`
   - Notifica por Telegram al vendedor
   - Escribe entrada en Notion
3. `POST /api/confirmation` → Netlify Function `send-confirmation.ts`
   - Envía email de confirmación al cliente via Brevo

## Estructura

```
src/app/
├── core/
│   ├── models/       product · cart-item · order · oficina
│   └── services/     catalog · cart · oficina · cloudinary
├── features/
│   ├── landing/      hero · colors-process · cta · footer · navbar · product-card
│   ├── catalog/      catalog · product-detail
│   ├── checkout/     checkout
│   ├── tracking/     tracking
│   └── legal/        legal
└── shared/
    ├── components/   cart-drawer · color-picker · telegram-fab
    ├── directives/   card-glow · reveal
    └── constants/    index
netlify/
└── functions/        send-telegram · send-confirmation · shipping-price · get-order-status
load-tests/           Artillery — escenarios y reportes de rendimiento
```
