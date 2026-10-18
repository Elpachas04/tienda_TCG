---
name: layervault-copy
description: Escribir o revisar textos de LayerVault para clientes: textos de la web, botones, errores, fichas de producto, emails, asuntos y mensajes. Úsala siempre que vayas a redactar algo que leerá un cliente.
---

# Escritura en LayerVault

Lee `docs/marca/identidad.md` (voz, vocabulario, tono por situación) y, si es un email, `docs/marca/emails.md`.
Para fichas de producto, `docs/producto/catalogo.md`.

## La voz en una línea

Artesano con oficio, cercano y sin postureo: como el que te vende en persona en una tienda de cartas. Tuteo, frases
cortas, datos concretos, un guiño a One Piece de vez en cuando (₿erry, nakama), nunca en cada frase.

## Comprobaciones antes de entregar un texto

1. **Lo útil primero:** qué tiene que hacer o saber el cliente (precio, plazo, acción).
2. **Minúscula de frase**, botones con verbo, sin flechas, sin exclamaciones en serie.
3. **Vocabulario de la casa:** cesta (no carrito), pedido, hacer el Bizum, te escribimos, vale.
4. **Precios** `15,00 €`; plazos `3–7 días laborables`.
5. **Datos que pueden cambiar** (precio de envío, umbral de envío gratis, plazos, devoluciones, descuentos) se toman
   de `src/app/shared/constants/shop-policy.ts`, nunca se escriben a mano en el código.
6. **Nada que el negocio no cumpla:** no prometas plazos, garantías ni descuentos que no estén en `shop-policy.ts` o
   en `/legal`.
7. **Pronombres con referente** y sin repetir la misma idea en asunto, preheader y titular.
8. **Errores:** sin culpar, con la solución en la misma frase.

## Emails

- Asunto = la acción o la noticia, con el número de pedido en los de pedido.
- Un email, una idea, un botón. Datos que se copian (importe, Bizum, concepto, códigos) con `bigValue`.
- El importe siempre cuadra: descuentos y envío gratis como línea del resumen.
- Construidos con las piezas de `netlify/functions/_email-kit.ts`. Antes de dar un email por bueno, genéralo y míralo.
