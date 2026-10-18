# Identidad y voz

## Qué es LayerVault

Tienda de accesorios para juegos de cartas coleccionables (TCG), con foco en **One Piece TCG**: deckboxes,
expositores, cajas de almacenaje y herramientas, **diseñados e impresos en 3D en Barcelona** y fabricados uno a uno
cuando alguien los pide.

**Frase de marca (hero de la web):** «La primera carta que ven es tu caja.» Seguida de: «No les decepciones.»

## Lo que nos hace distintos

Son los argumentos que se repiten en la web, los emails y el feed. Si un texto puede apoyarse en uno de ellos, que lo haga.

| Diferencial | Cómo se dice | Dónde vive |
|---|---|---|
| Fabricado por encargo | «Fabricamos tu pedido en 3–7 días laborables» | `SHIPPING.handlingDays` (`shop-policy.ts`) |
| Hecho en Barcelona | «Hecho en BCN», «impresos en 3D en Barcelona» | Tarjeta foil del hero, textos |
| En el color que elijas | «Color a elegir» (solo en productos con `colorPickerEnabled`) | `products.json` → `colors` |
| Pensado para el jugador | Medidas para doble funda, Mini Snaps, toploaders… | Descripción de cada producto |
| Trato directo | WhatsApp, respuesta en menos de 1 hora (lunes a sábado), Bizum | Checkout, emails |
| Mundo One Piece | ₿erry, «nakama», Líder, WANTED, DON!! | Funciones y textos puntuales |

No prometemos lo que no está en el código: nada de «envío en 24 h», «garantía de por vida» ni «el más barato».

## Logo

`src/assets/logo/logo.png`: puerta de cámara acorazada dorada con una carta en el centro y el monograma **LV**,
sobre ella el logotipo **LAYERVAULT** y debajo **TCG 3D SHOP**. Fondo transparente.

- **Dónde se usa:** como imagen solo en piezas de marca (redes, OG). En la web y en los emails la marca se escribe en
  texto («LayerVault» en `font-display`): carga al instante, se lee en cualquier tamaño y no depende de que el
  cliente de correo muestre imágenes.
- **Fondo:** siempre sobre oscuro (`lv-black` o más profundo). Sobre fondo claro el dorado pierde contraste.
- **No:** deformarlo, recolorearlo, ponerle sombras ni usarlo pequeño en el móvil (el detalle de la puerta se pierde
  por debajo de unos 64 px; ahí basta el texto).

## Personalidad

**Artesano con oficio, cercano, sin postureo.** Hablamos como el que te vende en persona en una tienda de cartas:
sabe del juego, va al grano y no te infla el producto.

- **Directo:** la información útil primero (precio, plazo, qué tienes que hacer).
- **Cercano:** tuteo siempre. Primera persona del plural para la tienda («fabricamos», «te escribimos»).
- **Concreto:** cifras y hechos en vez de adjetivos («para 100 cartas con doble funda», no «increíble capacidad»).
- **Con un guiño:** el universo One Piece aparece en detalles (₿erry, nakama, WANTED), nunca en cada frase.

## Reglas de escritura

### Forma

- **Minúscula de frase en todo:** titulares, botones, etiquetas. Nada de MAYÚSCULAS con letras espaciadas.
- **Sin flechas** en botones («Ver catálogo», no «Ver catálogo →»).
- **Botones con verbo** que dice qué pasa: «Hacer pedido», «Valorar mi pedido», «Terminar el pedido».
- **Precios** siempre con el formato de la web: `15,00 €` (pipe `eur` en Angular, `eur()` en los emails).
- **Plazos** con guion corto: `3–7 días laborables`.
- **Una idea por bloque.** Si un párrafo necesita «además», probablemente son dos.

### Vocabulario

| Usamos | Evitamos |
|---|---|
| cesta | carrito (en textos al cliente) |
| pedido | orden, compra (como sustantivo) |
| hacer el Bizum | realizar el pago |
| fabricar / imprimir | producir, manufacturar |
| te escribimos | nos pondremos en contacto contigo |
| Península | territorio peninsular |
| vale (por el importe) | crédito, saldo |

### Tono por situación

| Situación | Tono | Ejemplo real |
|---|---|---|
| Pide una acción | Claro e imperativo amable | «Solo falta el Bizum.» |
| Buenas noticias | Breve y cálido | «Ya lo tienes. Esperamos que te guste.» |
| Error del cliente | Sin culpa, con la solución | «Escribe primero tu email: el código va ligado a él.» |
| Algo no disponible | Honesto y con alternativa | «De momento solo enviamos a Península. Escríbenos a hola@layervault.es si necesitas otro destino.» |
| Legal | Llano, sin jerga | «Si has cambiado de idea, nos la devuelves y te damos un vale por el mismo importe.» |

### Errores habituales

- Pronombres sin referente («nos la devuelves» sin haber dicho «la pieza»).
- Repetir lo mismo en preheader, titular y primera frase de un email.
- Jerga técnica al cliente («SKU», «variante», «stock»): decimos «tamaño», «disponible».
- Exclamaciones en serie. Como mucho una, y mejor ninguna.

## Contacto oficial

- Email: `hola@layervault.es` (`CONTACT_EMAIL` en `src/app/shared/constants/index.ts`)
- WhatsApp: 644 794 412 (`WHATSAPP_PHONE`)
- Web: `https://layervault.es`
