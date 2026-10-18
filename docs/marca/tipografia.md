# Tipografía

Fuente de verdad: `tailwind.config.js` (`fontFamily`), `src/styles.css` (`@font-face`, escala `.lv-*`) y
`src/index.html` (precarga).

## Familias

| Papel | Familia | Clase | Pesos |
|---|---|---|---|
| Titulares | **Bricolage Grotesque** (variable, eje óptico `opsz`) | `font-display` | 200–800 |
| Texto | **Hanken Grotesk** (variable) | `font-body` (por defecto en `body`) | 100–900 |
| Reservada | Monoespaciada del sistema | `font-mono` | — |

- **Bricolage Grotesque** da el carácter: grotesca con personalidad, y en tamaños grandes el eje óptico
  (`"opsz" 96`) la vuelve más compacta y contundente.
- **Hanken Grotesk** es neutra y muy legible en pantalla; lleva activado el conjunto estilístico `ss01`.
- **La monoespaciada no se usa** (regla del rediseño Foil). Está definida por si hiciera falta mostrar código o datos técnicos en el admin.

### Respaldo

Si la fuente no ha cargado: `font-display` → Hanken Grotesk → `system-ui`; `font-body` → `system-ui` /
`-apple-system`. Por eso las proporciones de la escala funcionan también con la fuente del sistema.

## Carga

- Archivos `woff2` variables copiados de Fontsource a `/assets/fonts/` en el build (`angular.json` → `assets`).
- Solo el subconjunto **latin** se precarga (`index.html`); **latin-ext** se descarga únicamente si aparece un
  carácter que lo necesite.
- `font-display: swap`: el texto se ve desde el primer momento con la fuente del sistema y cambia al cargar.
- Nada de Google Fonts en la web (sí en los emails, ver [Emails](emails.md)).

## Escala

Definida como clases en `styles.css`. **Usar siempre estas clases** para titulares en vez de combinar tamaños sueltos.

| Clase | Uso | Tamaño (móvil → escritorio) | Peso | `opsz` | Interletra | Interlínea |
|---|---|---|---|---|---|---|
| `.lv-display` | El titular del hero (uno por web) | `clamp(3.25rem, 8vw, 7rem)` · 52 → 112 px | 750 | 96 | −0,034 em | 0,92 |
| `.lv-h1` | Titular de página (catálogo, ficha, checkout) | `clamp(2.5rem, 6vw, 5rem)` · 40 → 80 px | 720 | 96 | −0,03 em | 0,96 |
| `.lv-h2` | Titular de sección | `clamp(2rem, 4.4vw, 3.5rem)` · 32 → 56 px | 700 | 72 | −0,028 em | 1 |
| `.lv-h3` | Titular de bloque o tarjeta | `1.375rem` · 22 px | 650 | 36 | −0,02 em | 1,1 |
| `.lv-lede` | Entradilla bajo un titular | `clamp(1.0625rem, 1.4vw, 1.25rem)` · 17 → 20 px | — | — | — | 1,5 · máx. 44 caracteres por línea · crema 72 % |
| (body) | Texto normal | 16 px | 400 | — | — | 1,55 |
| `.lv-note` | Notas y aclaraciones | 14 px | — | — | — | 1,5 · crema 55 % |

Tamaños de texto pequeños más usados en componentes: `text-[15px]` (texto de campos y datos), `text-[13px]`
(etiquetas, ayudas) y `text-xs` (12 px, solo etiquetas cortas).

### Por qué así

- **Interletra negativa en los titulares:** a tamaños grandes las letras se separan ópticamente; apretarlas les da
  bloque y presencia.
- **Interlínea por debajo de 1 en display:** los titulares de varias líneas se leen como una sola pieza.
- **Pesos intermedios (650, 720, 750):** posibles porque la fuente es variable; afinan el peso a cada tamaño.

## Números y precios

- **`.lv-price`** activa cifras tabulares (`tnum`): todas las cifras ocupan lo mismo y los precios no «bailan» al
  cambiar ni se desalinean en columnas. Usarla en todo precio que pueda cambiar o ir en lista.
- Formato único de precio: `15,00 €` (pipe `eur`). Nunca `15€`, `15.00€` ni `€15`.

## Reglas

- **Minúscula de frase** siempre. Nada de `uppercase` + `tracking` en etiquetas (eso era el diseño anterior).
  Dos excepciones a propósito: la cabecera de la tarjeta foil del hero («Hecho en BCN», imita una carta TCG) y el
  campo de código de descuento (los códigos son en mayúsculas).
- **`text-wrap: balance`** en `h1`–`h4` y **`text-wrap: pretty`** en párrafos (ya en `styles.css`): evita viudas y
  líneas cortas sin tocar el texto.
- **Un solo `.lv-display` por página.** El resto de titulares, `.lv-h1`/`.lv-h2`/`.lv-h3`.
- **Ancho de lectura:** párrafos largos con `max-w-prose` o similar; la entradilla ya viene limitada a 44 caracteres.
- **No** usar negrita para destacar frases enteras: se destaca un dato («**3–7 días laborables**»), no un párrafo.
