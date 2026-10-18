# Emails

Todos los emails a clientes salen por **Brevo** desde `hola@layervault.es` y comparten maquetación:
`netlify/functions/_email-kit.ts`. Un email nuevo se construye con esas piezas, nunca con HTML suelto.

## Qué emails hay

| Email | Cuándo | Archivo |
|---|---|---|
| Pedido recibido | Al confirmar el pedido | `send-confirmation.ts` (el único con el detalle completo) |
| Pago recibido | El vendedor marca «Pago recibido» en el admin | `_order-emails.ts` |
| Va de camino / Listo para recoger | Estado «Enviado» (según envío o recogida) | `_order-emails.ts` |
| Ya lo tienes | Estado «Entregado»: pide valoración y, si están activas, da el código de invitación | `_order-emails.ts` |
| Vuelve a estar disponible | El producto agotado vuelve a «Se puede comprar» | `_restock.ts` |
| Tu cesta a medias | 24 h después de un checkout sin terminar, si el cliente marcó la casilla | `_checkout-drafts.ts` |
| Tu vale | El pedido de un amigo invitado se entrega | `_referrals.ts` |

## Diseño

Oscuro como la web, con los mismos colores escritos en hex (los emails no pueden usar Tailwind):

| Papel | Hex |
|---|---|
| Fondo de página | `#0e0e0e` |
| Tarjeta | `#161513` |
| Panel interior | `#1e1c19` |
| Líneas | `#2c2925` |
| Texto | `#C4BEB3` |
| Secundario | `#8F8A80` |
| Titulares y cifras | `#F5F0E8` (crema) |
| Enlaces | `#C9A84C` (oro) |
| Códigos y datos clave | `#F3DC95` (foil) |
| Borde de lo importante | `#6B5A26` (latón) |

**Tipografía:** pide Bricolage Grotesque y Hanken Grotesk a Google Fonts, pero **solo Apple Mail las muestra**.
Gmail y Outlook usan la fuente de respaldo (`-apple-system`, Segoe UI, Helvetica, Arial). El diseño tiene que
funcionar con ella: la identidad en el correo la dan los colores y la estructura, no la letra.

**Modo oscuro:** lleva `color-scheme: dark` y colores en atributos `bgcolor`, para que Outlook y algunos Android no
inviertan los colores.

**Ancho** de 600 px; en móvil el padding lateral baja a 22 px y el titular a 28 px.

## Estructura de un email

1. **Preheader:** la frase que se ve en la bandeja junto al asunto. Debe completar el asunto, no repetirlo.
2. **Cabecera:** «LayerVault» en texto y, a la derecha, el número de pedido si lo hay.
3. **Saludo** con el nombre de pila («Hola, Ana»), encima del titular.
4. **Titular:** qué ha pasado, en pocas palabras.
5. **Entradilla:** una o dos frases con lo que importa ahora.
6. **Bloques:** progreso, paneles, datos, **un botón**.
7. **Pie:** «¿Dudas? WhatsApp o responde a este email.»

### Piezas del kit

| Función | Qué dibuja |
|---|---|
| `layout()` | El email completo: cabecera, saludo, titular, entradilla, bloques y pie |
| `panel(título, filas, { accent })` | Bloque con fondo propio; `accent` le pone borde latón (solo para el pago) |
| `row(etiqueta, valor, { sub, top, total })` | Fila etiqueta–valor; `total` en grande, alineado por la base |
| `bigValue(etiqueta, valor, { gold })` | Dato grande: número de Bizum, concepto, seguimiento, códigos |
| `button(url, texto)` | Botón crema en píldora, como en la web |
| `progress(paso, recogida)` | Barra de 4 pasos: Pedido · Pago · Fabricación · Envío/Recogida |
| `paragraph()`, `strong()`, `link()`, `gap()` | Texto, negrita, enlace oro, espacio |

## Escritura

Aplican las reglas de [Identidad y voz](identidad.md). Además:

- **El asunto dice lo que tiene que hacer o saber el cliente** («Pedido LV-…: solo falta el Bizum»), e incluye el
  número de pedido en los emails de pedido para que se agrupen.
- **Un email, una idea, un botón.** Los de estado son cortos a propósito: qué ha cambiado, en qué paso está y un botón.
- **Los datos que hay que copiar, en grande** (`bigValue`): importe, número de Bizum, concepto, seguimiento, códigos.
- **El importe siempre cuadra:** si hay descuento o envío gratis, aparece como línea en el resumen.
- **Textos que cambian con las condiciones** (plazos, umbral de envío gratis) se leen de `shop-policy.ts`, nunca se
  escriben a mano.
- **Los emails comerciales** (recordatorio de cesta) dicen por qué llegan y ofrecen una baja en un clic, con
  confirmación (los antivirus del correo abren los enlaces solos).

## Probar un email

Los emails se pueden generar sin enviarlos: se compila la función con `esbuild` sustituyendo `fetch` por uno que guarda
el HTML, y se abre en el navegador. Los tests de integración (`scripts/tests/`) siguen este patrón.
