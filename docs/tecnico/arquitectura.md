# Arquitectura

## Stack

| Pieza | Versión | Uso |
|---|---|---|
| Angular | 22 (standalone + signals) | La web, prerenderizada en el build |
| TypeScript | 6.0 | Todo el código |
| Tailwind CSS | 3.4 | Estilos, con los tokens `lv-*` |
| GSAP + SplitText | 3.13 | Entradas de titulares |
| Lenis | 1.3 | Scroll suave con ratón |
| Netlify | — | Hosting, funciones serverless, funciones programadas, Blobs |
| Netlify Blobs | 9 | Catálogo, valoraciones, avisos, cestas guardadas, invitaciones |
| Notion | API 2022-06-28 | Base de datos de pedidos |
| Telegram | Bot API | Aviso de cada pedido al vendedor |
| Brevo | API v3 | Emails a clientes |
| Cloudinary | — | Fotos y vídeos de producto |

Sin backend propio, sin NgModules, sin Angular Material ni librerías de interfaz.

## Carpetas

```
src/app/
├── core/
│   ├── assistant/   Datos del asistente (shop-knowledge.ts)
│   ├── motion/      GSAP y scroll suave
│   ├── models/      Tipos: producto, cesta, pedido, oficina, valoración
│   ├── seo/         Datos estructurados de producto
│   └── services/    Catálogo, cesta, Cloudinary, SEO, oficinas de Correos, cesta guardada…
├── features/        Una carpeta por página: landing, catalog, checkout, tracking, legal, admin, berry, reviews…
└── shared/
    ├── components/  Piezas reutilizables: cesta, selectores, tarjeta foil, barra de envío gratis…
    ├── constants/   Constantes; shop-policy.ts = condiciones de venta
    ├── directives/  lvFoil, data-split, lazy video
    ├── pipes/       eur (formato de precio)
    └── utils/       Utilidades sin dependencias (mask-name, variant-slug, resize-image)

netlify/functions/   Funciones serverless. Las que empiezan por "_" son módulos compartidos, no endpoints
scripts/             prebuild.mjs, generadores (feed, valoraciones, paleta) y tests
docs/                Esta documentación
```

## Convenciones

- **Solo componentes standalone**, sin NgModules.
- **Signals** para el estado; RxJS solo donde hace falta (`toObservable`, `takeUntilDestroyed`, `HttpClient`).
- **`ChangeDetectionStrategy.OnPush`** en los componentes.
- **Comentarios solo para el porqué** cuando no es evidente. En español, como el resto del código.
- **No añadir funciones que no se han pedido.**
- **Reglas de negocio en un solo sitio:** si una regla la necesitan la web y el servidor (precios, envío, estados de
  pedido), vive en `src/app/shared/constants/` y las funciones de Netlify la importan desde ahí. Ejemplos:
  `shop-policy.ts`, `order-status.ts`.
- **Archivos compartidos con Node** (`shop-policy.ts`, `variant-slug.ts`) **sin imports ni sintaxis exclusiva de
  TypeScript**: el prebuild los importa directamente.
- **Código que se prerenderiza** no puede usar `window`, `document`, `localStorage` ni `fetch` relativo sin comprobar
  la plataforma (`isPlatformBrowser`, `afterNextRender`).
- **Funciones de Netlify:** las nuevas en formato moderno (`export default async (req: Request) => Response`), donde
  Blobs funciona sin más. Las antiguas en formato Lambda necesitan `connectLambda(event)` antes de usar Blobs.
- **Seguridad de las funciones:** `originOk()` en todo POST y `requestOk()` en GET (`_guard.ts`), límite de tamaño
  del cuerpo, validación de cada campo, *honeypot* en formularios públicos.

## Datos

| Dato | Dónde vive |
|---|---|
| Catálogo | Netlify Blobs `products/catalog` (copia en `src/assets/data/products.json`) |
| Pedidos | Notion |
| Valoraciones | Blobs `reviews` |
| Avisos de reposición | Blobs `restock` |
| Cestas guardadas | Blobs `checkout-drafts` |
| Invitaciones y vales | Blobs `referrals` |
| Cesta del cliente | `localStorage` del navegador (`tcg3d_cart`) |
| ₿erry | `sessionStorage` / `localStorage` del navegador |
