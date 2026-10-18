# Superficies y espacio

Cómo se construyen las capas de la interfaz: fondos, bordes, radios, sombras, los dos efectos propios de la marca
(el **foil** y el **foco de producto**) y la rejilla. Fuente de verdad: `src/styles.css` y `tailwind.config.js`.

## Capas de fondo

De atrás hacia delante. Cada capa es un poco más clara y cálida que la anterior; nunca se salta de negro a gris claro.

| Capa | Valor | Dónde |
|---|---|---|
| Página | `lv-black` `#121212` | Toda la web |
| Panel lateral profundo | `lv-void` `#0B0B0F` | La cesta |
| Panel sobrio | `.liquid-glass` `#181715` + filete de luz arriba | Bloques del checkout, artículos de la cesta |
| Superficie | `lv-surface` `#1A1A1A` | Desplegables, menús, opciones de `<select>` |
| Campo o fila | `bg-white/[0.02]`–`[0.06]` sobre lo anterior | Inputs, filas, chips |

`.liquid-glass` se llamaba así en el diseño anterior (glassmorphism). Hoy es un **panel opaco y cálido** con un filete
superior `inset 0 1px 0 rgb(255 240 200 / 0.05)` que simula luz cenital. El nombre se mantiene para no romper
plantillas.

### Fondos de sección

- La web es **plana**: sin degradados de fondo, auroras ni rejillas decorativas (eran del diseño anterior).
- El único fondo con luz es el **cono del hero** (`.hero-cone`, en `hero.component.ts`): un haz cálido muy tenue que
  ilumina la tarjeta foil, solo en escritorio (desde 1024 px).
- Separadores entre bloques: `border-t border-lv-cream/10` o el filete dorado `.lv-rule`.

## Bordes

| Uso | Clase |
|---|---|
| Separadores y contornos de panel | `border-white/[0.05]`–`[0.08]` |
| Campos, desplegables, tarjetas del admin | `border-lv-border` |
| Campo con foco o elemento seleccionado | `border-lv-gold` (o `/40`–`/60` en reposo activo) |
| Botón fantasma | `rgb(245 240 232 / .22)` → oro en hover |
| Error | `border-red-500/40`–`/50` |

**Filete dorado** `.lv-rule`: línea de 1 px que se desvanece en los extremos
(`transparent → oro 45 % → transparent`). Para separar secciones con un toque de marca, como mucho una vez por pantalla.

## Radios

| Radio | Clase | Uso |
|---|---|---|
| 999 px | `rounded-full` | Botones, chips, contadores, insignias, campos de una línea del asistente |
| 20 px | `rounded-[20px]` | Bloques grandes del checkout |
| 16 px | `rounded-[16px]` | Artículos de la cesta, opciones de entrega |
| 14 px | `rounded-card` | **Tarjetas de producto** y tarjetas del admin (token) |
| 12 px | `rounded-xl` | Campos de formulario, avisos, desplegables |
| 8 px | `rounded-lg` | Selectores compactos, miniaturas |

Regla: **cuanto más grande el bloque, más radio**, y los elementos dentro de un bloque llevan menos radio que su
contenedor.

## Sombras

Casi no hay sombras: en un fondo oscuro se ven poco y ensucian. Se usan solo para separar lo que **flota** sobre la
página:

- `shadow-2xl`: desplegables, cesta, asistente, modales.
- La tarjeta foil del hero tiene su propia sombra larga y un doble filo dorado (en `foil-card.component.ts`).

## Foil: el brillo de carta rara

El rasgo visual más propio de la marca. Imita el reflejo de una carta foil al moverla.

### `.foil-frame` + directiva `lvFoil`

Marco de 1,5 px alrededor de la foto de producto con un degradado radial dorado
(`#fffbef → #f3dc95 → #C9A84C → latón`). La directiva `FoilHoverDirective` (`[lvFoil]`) pasa la posición del ratón a
`--mx`/`--my` y el brillo la sigue.

- En reposo, el marco está al 35 % de opacidad; al pasar el ratón (o sobre el `.group` padre), al 100 %, con un velo
  de luz `soft-light` encima.
- Solo con ratón (`pointerType === 'mouse'`, `@media (hover: hover)`): en táctil se queda en reposo.
- `.foil-frame` ya usa `::before` y `::after`. **El `overflow-hidden` va en el div interior de la foto, nunca en el
  `.foil-frame`**, o el brillo y el selector de color se recortan.

### Tarjeta foil del hero (`lv-foil-card`)

Tarjeta con proporción de carta TCG real (**63 × 88**), radio 16 px, borde oro 65 %, doble filo y destello que
recorre el marco (`@property --foil-sweep`). En móvil responde a la inclinación del dispositivo (pide permiso en iOS).
Es la pieza más «de marca» de la web: no se reutiliza para otra cosa.

## Foco de producto: `.lv-stage`

Fondo de todas las fotos de producto. **Por qué existe:** muchas piezas son negras y sobre `lv-black` desaparecían.

- Degradado radial con un **foco de luz** algo por encima del centro (`#3b362f → #221f1b → #151412`).
- `::before` dibuja una **sombra en el suelo** (elipse negra difuminada) bajo la pieza.
- La foto va encima pedida con `c_fit` (sin relleno): ver [Imagen](imagen.md).
- En la ficha va en una capa aparte porque `.foil-frame` ya ocupa los pseudoelementos.

## Rejilla y márgenes

| Elemento | Valor |
|---|---|
| Ancho máximo de página | `max-w-7xl` (1280 px) centrado con `mx-auto` |
| Márgenes laterales | `px-4 sm:px-6` (16 → 24 px) |
| Checkout | `max-w-2xl` (una columna, para no distraer) |
| Cesta | `max-w-sm` (384 px) panel lateral derecho |
| Espacio entre secciones de la home | `py-20`–`py-28` |
| Espacio entre elementos | `gap-3` (el más usado), `gap-4`, `gap-6`/`gap-8` en bloques grandes |

### Puntos de corte

Los de Tailwind por defecto: `sm` 640 px · `md` 768 px · `lg` 1024 px · `xl` 1280 px. Se diseña **primero para
móvil** (≈ 390 px) y se añade con `sm:` y `lg:`.

## Capas (z-index)

| Capa | Valor | Elemento |
|---|---|---|
| Contenido | `z-10` | Elementos sobre fondos decorativos |
| Flotantes | `z-50` | Desplegables (color, Líder) y asistente |
| Barra de navegación | `z-60` | Cabecera fija |
| Cesta y modales del admin | `70` | Por encima de la cabecera |
| Moneda ₿erry | `z-[999]` | El aviso a pantalla completa |
