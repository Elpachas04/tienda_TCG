# Documentación de LayerVault

Todo lo que hace falta para trabajar en la tienda con criterio: cómo se ve, cómo habla, qué vende, con qué reglas
y cómo está construida. Si vas a tocar algo, empieza por aquí.

> **El código manda.** Esta guía describe el código tal como está. Si encuentras una diferencia, la verdad es el
> archivo de código que se cita y hay que corregir la guía en el mismo cambio. Los valores que viven en código
> (colores, tipografía, condiciones de venta) se citan con su archivo para que se puedan comprobar.

## Marca y diseño

| Documento | Qué contiene |
|---|---|
| [Identidad y voz](marca/identidad.md) | Qué es LayerVault, qué la hace distinta, logo, tono y reglas de escritura |
| [Color](marca/color.md) | Paleta completa con valores, papel de cada color, opacidades y contrastes |
| [Tipografía](marca/tipografia.md) | Familias, carga de fuentes, escala de titulares, texto y números |
| [Superficies y espacio](marca/superficies.md) | Fondos, capas, bordes, radios, sombras, foco de producto, rejilla y márgenes |
| [Movimiento](marca/movimiento.md) | Animaciones, duraciones, GSAP, scroll suave y movimiento reducido |
| [Componentes](marca/componentes.md) | Botones, enlaces, campos, tarjetas, interruptores, cesta y demás piezas |
| [Logo y kit de marca](marca/logo.md) | Emblema, monograma, logotipo, versiones de color, tamaños mínimos, iconos y redes |
| [Imagen y fotografía](marca/imagen.md) | Fotos de producto, Cloudinary, vídeo e imagen para redes |
| [Emails](marca/emails.md) | Diseño y escritura de los emails a clientes |

## Producto

| Documento | Qué contiene |
|---|---|
| [Condiciones de venta](producto/condiciones-de-venta.md) | Envío, envío gratis, plazos, devoluciones, descuentos y pago |
| [Catálogo](producto/catalogo.md) | Cómo se describe un producto, variantes, colores y categorías |
| [Funciones de la tienda](producto/funciones.md) | ₿erry, valoraciones, reposición, recordatorio de cesta, invitaciones, asistente… |

## Técnico

| Documento | Qué contiene |
|---|---|
| [Arquitectura](tecnico/arquitectura.md) | Stack, carpetas, convenciones de código |
| [Flujo de pedido](tecnico/pedidos.md) | De la cesta a Telegram, Notion y los emails; cálculo del total |
| [SEO y Google](tecnico/seo.md) | Prerender, datos estructurados, sitemap, Merchant Center, Search Console |
| [Cookies](tecnico/cookies.md) | Qué guarda la web en el navegador, por qué no hay banner y qué hacer si se añade analítica |
| [Despliegue y ramas](tecnico/despliegue.md) | Git, Netlify, variables de entorno |
| [Tests](tecnico/tests.md) | Qué se prueba y cómo |

## Skills para Claude

En [`.claude/skills/`](../.claude/skills) hay instrucciones para que Claude trabaje con estas reglas sin tener que
repetírselas: diseño de interfaz, escritura (web y emails) y desarrollo. Cada skill apunta a los documentos de aquí.

## Mantener la guía

- Al añadir un color, una clase de la escala o un componente reutilizable, se documenta en el mismo PR.
- La imagen de la paleta se regenera con `npm run docs:paleta` (lee `tailwind.config.js`).
- `CLAUDE.md` es el resumen corto para Claude; el detalle vive aquí.
