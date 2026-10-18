# Logo y kit de marca

El logo es una **puerta de cámara acorazada** dorada con una **carta** en el centro y el monograma **LV**: la caja
que guarda tu mazo. Todo el kit sale de un generador en [`brand/`](../../brand/README.md) que dibuja el logo en
vectorial a partir del original (`src/assets/logo/logo.png`), así que cualquier tamaño o color nuevo se saca de ahí,
no se retoca a mano.

## Piezas

| Pieza | Qué es | Cuándo |
|---|---|---|
| **Emblema** | La puerta completa: bisagras, cerrojos, remaches, carta con LV | Perfiles de redes, piezas grandes, el icono de la app |
| **Monograma** | Solo la carta con LV | Favicon y todo lo que mida menos de 64 px: la puerta se empasta |
| **Logotipo** | «LayerVault» en Bricolage Grotesque 800 (convertido a trazados) | Cabeceras, firmas, donde ya hay imagen al lado |
| **Logotipo con lema** | Logotipo + «TCG 3D SHOP» en Hanken Grotesk 700 espaciado | Banners, portadas |
| **Logo horizontal** | Emblema a la izquierda + logotipo y lema | Cabeceras anchas (X, Facebook), firma de email |
| **Logo vertical** | Emblema arriba + logotipo y lema centrados | Historias, carteles, pegatinas, cajas |
| **Versión clásica** | Logotipo en mayúsculas «LAYERVAULT», como el logo original | Piezas que quieran calcar el logo de siempre |

## Colores

Cada pieza existe en siete versiones (sufijo del archivo):

| Sufijo | Cómo es | Fondo |
|---|---|---|
| `dorado` | Metal dorado con relieve; logotipo con degradado foil (`#F3DC95` → `#C9A84C` → `#9C7B33`) | Oscuro (transparente) |
| `dorado-fondo` | Igual, con el fondo `lv-black` incluido | Ya lo trae |
| `sobre-claro` | Emblema metálico, logotipo en `lv-black` y lema en `lv-brass` | Crema o blanco |
| `oro` | Una tinta: `lv-gold` plano | Oscuro. Para estampar, grabar o imprimir en una tinta |
| `crema` | Una tinta: `lv-cream` | Oscuro o sobre foto oscura |
| `negro` | Una tinta: `lv-black` | Claro. Sellos, fotocopia, grabado láser |
| `blanco` | Una tinta: blanco puro | Sobre fotos |

Las versiones de una tinta son **caladas**: los huecos de la puerta y de la carta son transparentes, no negros, así
que el fondo se ve a través y funcionan sobre cualquier color.

## Reglas

- **Margen libre:** alrededor del logo, como mínimo una cuarta parte de la altura del emblema. Nada de texto ni bordes
  dentro de ese espacio.
- **Tamaño mínimo:** emblema 64 px (o 15 mm impreso); por debajo, el monograma, que se lee hasta 16 px.
- **Elige la versión por el fondo**, no lo recolorees: oscuro → `dorado`; claro → `sobre-claro` o `negro`; foto →
  `blanco` o `crema`.
- **No:** deformarlo, girarlo, cambiar los colores, ponerle sombra o brillo, rehacer el logotipo con otra fuente,
  separar la carta de la puerta en el emblema ni ponerlo sobre fondos con mucho detalle.
- **En la web y en los emails** la marca sigue yendo en texto («LayerVault» en `font-display`): carga al instante y se
  lee aunque el correo bloquee imágenes. El logo en imagen es para redes, iconos y piezas de marca.

## Archivos en la web

| Archivo | Para qué |
|---|---|
| `public/favicon.ico` | Pestaña del navegador (16, 32 y 48 px dentro) |
| `public/favicon.svg` | Pestaña en navegadores modernos: monograma sobre cuadrado redondeado `lv-black` |
| `src/assets/apple-touch-icon.png` | Icono al guardar la web en la pantalla de inicio del iPhone (180 px) |
| `public/site.webmanifest` + `src/assets/brand/icon-*.png` | Icono al instalar la web en Android (192, 512 y versión *maskable*) |
| `src/assets/og-image.jpg` | Vista previa al compartir un enlace (1200 × 630); las fichas usan la foto del producto |

Se regeneran todos con `npm run build:web` dentro de `brand/`.

## Kit completo

`npm run build` en `brand/` crea `brand/out/LayerVault-marca/` (no se versiona, son unos 190 archivos):

- `svg/`: todas las piezas en vectorial, cada una en sus 7 colores. **Es la fuente para imprenta y diseño** y sí se
  guarda en el repo en `brand/svg/`.
- `png/`: las mismas piezas en PNG transparente a varios tamaños (de 256 a 3000 px de ancho).
- `original/`: el logo ilustrado original recortado, solo el emblema (256/512/1024 en PNG y WebP) y versiones de
  1800 px sobre negro y sobre crema.
- `iconos/`: favicons (16 a 128 px, `.ico`, `.svg`), icono de Apple, iconos de Android y el manifest.
- `redes/`: imagen para enlaces (1200 × 630), foto de perfil (1080/640/320, pensada para recorte circular),
  cabecera de X (1500 × 500), portada de Facebook (1640 × 624), plantilla de historia (1080 × 1920) y publicación
  vertical de Instagram (1080 × 1350).
