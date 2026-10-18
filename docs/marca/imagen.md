# Imagen y fotografía

## Fotografía de producto

**El producto es el protagonista y se presenta como una pieza de colección:** sobre fondo oscuro cálido, con luz
que lo hace destacar, sin decorados que distraigan.

- **Fondo:** la web pone el fondo de foco (`.lv-stage`, ver [Superficies](superficies.md)), así que la foto ideal es
  la pieza **recortada o sobre fondo oscuro liso**. Fondos de mesa, sábanas o paredes compiten con el producto.
- **Pieza entera** en el encuadre: la web la ajusta dentro del cuadrado sin recortar (`c_fit`) y deja un 7 % de aire.
- **Primera foto = la pieza sola**, de frente o en tres cuartos. Las siguientes: en uso (con cartas, en mesa), detalles
  (cierre, ventana, textura) y escala (en la mano).
- **Luz** cálida o neutra, nunca azulada: encaja con la paleta de negros cálidos.
- **Colores:** si el producto tiene selector de color, una foto por color con el nombre `<clave>_<idColor>`
  (ver abajo) para que la ficha la cambie al elegir.
- **Formato:** cuadrado o casi cuadrado, al menos 1400 px de lado. Cloudinary hace el resto.

## Cloudinary

Todas las fotos y vídeos de producto se sirven desde Cloudinary (cuenta `dew1whfdu`). Fuente de verdad:
`src/app/core/services/cloudinary.service.ts`.

### Nombres

- Subidas desde el admin: `layervault/<id-del-producto>/<n>` (`admin-image-upload.ts`).
- Fotos por color: `<colorImageKey>_<idColor>`, por ejemplo `deckbox-ventana_rojo`.
- Fotos de valoraciones: `layervault/valoraciones/<nº de pedido>/`.
- En `products.json` se guarda **solo el public ID**, nunca la URL completa.

### Tamaños que pide la web

| Método | Transformación | Uso |
|---|---|---|
| `stageCard` | `f_auto,q_auto:good,c_fit,w_360,h_360` | Foto sobre fondo de foco en tarjetas |
| `stageDetail` | `…,c_fit,w_700,h_700` | Foto principal de la ficha |
| `stageThumb` | `f_auto,q_auto:low,c_fit,w_120,h_120` | Miniaturas de la galería |
| `card` / `detail` / `thumb` | igual pero `c_pad,b_rgb:111111` (rellena de gris oscuro) | Póster del vídeo, imagen para redes y datos estructurados |
| `colorImage` | `f_auto,q_auto:good,w_700` | Foto del color elegido |
| `video` | `w_480,q_auto:low,f_auto,ac_none` | Vídeo de tarjeta, sin audio |

- `f_auto`: AVIF o WebP según el navegador. `q_auto`: Cloudinary elige la calidad.
- Cada tamaño se genera la primera vez que alguien lo pide (tarda). Por eso el prebuild los **pide por adelantado** en
  cada deploy; si añades un tamaño nuevo, añádelo también en `scripts/prebuild.mjs`.
- El feed de Google usa `f_jpg,q_auto:good,c_limit,w_1200,h_1200` (`scripts/lib/merchant-feed.mjs`).

## Vídeo

- Bucles cortos del producto en uso, **sin audio** (se elimina con `ac_none`), en silencio y en bucle.
- En las tarjetas solo se cargan cuando se ven (`LazyVideoDirective`, `preload="none"`), con la primera foto como póster.
- Los originales de referencia están en `src/assets/videos/`.

## Iconos

- Trazo fino estilo Heroicons *outline* (`stroke-width` 1,5–2), en `currentColor`, dibujados como SVG en línea.
- Tamaños: 16–20 px en botones y campos, 24 px en opciones grandes.
- Decorativos con `aria-hidden="true"`.
- Excepción de marca: la moneda **₿erry** (`berrycoin.png` en Cloudinary).

## Logo y marca

Ver [Logo y kit de marca](logo.md). En la web y los emails la marca va en texto; el logo en imagen es para redes,
iconos y piezas de marca.

## Imagen para redes y móvil

| Archivo | Para qué |
|---|---|
| `/assets/og-image.jpg` | Vista previa al compartir un enlace (WhatsApp, X, Telegram); imagen por defecto de `SeoService` |
| `/assets/apple-touch-icon.png` | Icono al guardar la web en la pantalla de inicio del iPhone |
| `favicon.ico` | Pestaña del navegador (el original de la tienda) |
| `site.webmanifest` · `/assets/brand/icon-*.png` | Icono al instalar la web en Android |

Las fichas de producto usan su primera foto como imagen para redes; la imagen por defecto se ve en la home, el
catálogo y las páginas legales. Todas salen del generador de `brand/` (`npm run build:web`): ver
[Logo y kit de marca](logo.md#archivos-en-la-web). Si cambias la imagen para redes, mantén 1200 × 630 px, el texto
importante lejos de los bordes (algunas apps recortan) y menos de 300 KB.
