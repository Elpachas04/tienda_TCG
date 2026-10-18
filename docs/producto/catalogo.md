# Catálogo

El catálogo real se edita en **Admin → Productos** y se guarda en Netlify Blobs (store `products`, clave `catalog`).
`src/assets/data/products.json` es la copia del repo: en cada deploy el prebuild descarga la de producción y la
sobrescribe. Modelo de datos: `src/app/core/models/product.model.ts`.

## Ficha de un producto

| Campo | Qué es | Notas |
|---|---|---|
| `id` | Identificador y URL (`/product/<id>`) | En minúsculas con guiones. **No cambiarlo** una vez publicado: rompe enlaces, Google y valoraciones |
| `sku` | Código corto (`LDB`, `APL`) | Base de los ids del feed de Google |
| `name` | Nombre comercial | Corto y propio: «Leader Display Box», «Stack Vault» |
| `tagline` | Lema de una línea | Beneficio, no descripción: «Tu Líder en primera fila, donde tiene que estar.» |
| `description` | Descripción | 2–3 frases concretas: qué es, para qué y por qué es mejor |
| `features` | Lista de características | 3–4 puntos cortos y comprobables |
| `category` | `deckbox`, `storage`, `tools` o `accessories` | Filtro del catálogo y tipo en Google |
| `price` | Precio base | Si hay variantes, el de la variante por defecto |
| `variants` | Tamaños con su precio, medidas y textos propios | Una variante con `default: true` |
| `images` | Public IDs de Cloudinary, la primera es la principal | Ver [Imagen](../marca/imagen.md) |
| `video` | Public ID de vídeo (opcional) | Sustituye a la foto en la tarjeta |
| `colorPickerEnabled` | Muestra el selector de color | |
| `colorImageKey` | Prefijo de las fotos por color | `<clave>_<idColor>` |
| `leaderPickerEnabled`, `leaders`, `leaderImageKey` | Selector de carta Líder con sus fotos | Leader Vault |
| `customLeaderRequest` | Permite pedir un Líder que no está en la lista | Por WhatsApp |
| `available_addons` | Extras (p. ej. «Añadir 10 separadores», 2 €) | Definidos en `addons` |
| `badge` | Insignia de la tarjeta («Más vendida», «Premium») | Una o dos palabras |
| `available` | Se puede comprar | Si es `false`: «Agotado» y formulario de aviso |
| `hidden` | Oculto de la web | No se prerenderiza ni va al sitemap ni al feed |

## Variantes

- Cada variante tiene `label` («60 cartas», «Mediana»), `price`, `specs` opcionales (capacidad y medidas en cm) y
  `copy` opcional (lema, descripción y usos propios).
- El enlace a una variante concreta es `/product/<id>?variante=<slug>` (slug del `label`: «100 cartas» → `100-cartas`),
  `src/app/shared/utils/variant-slug.ts`. Lo usan el feed de Google y los datos estructurados.

## Colores

Lista global en `colors` (se edita en el admin): `id`, `name`, `hex`, tipo de filamento, nivel de stock y si es
popular. **El negro va preseleccionado.** Ver la tabla en [Color](../marca/color.md#colores-del-producto-filamentos).

## Categorías

| Id | Etiqueta en la web | Título en Google (`TITLE_SUFFIX` del feed) |
|---|---|---|
| `deckbox` | Deckboxes | «… · Deckbox para cartas TCG» |
| `storage` | Almacenaje | «… · Caja organizadora para cartas TCG» |
| `tools` | Herramientas | «… · Accesorio para cartas TCG» |
| `accessories` | Accesorios | «… · Accesorio TCG» |

Una categoría nueva necesita su entrada en `categories` (catálogo) y en `TITLE_SUFFIX` (`scripts/lib/merchant-feed.mjs`).

## Escribir un producto

- **Nombre:** propio y memorable; la mayoría siguen el patrón `<algo> Vault`.
- **Lema:** el beneficio para el jugador, una frase.
- **Descripción:** medidas y compatibilidades reales (doble funda, Mini Snaps, toploaders). Nada de superlativos vacíos.
- **Características:** cosas que se puedan comprobar mirando la pieza.
- Ver el tono en [Identidad y voz](../marca/identidad.md).
