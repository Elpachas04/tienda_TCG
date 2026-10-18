# Cookies y almacenamiento en el navegador

Marco legal: art. 22.2 de la LSSI (Ley 34/2002) y la guía de cookies de la AEPD. Afecta a **cualquier dato que la web
guarde o lea en el navegador**: cookies, `localStorage`, `sessionStorage`, IndexedDB, píxeles de seguimiento.

## Situación actual: sin banner

Todo lo que la tienda guarda es **estrictamente necesario para un servicio que el cliente pide** (la cesta, el
descuento ₿erry que activa él mismo, la sesión del panel de admin). Eso está exento de consentimiento, así que **no
hay banner de cookies** y no hace falta. Sí hay que informar: la página `/cookies` (`legal.component.ts`) lo explica.

| Clave | Tipo | Para qué | Duración | Quién la crea |
|---|---|---|---|---|
| `tcg3d_cart` | localStorage | Cesta entre visitas | Hasta pedir o vaciar | `cart.service.ts` |
| `berry_active` | sessionStorage | Descuento ₿erry activado | Hasta cerrar la pestaña | `gum-gum-berry.component.ts` |
| `berry_shown` | sessionStorage | No repetir el aviso del descuento | Hasta cerrar la pestaña | `app.component.ts` |
| `berry_spent` | localStorage | El descuento ₿erry es de un uso | Hasta borrar datos del navegador | `checkout.component.ts` |
| `admin_session` | cookie HttpOnly | Sesión del panel de admin | 7 días | `_admin-auth.ts` |
| `lv_admin` | localStorage | Pista de sesión del admin | Hasta cerrar sesión | `admin-auth.service.ts` |

Sin analítica, sin píxeles, sin vídeos o mapas incrustados, sin fuentes de Google (las fuentes se sirven desde la propia
web con Fontsource). Las fotos vienen de Cloudinary y la web está en Netlify: reciben la IP como cualquier servidor,
pero la tienda no les pide guardar nada en el navegador.

## Si añades algo

1. **Cualquier clave nueva** de cookie o almacenamiento que vea un cliente: añádela a `BROWSER_STORAGE` en
   `legal.component.ts` (sale en `/cookies`) y a la tabla de arriba, en el mismo cambio.
2. **Si no es estrictamente necesaria** (Google Analytics, Meta Pixel, Hotjar, Clarity, un vídeo de YouTube
   incrustado, un mapa de Google, el widget de un chat externo…), **hace falta consentimiento previo**:
   - banner con «Aceptar» y «Rechazar» igual de visibles en la primera capa, sin casillas premarcadas;
   - el script **no se carga** hasta que el cliente acepta (no basta con avisar);
   - opción permanente para cambiar de opinión (enlace en el pie);
   - guardar la elección (esa preferencia sí es necesaria y está exenta) y volver a preguntar como mucho cada 24 meses;
   - actualizar `/cookies` con qué servicio es, qué guarda y cuánto dura.
3. La analítica sin cookies y sin datos personales, servida por la propia tienda (por ejemplo, contar visitas en
   una función de Netlify sin guardar IP ni identificadores), puede quedar fuera del consentimiento según la AEPD,
   pero revísalo antes de darlo por hecho.
