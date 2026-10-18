# Funciones de la tienda

Qué hace cada función, cómo se enciende y dónde está. El detalle técnico de cada una está también en `CLAUDE.md`.

| Función | Estado por defecto | Se controla en |
|---|---|---|
| Valoraciones | Apagadas en la web hasta activarlas | Admin → Valoraciones |
| Invitaciones | **Apagadas** | Admin → Invitaciones |
| Avísame cuando vuelva | Siempre activa en productos agotados | — (se dispara al reponer en el admin) |
| Recordatorio de cesta | Activo, pero solo si el cliente marca la casilla | `REMINDER_POLICY` |
| ₿erry | Activa (enlace secreto) | `BERRY` |
| Asistente | Activo | `core/assistant/shop-knowledge.ts` |

## ₿erry (moneda escondida)

Guiño al mundo One Piece. Quien entra en `/gum-gum-berry` recibe una moneda ₿erry: aparece un aviso a pantalla
completa y, durante esa visita, tiene **5 € de descuento en pedidos desde 35 €**. Se gasta al hacer el pedido y no
vuelve a funcionar en ese dispositivo. Si un código de invitación da más descuento, se aplica el código y la ₿erry se
conserva. Componente: `features/berry/gum-gum-berry.component.ts`; aviso en `app.component.ts`.

## Valoraciones

El email de «Entregado» lleva un enlace firmado para valorar el pedido (puntuación, texto y fotos). Entran como
pendientes; el vendedor las publica u oculta en Admin → Valoraciones y decide con un interruptor si la web las enseña.
El nombre sale tapado («Mar******ez»). Con las valoraciones visibles, la nota media de cada producto entra en los datos
estructurados en el siguiente deploy.

## Avísame cuando vuelva

En un producto agotado, el cliente deja su email. Al marcar el producto como disponible en el admin, se avisa a todos
una sola vez y se borra la lista. El admin enseña cuántos esperan en cada producto.

## Recordatorio de cesta

Casilla en el checkout, desmarcada por defecto: «Si no termino el pedido, recordádmelo por email». Si la marca y no
pide, recibe **un único email a las 24 h** con su cesta y un botón para terminarla en un clic.

- Nunca pasadas 72 h, como mucho uno cada 30 días por email, y la cesta se borra a los 7 días.
- Se borra también al hacer el pedido, al desmarcar la casilla o desde el enlace de baja del email.
- Reglas de tiempo: `REMINDER_POLICY` en `netlify/functions/_checkout-drafts.ts`.

## Invitaciones («invita a un nakama»)

Apagadas por defecto; se activan en Admin → Invitaciones, donde también se ven las cifras.

1. Al entregar un pedido, el cliente recibe su código personal `NAKAMA-XXXXX` en el email.
2. Un amigo lo usa en el checkout: 5 € menos en su primer pedido desde 25 €.
3. Cuando el pedido del amigo se entrega, quien invitó recibe un vale `VALE-XXXXXX` de 5 €, personal, de un uso y
   válido 180 días.

Si se apagan, los vales ya prometidos se siguen enviando. Reglas: `REFERRAL` en `shop-policy.ts`.

## Asistente de la tienda

Botón flotante con preguntas y respuestas **sin IA ni coste**: responde con los datos del catálogo
(`src/app/core/assistant/shop-knowledge.ts`) y, cuando no sabe algo, abre WhatsApp con la pregunta ya escrita. En cada ficha empieza con las
preguntas frecuentes de ese producto. No aparece en el admin, en las páginas legales, en el formulario de valoración ni en el enlace de la ₿erry.

## Selector de Líder y Líder a medida

En productos como la Leader Vault, el cliente elige la carta Líder de una lista con sus fotos. Si el suyo no está,
puede pedirlo a medida por WhatsApp (`custom-leader-request.component.ts`).

## Seguimiento del pedido

`/seguimiento?id=LV-…` enseña el estado del pedido (leído de Notion). Todos los emails de pedido enlazan aquí.

## Panel de administración (`/admin`)

Protegido con contraseña (`ADMIN_PASSWORD`). Secciones: **Productos** (catálogo, fotos, colores, disponibilidad),
**Pedidos** (cambiar estado, que dispara los emails), **Valoraciones** e **Invitaciones**.
