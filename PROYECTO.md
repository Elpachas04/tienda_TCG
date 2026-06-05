# LayerVault — Ficha Técnica del Proyecto

**Tienda web de accesorios impresos en 3D para One Piece TCG.**  
Vendedor único (Barcelona). Los pedidos se gestionan por Telegram y email.  
Producción: [layervault.es](https://layervault.es)

---

## Stack

| Tecnología | Versión | Uso |
|---|---|---|
| Angular | 22 | Frontend SPA — standalone components + signals |
| TailwindCSS | 3.4 | Estilos utilitarios con tokens `lv-*` custom |
| Netlify | — | Hosting + Functions serverless |
| Cloudinary | — | CDN de imágenes y vídeos de producto |
| TypeScript | 6.0 | Lenguaje base |
| RxJS | 7.8 | Reactividad asíncrona (solo donde signals no llegan) |

Sin backend propio. Sin NgModules. Sin Angular Material. Sin librerías de UI externas.

---

## Diseño visual

| Token | Color | Uso |
|---|---|---|
| `lv-black` | `#0B0B0F` | Fondo global |
| `lv-surface` | `#111118` | Superficies / cards |
| `lv-gold` | `#C9A84C` | Color principal de marca |
| `lv-cream` | `#F5F0E8` | Texto principal |
| `lv-cream/40` | — | Texto secundario |

**Fuentes:** `Bebas Neue` (font-display, títulos) · `Barlow` (font-body, cuerpo) · `JetBrains Mono` (font-mono, labels)  
**Estética:** `liquid-glass` (glassmorphism oscuro) + aurora gradients + grid overlay premium

---

## Estructura de carpetas

```
src/
├── app/
│   ├── app.component.ts          Shell: navbar + router-outlet + cart drawer + FAB
│   ├── app.config.ts             Providers: router, HttpClient, hydration
│   ├── app.config.server.ts      SSR: provideServerRendering
│   ├── app.routes.ts             Rutas lazy-loaded
│   │
│   ├── core/
│   │   ├── models/
│   │   │   ├── product.model.ts      Product, ProductVariant, Color, ProductCatalog
│   │   │   ├── cart-item.model.ts    CartItem
│   │   │   ├── order.model.ts        Order (incluye OficinaCorreos opcional)
│   │   │   └── oficina.model.ts      OficinaCorreos
│   │   └── services/
│   │       ├── catalog.service.ts    Carga products.json (import directo, sin HTTP)
│   │       ├── cart.service.ts       Estado del carrito con signals + localStorage
│   │       ├── cloudinary.service.ts Construye URLs Cloudinary (card/detail/thumb)
│   │       └── oficina.service.ts    Carga y filtra oficinas de Correos (HTTP)
│   │
│   ├── features/
│   │   ├── landing/
│   │   │   ├── landing.component.ts
│   │   │   ├── hero.component.ts
│   │   │   ├── lv-product-card.component.ts   Cards de la landing
│   │   │   ├── colors-process.component.ts    Paleta + pasos del proceso
│   │   │   ├── cta.component.ts               Sección contacto final
│   │   │   ├── lv-navbar.component.ts         Navbar floating glassmorphism
│   │   │   └── lv-footer.component.ts
│   │   ├── catalog/
│   │   │   ├── catalog.component.ts           Grid de productos + filtros por categoría
│   │   │   ├── product-card.component.ts      Tarjeta: imagen, color picker, añadir
│   │   │   └── product-detail.component.ts    Detalle: vídeo/galería, variantes, checkout
│   │   ├── checkout/
│   │   │   └── checkout.component.ts          Formulario → Telegram deeplink
│   │   ├── tracking/
│   │   │   └── tracking.component.ts          Seguimiento de pedido por referencia
│   │   ├── legal/
│   │   │   └── legal.component.ts             Aviso legal y privacidad (ruta compartida)
│   │   └── not-found/
│   │       └── not-found.component.ts
│   │
│   └── shared/
│       ├── components/
│       │   ├── cart-drawer.component.ts       Panel lateral del carrito (z-70)
│       │   ├── color-picker.component.ts      Dropdown de colores reutilizable
│       │   └── telegram-fab.component.ts      Botón flotante Telegram
│       ├── directives/
│       │   ├── reveal.directive.ts            IntersectionObserver fade-in al hacer scroll
│       │   └── card-glow.directive.ts         Efecto glow que sigue al cursor
│       └── constants/
│           └── index.ts                       PLACEHOLDER, TELEGRAM_URL, CONTACT_EMAIL, NOTES_MAX
│
├── assets/
│   └── data/
│       ├── products.json    Catálogo completo (productos, categorías, colores, settings)
│       └── oficinas.json    4.615 oficinas de Correos (fuente oficial jun-2025)
│
└── main.server.ts           Entry point SSR
```

---

## Rutas

| Ruta | Componente | Guard |
|---|---|---|
| `/` | LandingComponent | — |
| `/catalog` | CatalogComponent | — |
| `/product/:id` | ProductDetailComponent | — |
| `/checkout` | CheckoutComponent | `cartNotEmpty` → redirige a `/catalog` si cesta vacía |
| `/seguimiento` | TrackingComponent | — |
| `/legal` | LegalComponent | — |
| `/privacidad` | LegalComponent | — |
| `/404` | NotFoundComponent | — |
| `/**` | — | redirectTo `/404` |

---

## Datos del catálogo (`products.json`)

```typescript
interface Product {
  id: string;
  name: string;
  tagline: string;
  category: 'deckbox' | 'storage' | 'tools' | 'accessories';
  badge?: string;
  badgeStyle?: 'gold' | 'teal' | 'purple' | 'coral';
  description: string;
  features: string[];
  video?: string;        // URL Cloudinary de vídeo (opcional)
  images: string[];      // Public IDs de Cloudinary (ej: "deckbox-ventana-01")
  price: number;
  variants?: { label: string; price: number }[];
  colorPickerEnabled: boolean;
  available: boolean;
}
```

**Convención Cloudinary:** los `images` almacenan solo el public ID sin URL base.  
El `CloudinaryService` construye la URL completa según el contexto:
- `.card(id)` → 360×360 px (catálogo)
- `.detail(id)` → 900×900 px (detalle producto)
- `.thumb(id)` → 160×160 px (thumbnails galería)

---

## Oficinas de Correos (`oficinas.json`)

4.615 registros extraídos del fichero oficial de Correos (jun-2025).

```typescript
interface OficinaCorreos {
  codigo: string;       // Código interno Correos (7 dígitos)
  nombre: string;
  codigoPostal: string; // 5 dígitos — campo de búsqueda principal
  localidad: string;
  direccion: string;
  telefono: string;
}
```

El `OficinaService.buscarOficinas(termino)` filtra por `codigoPostal.startsWith()`, `localidad` o `nombre`.  
En el checkout: si el CP exacto no tiene oficina, hace fallback a los primeros 4 dígitos y muestra "zona aproximada".

---

## Flujo de pedido

```
1. Usuario navega el catálogo → elige producto, color, variante
2. Añade a la cesta (CartService → localStorage)
3. Va a /checkout → rellena nombre, contacto, método de entrega
4. Si envío: introduce CP → se calcula precio → puede elegir oficina Correos
5. Pulsa "Confirmar" → se abre Telegram con el pedido pre-formateado
6. Usuario envía el mensaje → vendedor recibe y coordina pago
```

**Método de pago:** Bizum o transferencia bancaria (acordado por Telegram).  
**Envío:** Correos · solo Península (CP prefijos 07, 35, 38, 51, 52 bloqueados).

---

## Netlify Functions

| Función | Ruta | Descripción |
|---|---|---|
| `send-telegram.ts` | `/api/order` | Envía notificación al bot de Telegram del vendedor |
| `shipping-price.ts` | `/api/shipping` | Devuelve precio de envío según CP (422 si zona bloqueada) |

**Variables de entorno requeridas en Netlify:**
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

---

## SSR (Server-Side Rendering)

Configurado con `@angular/ssr` para Netlify mediante `@netlify/angular-runtime`.  
Pre-rendering deshabilitado (`"prerender": false`) por conflicto con guards funcionales en el extractor de rutas.  
El SSR corre en runtime vía Netlify Functions.

---

## GitHub Actions

`.github/workflows/claude-code-review.yml` — Revisión automática de PRs por Claude.  
`.github/workflows/claude.yml` — Agente Claude para issues etiquetadas.  
`allowed_bots: '*'` configurado para permitir PRs generadas por bots.

---

## Ramas

| Rama | Uso |
|---|---|
| `main` | Producción (Netlify despliega automáticamente) — solo se toca con confirmación explícita |
| `develop` | Rama de trabajo diaria — todos los cambios van aquí primero |

---

## Scripts

```bash
npm start          # Dev server en localhost:4200
npm run build      # Build de producción
npm run watch      # Build en modo watch (desarrollo)
npm test           # Tests con Vitest
```

---

## Normas de código

- Solo standalone components — sin NgModules
- Signals para estado reactivo; RxJS solo cuando sea necesario (`toObservable`, `takeUntilDestroyed`)
- Sin Angular Material, sin librerías de UI externas
- `isPlatformBrowser()` en cualquier acceso a `localStorage`, `window` o `document`
- Sin comentarios obvios — solo cuando el "por qué" no es evidente
- No añadir features no pedidas
