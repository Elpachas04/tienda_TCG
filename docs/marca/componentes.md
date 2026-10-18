# Componentes

Piezas de interfaz con su aspecto, sus estados y dónde están. Antes de crear una pieza nueva, mira si ya existe aquí.

## Botones

Clase base `.lv-btn` (en `styles.css`) + una variante. Siempre píldora, mínimo **48 px de alto** (cómodo para el dedo),
texto Hanken 15 px peso 600.

| Variante | Aspecto | Hover | Cuándo |
|---|---|---|---|
| `.lv-btn-primary` | Fondo crema, texto `lv-black` | Fondo blanco | **La acción principal** de cada pantalla: «Ver catálogo», «Hacer pedido» |
| `.lv-btn-ghost` | Borde crema 22 %, texto crema | Borde oro, texto foil | Acciones secundarias: «Aplicar», alternativas |
| `.lv-btn-gold` | Fondo oro, texto `lv-black` | Oro más claro `#d8b95e` | Casos puntuales de marca. No como botón por defecto |

- Una sola acción principal por pantalla.
- Al pulsar se hunde a 98 % (`:active`).
- Deshabilitado: `disabled:opacity-50` y sin cursor de mano.
- Texto con verbo, en minúscula de frase y sin flechas.

## Enlaces

`.lv-link`: texto crema peso 600 con subrayado dorado al 50 % separado 0,3 em; en hover, texto foil y subrayado oro
completo. En textos legales o largos, los enlaces van en `text-lv-gold hover:underline`.

## Campos de formulario

Patrón del checkout (constante `INPUT` en `checkout.component.ts`):

| Estado | Aspecto |
|---|---|
| Reposo | `bg-white/[0.03]`, borde `border-white/[0.07]`, radio 12 px, padding 16 × 12 px, texto 16 px crema |
| Placeholder | crema 45 % |
| Foco | borde `lv-gold/40` + contorno oro de teclado |
| Error | borde `red-500/50` y mensaje debajo en `text-red-400 text-xs` («Obligatorio», «Email no válido») |

- **Etiqueta siempre visible encima** del campo (`text-sm text-lv-cream/75`), nunca solo placeholder.
- Obligatorios con `*` en la etiqueta y `aria-required`; inválidos con `aria-invalid`.
- **Texto de 16 px en campos** a propósito: con menos, iOS hace zoom al tocar el campo.
- Los errores se muestran al salir del campo (`blur`) o al intentar enviar, no mientras se escribe.

**Casilla de verificación:** `accent-lv-gold`, 16 px, con el texto al lado en `text-[13px] text-lv-cream/70`
(recordatorio de cesta).

## Selectores de opción

**Píldoras de filtro** (`BASE_PILL` en `shared/constants/index.ts`, categorías del catálogo):

- Base: `rounded-full h-10 px-4 text-sm font-medium`.
- Activa: fondo crema, texto `lv-black`.
- Inactiva: borde crema 15 %, texto crema 70 % → borde 40 % y texto crema en hover.

**Tarjetas de opción** (método de entrega, oficina de Correos): bloque con borde de 2 px, radio 16 px.
Seleccionada: `border-lv-gold bg-lv-gold/[0.08]`; sin seleccionar: `border-white/[0.06]` → `border-lv-gold/30` en hover.
Llevan `aria-pressed`.

**Desplegables** de color y de Líder (`ColorPickerComponent`, `LeaderPickerComponent`):

- `layout: 'block'` → ancho completo, se abren hacia abajo (ficha de producto).
- `layout: 'inline'` → compactos, se abren hacia arriba (`bottom-full`) para no salirse de la tarjeta.
- Panel `bg-lv-surface border-lv-border rounded-xl shadow-2xl`, entrada `animate-dropdown-in`.
- Se cierran al hacer clic fuera. Negro preseleccionado por defecto.

## Interruptor (admin)

Botón `role="switch"` con `aria-checked`: pista de 40 × 24 px, `bg-emerald-500/80` encendido y `bg-white/15` apagado,
bola blanca que se desplaza. Se usa para «Mostrar valoraciones» e «Invitaciones activadas». Mismo marcado en los dos:
copiarlo, no inventar otro.

## Tarjeta de producto

`LvProductCardComponent` (home) y la rejilla del catálogo comparten estructura:

1. **Foto** cuadrada en `.foil-frame` + `.lv-stage`, radio `rounded-card` (14 px), pieza con 7 % de margen interior
   (`object-contain p-[7%]`). Con vídeo si el producto lo tiene (`LazyVideoDirective`: solo se carga al verse).
2. **Insignia** opcional arriba a la izquierda: píldora `bg-lv-black/75 backdrop-blur`, texto foil 12 px peso 600.
3. **Agotado:** velo `bg-black/75` con «Agotado» centrado en crema 60 %.
4. **Nombre** en `.lv-h3` (foil en hover) y **lema** en `.lv-note` a dos líneas como máximo.
5. **Precio** con `.lv-price` y selector de color en línea.
6. Tras añadir a la cesta, el botón muestra `✓` durante 1,5 s (`justAdded`).

## Cesta (`CartDrawerComponent`)

Panel lateral derecho de 384 px en `lv-void`, con fondo de la página oscurecido al 70 % y desenfocado. Entra en
0,3 s. El foco queda atrapado dentro mientras está abierta y vuelve al botón «Cesta» al cerrarla; `Esc` la cierra.

Contenido: artículos en tarjetas `.liquid-glass` radio 16 px con contador `− n +` (papelera roja cuando queda 1),
notas por artículo, **barra de envío gratis** (`FreeShippingProgressComponent`), total y «Hacer pedido».

## Barra de progreso (envío gratis)

Texto encima («Te faltan **12,00 €** para el envío gratis» → «Tu envío a Península es gratis» en oro) y pista de 6 px
`bg-white/[0.06]` con relleno oro. `role="progressbar"` con valores y `aria-live` en el texto.

## Avisos

| Tipo | Aspecto |
|---|---|
| Error de bloque | `.liquid-glass` con borde `red-500/40`, icono ⚠, texto `red-300` |
| Zona no disponible | Borde `red-500/40`, fondo `red-500/[0.06]`, título rojo y explicación en crema 60 % |
| Información positiva (precio de envío, código aplicado) | Borde `lv-gold/30`, fondo `lv-gold/[0.07]` |
| Emergente | Reservado: animación `animate-toast-in` y duración `TOAST_DURATION` (2,5 s) definidas, sin uso actual. La confirmación de «añadido» va en el propio botón (✓) |

## Navegación

`LvNavbarComponent`: cabecera fija (`z-60`). En la home muestra enlaces a secciones; en el resto, al catálogo.
Botón «Cesta» en píldora con borde crema 20 % → oro en hover, con contador oro que hace `badge-pop` al aumentar.

## Accesibilidad (aplica a todo)

- Foco de teclado visible siempre: contorno oro 2 px (`:focus-visible` en `styles.css`, con `!important`).
- Objetivos táctiles de al menos 44 × 44 px (botones de 48 px, contadores de 36 px como mínimo absoluto).
- Iconos sin texto con `aria-label`; iconos decorativos con `aria-hidden="true"`.
- Estados con `aria-pressed`, `aria-checked`, `aria-invalid`, `aria-live` según corresponda.
- El color nunca es la única señal: los errores llevan texto y los seleccionados, borde además de color.
