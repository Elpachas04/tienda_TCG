---
name: layervault-diseno
description: Diseñar o cambiar interfaz de la tienda LayerVault (páginas, componentes, estilos, animaciones) siguiendo su sistema de diseño Foil. Úsala antes de tocar plantillas, clases de Tailwind, styles.css o cualquier cosa visual.
---

# Diseño de interfaz en LayerVault

Antes de escribir código visual, lee los documentos que apliquen de `docs/marca/`:

- `color.md`: paleta `lv-*`, opacidades de crema y contrastes.
- `tipografia.md`: escala `.lv-display` / `.lv-h1`–`.lv-h3` / `.lv-lede` / `.lv-note` / `.lv-price`.
- `superficies.md`: capas de fondo, bordes, radios, foil, `.lv-stage`, rejilla y z-index.
- `componentes.md`: botones, campos, selectores, tarjetas, cesta, avisos.
- `movimiento.md`: duraciones, curvas y movimiento reducido.
- `imagen.md`: fotos y tamaños de Cloudinary.
- `logo.md`: piezas del logo, versiones de color, tamaños mínimos. El logo, los iconos y las imágenes para redes se
  generan en `brand/` (`npm run build:web`); nunca se editan los PNG a mano.

## Reglas que no se rompen

1. **Usa lo que existe.** Clases `.lv-*` de `styles.css` y tokens `lv-*` de Tailwind; nada de hex sueltos en plantillas
   ni tamaños de titular inventados. Si un componente ya existe en `componentes.md`, reutilízalo.
2. **Botón principal crema** (`lv-btn lv-btn-primary`). El oro es para el brillo foil y los detalles, un acento por pantalla.
3. **Minúscula de frase**, sin etiquetas en mayúsculas con tracking, sin monoespaciada, sin flechas en botones.
4. **Texto secundario en `text-lv-cream/60` como mínimo**; por debajo solo *placeholders*.
5. **Fotos de producto** sobre `.lv-stage` con `cloudinary.stage*`; el `overflow-hidden` va en el div interior,
   nunca en `.foil-frame`.
6. **Primero móvil** (≈ 390 px), página en `max-w-7xl mx-auto px-4 sm:px-6`.
7. **Lo que se ve al cargar no se anima.** Toda animación nueva respeta `prefers-reduced-motion` y anima solo
   `transform`/`opacity`.
8. **Accesible:** foco visible, objetivos de 44 px, `aria-*` en estados, el color nunca como única señal.
9. **Código que se prerenderiza** sin `window`/`localStorage` sin comprobar plataforma.

## Al terminar

- Compílalo (`ng build --configuration production`) y míralo en móvil y escritorio.
- Si has creado un token, una clase de la escala o un componente reutilizable, documéntalo en `docs/marca/` en el
  mismo cambio. Si has tocado colores en `tailwind.config.js`, ejecuta `npm run docs:paleta`.
