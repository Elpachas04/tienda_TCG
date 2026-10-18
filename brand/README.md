# Kit de marca de LayerVault

Generador del logo en vectorial y de todos sus derivados (iconos, imágenes para redes). Reglas de uso en
[docs/marca/logo.md](../docs/marca/logo.md).

```bash
cd brand
npm install
npx playwright install chromium   # solo la primera vez, si no lo tienes ya
npm run build        # kit completo en out/LayerVault-marca/ y vectoriales en svg/
npm run build:web    # lo mismo y además copia favicon, iconos, manifest y og-image a la web
```

Necesita ImageMagick (`convert`) para los recortes del logo original y el `favicon.ico`.

## Cómo está hecho

| Archivo | Qué hace |
|---|---|
| `scripts/emblem.mjs` | Dibuja la puerta (bisagras, cerrojos, remaches, engranaje, carta con LV) y el monograma de la carta. Paleta del metal en `METAL` |
| `scripts/glyphs.mjs` | Convierte texto en trazados con las fuentes de la marca, para que los SVG no dependan de fuentes instaladas |
| `scripts/lockups.mjs` | Logotipo y composiciones horizontal y vertical; los siete colores en `THEMES` |
| `scripts/svg.mjs` | Colores de la marca (`BRAND`) y el calado de las versiones de una tinta |
| `scripts/render.mjs` | SVG/HTML → PNG con Chromium (Playwright). `CHROMIUM_PATH` para usar otro ejecutable |
| `scripts/build.mjs` | Genera todo: SVG, PNG, derivados del original, iconos, redes; con `--web` copia a la web |

Para cambiar un color, un texto de las piezas de redes o añadir un tamaño, se toca aquí y se vuelve a generar: nunca
se retocan los archivos de salida a mano.
