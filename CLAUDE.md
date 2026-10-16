# LayerVault — Tienda TCG 3D · Barcelona

Tienda web de accesorios impresos en 3D para TCG.
Vendedor único. Los pedidos llegan por Telegram (notificación) y Brevo (email al cliente).

---

## Stack

| Tecnología | Uso |
|---|---|
| Angular 18 (standalone + signals) | Frontend SPA |
| TailwindCSS 3 | Estilos (tokens custom `lv-*`) |
| Netlify | Hosting + SSR + Functions |
| Brevo | Email de confirmación al cliente |
| Notion | Base de datos de pedidos |
| Cloudinary | Imágenes de producto |
| JSON local | Catálogo (`src/assets/data/products.json`) |

Sin backend propio, sin NgModules, sin Angular Material.

---

## Diseño visual

```
Fondo:          #121212  → lv-black
Fondo profundo: #0e0e0e  → lv-deep
Superficie:     #1a1a1a  → lv-surface
Bordes:         #2a2a2a  → lv-border
Dorado:         #C9A84C  → lv-gold
Crema:          #F5F0E8  → lv-cream
Texto muted:    #8F8A80  → lv-muted
Foil claro:     #F3DC95  → lv-foil
Latón:          #6B5A26  → lv-brass
Fuente títulos: Bricolage Grotesque (Fontsource, eje opsz) → font-display
Fuente cuerpo:  Hanken Grotesk (Fontsource)                → font-body
Border radius:  14px     → rounded-card
```

Rediseño "Foil" (rama redesign):
- Escala tipográfica en styles.css: `lv-display`, `lv-h1`, `lv-h2`, `lv-h3`, `lv-lede`, `lv-note`, `lv-price`
- Botones: `lv-btn` + `lv-btn-primary` (crema) / `lv-btn-gold` / `lv-btn-ghost`
- Texto en minúscula de frase: sin etiquetas en mayúsculas con tracking, sin monoespaciada, sin flechas `→` en botones
- El dorado se reserva para el brillo foil (`.foil-frame` + directiva `lvFoil`) y detalles; el botón principal es crema
- Titulares con `data-split` entran línea a línea (GSAP SplitText); Lenis da scroll suave solo con ratón
- `withViewTransitions`: la foto de la tarjeta viaja a la ficha (`view-transition-name: product-<id>`)
En las tarjetas, `overflow-hidden` va en el div interior de la foto, NO en el enlace `.foil-frame`, para que el brillo del marco y el color-picker no queden recortados.

---

## Estructura

```
src/app/
├── core/
│   ├── models/       product.model.ts · cart-item.model.ts · order.model.ts · oficina.model.ts
│   └── services/     catalog.service.ts · cart.service.ts · oficina.service.ts · cloudinary.service.ts
├── features/
│   ├── landing/      landing.component.ts · hero.component.ts · colors-process.component.ts
│   │                 cta.component.ts · lv-footer.component.ts · lv-navbar.component.ts
│   │                 lv-product-card.component.ts
│   ├── catalog/      catalog.component.ts · product-detail.component.ts
│   ├── checkout/     checkout.component.ts
│   ├── tracking/     tracking.component.ts
│   └── legal/        legal.component.ts
└── shared/
    ├── components/   cart-drawer.component.ts · color-picker.component.ts · telegram-fab.component.ts
    ├── directives/   foil-hover.directive.ts · split-heading.directive.ts
    └── constants/    index.ts
```

---

## Componentes clave

### LvNavbarComponent
- Detecta si está en landing (`isLanding()`) para mostrar links de sección o de catálogo
- Badge del carrito con animación `badge-pop` cuando aumenta el conteo
- `toObservable(itemCount).pipe(takeUntilDestroyed())`

### LvProductCardComponent (landing)
- Tarjeta de producto en landing page con `CardGlowDirective` y `RevealDirective`
- `justAdded` signal: botón muestra `✓` durante 1,5 s tras añadir

