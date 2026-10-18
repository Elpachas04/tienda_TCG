# Movimiento

El movimiento en LayerVault es **lento, suave y escaso**: como girar una carta foil bajo la luz, no como una
tragaperras. Sirve para dar sensación de calidad y para orientar (qué ha cambiado, de dónde viene algo), nunca para
decorar por decorar.

Fuente de verdad: `src/styles.css` (animaciones CSS), `src/app/core/motion/` (GSAP y Lenis),
`src/app/shared/directives/split-heading.directive.ts` y `public/motion.js`.

## Principios

1. **Lo que se ve al cargar no se anima.** El hero de la home y la cabecera del catálogo aparecen quietos. Animarlos
   retrasaba el LCP (el momento en que se ve el contenido principal) hasta unos 9 s.
2. **Movimiento reducido siempre respetado.** Con `prefers-reduced-motion: reduce` no hay entradas, ni scroll suave,
   ni transiciones de vista.
3. **Nada bloquea.** Si un script falla, lo oculto aparece igual a los 2,5 s (failsafe CSS).
4. **Táctil = nativo.** El scroll suave y el brillo que sigue al ratón solo existen con ratón.

## Catálogo de animaciones

### Entradas de titulares (GSAP SplitText)

Directiva `SplitHeadingDirective`: cualquier elemento con el atributo `data-split` entra **línea a línea**.

| Parámetro | Valor |
|---|---|
| Desplazamiento | desde 105 % de su altura, con máscara por línea |
| Duración | 1 s por línea |
| Curva | `expo.out` (arranca rápido y frena largo) |
| Escalonado | 0,09 s entre líneas |
| Disparo | al cargar si ya está en pantalla; si no, al llegar al 88 % del viewport (una sola vez) |

Se usa en titulares de **más abajo** de la página (secciones de productos, colores y CTA de la home), nunca en el
primero. `.splitline-mask` añade margen inferior para que no se corten las letras con descendente (j, p, q).

### Scroll suave (Lenis)

`SmoothScrollService`: duración 1,05 s, rueda al 90 %, anclas con 80 px de margen (la altura de la cabecera).
Se carga aparte para no pesar en la primera carga, y **solo con ratón** (`hover: hover` y `pointer: fine`).

### Transición catálogo → ficha (View Transitions)

La foto de la tarjeta «viaja» a la ficha: misma `view-transition-name: product-<id>` en la tarjeta y en la foto
principal de la ficha (`withViewTransitions` en `app.config.ts`).

| Parte | Duración | Curva |
|---|---|---|
| Elemento compartido (la foto) | 0,42 s | `cubic-bezier(.2,.8,.2,1)` |
| Resto de la página | 0,25 s | por defecto |

### Brillo foil

- **Marco de producto:** el brillo sigue al ratón al instante; la opacidad pasa de 35 % a 100 % en 0,35 s.
- **Tarjeta del hero:** destello que recorre el borde en bucle cada 3,2 s (`foil-sweep`, lineal) y reacción a la
  inclinación del móvil.

### Microinteracciones (CSS)

| Clase / efecto | Duración | Curva | Uso |
|---|---|---|---|
| `.animate-fade-up` | 0,25 s | `ease-out` | Entrada de cada página al navegar (`host: { class: 'block animate-fade-up' }`) |
| `.animate-dropdown-in` | 0,15 s | `ease-out` | Desplegables (color, Líder) |
| `.animate-toast-in` | 0,2 s | `ease-out` | Avisos emergentes |
| `.animate-badge-pop` | 0,35 s | `ease-out` | Contador de la cesta al aumentar (escala 1 → 1,35 → 1) |
| Foto de tarjeta en hover | 0,9 s | `ease-out` | La pieza se acerca un 4 % al pasar el ratón por la tarjeta |
| `.lv-btn:active` | 0,2 s | `ease` | Botón se hunde a 98 % al pulsar |
| Hover de color | 0,2 s | `ease` | Botones y enlaces |
| Cesta | 0,3 s | `ease-in-out` | Entrada lateral del panel |
| Barra de envío gratis | 0,5 s | `ease-out` | Relleno de la barra de progreso |

Definidas pero reservadas para la moneda ₿erry: `overlay-in`, `modal-pop` (escala desde 0,88 con desplazamiento) y
`coin-drop` (la moneda cae, rebota y se asienta).

## Cómo se evita el «parpadeo»

1. `public/motion.js` se ejecuta antes que la app y pone la clase `motion` en `<html>` (si no hay movimiento reducido).
   Va en un archivo aparte porque la CSP de `netlify.toml` no permite scripts en línea.
2. Con `html.motion`, lo que va a entrar animado empieza oculto (`[data-split]:not(.split-ready)`, `.hero-reveal`).
3. La directiva añade `split-ready` cuando ha preparado las líneas; si nunca llega, el failsafe lo muestra a los 2,5 s.

## Reglas para animaciones nuevas

- **Duraciones:** 150–250 ms para respuestas a una acción (hover, desplegar, aparecer); 400 ms–1 s solo para entradas
  de sección y transiciones de página.
- **Curvas:** `ease-out` o `expo.out` para lo que entra; nunca rebotes salvo en la moneda ₿erry.
- **Propiedades:** anima `transform` y `opacity`. Evita animar `width`, `height`, `top` o sombras (van a saltos).
- **Toda animación nueva** debe tener su equivalente en `@media (prefers-reduced-motion: reduce)` (sin movimiento,
  visible directamente).
- **Nada en el primer pantallazo** que retrase la aparición del contenido.
