---
name: layervault-desarrollo
description: Implementar funciones, arreglar fallos o tocar funciones de Netlify, precios, pedidos, SEO o el build de la tienda LayerVault. Úsala antes de cambiar código que no sea solo visual.
---

# Desarrollo en LayerVault

Lee lo que aplique de `docs/tecnico/` (arquitectura, pedidos, SEO, despliegue, tests) y de `docs/producto/`
(condiciones de venta, catálogo, funciones).

## Reglas

1. **Una regla de negocio, un sitio.** Precios, envío, descuentos y devoluciones: `shop-policy.ts`. Estados de pedido:
   `order-status.ts`. El navegador y las funciones de Netlify importan el mismo archivo. Si cambias el cálculo del
   total, cambia `orderTotals()` y sus tests, no copias.
2. **El servidor no se fía del navegador:** recalcula totales, valida cada campo, comprueba cupones de nuevo.
   `originOk()`/`requestOk()` en toda función pública.
3. **Funciones nuevas de Netlify** en formato moderno (`export default async (req: Request) => Response`); las
   rutas en `netlify.toml`. Las de formato Lambda necesitan `connectLambda(event)` para usar Blobs.
4. **Funciones nuevas apagadas por defecto** si cambian lo que ve o paga el cliente, con interruptor en el admin
   (`settings.*` del catálogo), como las valoraciones y las invitaciones.
5. **Datos personales:** lo mínimo, con plazo de borrado, y si es comercial, con consentimiento expreso. Actualiza la
   política de privacidad (`legal.component.ts`) en el mismo cambio.
6. **Cookies y almacenamiento:** toda clave nueva de cookie, `localStorage` o `sessionStorage` va a `BROWSER_STORAGE`
   (página `/cookies`). Nada de analítica, píxeles ni incrustados de terceros sin banner de consentimiento previo
   (`docs/tecnico/cookies.md`).
7. **Prerender:** sin `window`/`localStorage`/`fetch` relativo en código que corre en el build sin comprobar plataforma;
   sin `@defer` en contenido que deba verse en el HTML.
8. **Standalone + signals + OnPush**, sin librerías de interfaz, comentarios solo para el porqué, sin funciones que
   nadie ha pedido.

## Flujo de trabajo

1. Rama desde `develop` (`feat/…`, `fix/…`, `copy/…`, `docs/…`).
2. Cambio + tests (`scripts/lib` para reglas puras, `scripts/tests` para funciones de Netlify con el almacén en memoria).
3. `npm run test:scripts` y `ng build --configuration production` en verde; si hay interfaz o emails, revisarlos renderizados.
4. Actualiza `docs/` y `CLAUDE.md` si cambia algo documentado.
5. PR hacia `develop` explicando qué cambia, por qué y cómo se ha probado.
6. `main` es producción: cada push publica la web.