### ColorPickerComponent
- `layout: 'block'` → ancho completo, dropdown hacia abajo (detalle de producto)
- `layout: 'inline'` → compacto, dropdown hacia arriba `bottom-full` (tarjetas catálogo)
- Click-outside via `@HostListener('document:click', ['$event'])`
- Negro seleccionado por defecto (`id: 'negro'`)

### CartDrawerComponent
- Panel lateral deslizante (reemplaza la antigua cart page)
- Permite editar cantidad y añadir notas por ítem

### CheckoutComponent
- Email obligatorio + teléfono opcional (campos separados)
- Selección de oficina de Correos por código postal (via `OficinaService`)
- Envío del pedido: Telegram + Brevo (email confirmación)

### LandingComponent
- Secciones con `@defer (on viewport)` para carga diferida
- Los placeholders de `#colores` y `#contacto` llevan el `id` para que el anchor scroll funcione antes de que renderice el defer

---

## Animaciones (styles.css)

```
animate-fade-up       → pages al navegar (host: { class: 'block animate-fade-up' })
animate-toast-in      → toast de confirmación
animate-badge-pop     → badge del carrito
animate-dropdown-in   → dropdown del color picker
```

Movimiento con GSAP (`core/motion/`): SplitHeadingDirective (`[data-split]`), secuencia del hero en HeroComponent,
SmoothScrollService (Lenis, carga diferida). `html.motion` (script en index.html) oculta lo que va a animarse, con
un failsafe CSS a los 2,5 s. Todo respeta `prefers-reduced-motion`.

---

## SEO y prerender

- Build: `node scripts/prebuild.mjs --live && ng build` (lo hace Netlify). El script descarga el catálogo real
  de `/api/products`, lo deja en `src/assets/data/products.json` y genera `prerender-routes.txt` y `public/sitemap.xml`
- Se prerenderizan inicio, catálogo, cada ficha visible, legal, privacidad y /404 (`angular.json` → `prerender.routesFile`).
  Nada de `@defer` en contenido que deba verse en el HTML (rejilla del catálogo, destacados del inicio)
- En código que corre al prerenderizar no hay `window`, `Image`, `fetch` relativo… usar `afterNextRender` o comprobar la plataforma
- `SeoService` pone título, descripción, canonical, Open Graph y robots por ruta (`data: { description, noindex }`);
  la ficha llama a `setProduct()` y añade JSON-LD de Product con precio y disponibilidad
- `netlify.toml`: rutas de la app sin HTML propio → `index.html` (200); cualquier otra URL → `/404/index.html` con estado 404.
  Si añades una ruta nueva que no se prerenderiza, añádela ahí

## Datos

Catálogo en `src/assets/data/products.json`.
Colores definidos en el JSON con `id`, `name`, `hex`.
`colorPickerEnabled: true` activa el selector en la tarjeta/detalle.

---

## Flujo de pedido

1. `POST /api/order` → `send-telegram.ts`: valida payload, notifica Telegram, escribe en Notion → devuelve `orderId`
2. `POST /api/confirmation` → `send-confirmation.ts`: envía email al cliente via Brevo
3. `GET /api/shipping?cp=XXXXX` → `shipping-price.ts`: calcula coste de envío por CP
4. `GET /.netlify/functions/get-order-status?id=LV-...` → estado del pedido en Notion

Variables de entorno necesarias (ver `.env.example`):
`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `NOTION_TOKEN`, `NOTION_DATABASE_ID`, `BREVO_API_KEY`

---

## Normas de código

- Solo standalone components, sin NgModules
- Signals para estado reactivo; RxJS solo cuando sea necesario (`toObservable`, `takeUntilDestroyed`)
- Sin Angular Material, sin librerías de UI externas
- Sin comentarios obvios; solo cuando el "por qué" no es evidente
- No añadir features no pedidas
