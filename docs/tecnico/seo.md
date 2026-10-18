# SEO y Google

## Prerender

En cada deploy se generan páginas HTML completas de: inicio, catálogo, **cada ficha visible**, legal, privacidad y
404. Google y las vistas previas de enlaces ven el contenido sin ejecutar JavaScript.

- La lista sale del catálogo real: `scripts/prebuild.mjs` → `prerender-routes.txt`.
- **Nada de `@defer`** en contenido que deba verse en el HTML (rejilla del catálogo, destacados de la home).
- Rutas sin HTML propio (checkout, seguimiento, admin…) las sirve `index.html`; cualquier otra URL, la página 404 con
  estado 404 de verdad (`netlify.toml`). Una ruta nueva que no se prerenderiza se añade allí.

## Etiquetas por página (`SeoService`)

Título, descripción, canonical, Open Graph, Twitter y `robots` por ruta (`data: { description, noindex }` en las
rutas). La canonical **nunca lleva parámetros**: `/product/aplastador?variante=100-cartas` apunta a
`/product/aplastador`.

## Datos estructurados

| Página | Tipo | Dónde |
|---|---|---|
| Todas | `LocalBusiness` | `src/index.html` |
| Ficha | `Product` | `core/seo/product-schema.ts` |

El `Product` lleva una **oferta por variante** (con su URL `?variante=`), precio, disponibilidad, **envío** (precio y
plazos) y **política de devolución**, todo leído de `shop-policy.ts`, más la **nota media** de las valoraciones
publicadas (`aggregateRating`) si las hay.

Es lo que leen Google y los asistentes de compra con IA (Gemini, ChatGPT…) para recomendar productos.

## Sitemap y robots

- `public/sitemap.xml` se regenera en cada deploy con las páginas prerenderizadas (sin la 404).
- `public/robots.txt`.

## Google Merchant Center

- Feed en `https://layervault.es/feeds/google-merchant.xml`, generado en cada deploy
  (`scripts/lib/merchant-feed.mjs`) y descargado por Google a diario.
- Una entrada por variante, agrupadas con `item_group_id`; el `g:id` es estable (`SKU-slug`) y **no debe cambiar**
  aunque cambie el nombre.
- Títulos con el tipo de producto solo para Google («Leader Display Box · Deckbox para cartas TCG»); en la web los
  nombres no cambian.
- **Envío y devoluciones se configuran en la cuenta de Merchant Center**, no en el feed: 5,92 €, gratis desde 40 €,
  4–10 días laborables, sin envío a CP 07/35/38/51/52; devolución en 7 días con vale.

## Google Search Console

- Sitemap enviado: `sitemap.xml`.
- Tras publicar páginas nuevas, pedir la indexación desde «Inspeccionar las URL».
- «Descubierta: actualmente sin indexar» en una web pequeña es cola de espera, no un error: se acelera pidiendo la
  indexación y con enlaces externos (redes sociales, comunidades de TCG).
- «Página alternativa con etiqueta canónica adecuada» y «Página con redirección» son normales.

## Pendiente

- `sameAs` del `LocalBusiness` está vacío: añadir las URLs de Instagram, TikTok, etc. cuando existan.
- Faltan `og-image.jpg` y `apple-touch-icon.png` (ver [Imagen](../marca/imagen.md#imagen-para-redes-y-móvil)).
