# Despliegue y ramas

## Ramas

| Rama | Para qué |
|---|---|
| `main` | **Producción.** Cada push publica layervault.es |
| `develop` | Integración: aquí se juntan los cambios antes de pasar a producción |
| `feat/…`, `fix/…`, `copy/…`, `docs/…` | Un cambio por rama, con su PR hacia `develop` |

Flujo:

1. Rama desde `develop` → commits → PR hacia `develop` → revisión → fusión.
2. Cuando `develop` está listo: fusionar en `main` y subir.
3. Igualar `develop` con `main` para que no se separen.

```bash
# Publicar develop en producción
git fetch origin
git checkout main
git pull origin main
git merge origin/develop
git push origin main

# Dejar develop igual que main
git checkout develop
git pull origin develop
git merge main
git push origin develop
```

## Netlify

- **Build:** `npm install && node scripts/prebuild.mjs --live && ng build --configuration production`
  (`netlify.toml`), con Node 22.22.3.
- El prebuild descarga el catálogo real, genera el sitemap, la lista de prerender, el feed de Merchant Center y el
  resumen de valoraciones, y precalienta las fotos en Cloudinary.
- Publica `dist/tcg3d-shop/browser`; las funciones están en `netlify/functions`.
- El build tarda unos minutos (prerenderiza cada ficha). Si un cambio no aparece, mirar **Netlify → Deploys**.
- Cabeceras de seguridad (CSP estricta: sin scripts en línea, imágenes solo de Cloudinary) en `netlify.toml`.

## Variables de entorno

| Variable | Obligatoria | Para qué |
|---|---|---|
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Sí | Aviso de pedidos |
| `NOTION_TOKEN`, `NOTION_DATABASE_ID` | Sí | Pedidos |
| `BREVO_API_KEY` | Sí | Emails |
| `ADMIN_PASSWORD`, `ADMIN_SECRET` | Sí | Panel de admin y firmas por defecto |
| `CLOUDINARY_*` | Sí | Subida de fotos desde el admin |
| `REVIEW_SECRET` | No (usa `ADMIN_SECRET`) | Firma de los enlaces de valoración |
| `CHECKOUT_SECRET` | No (usa `ADMIN_SECRET`) | Firma de los enlaces del recordatorio de cesta |

Plantilla completa: `.env.example`.

## Desarrollo local

```bash
npm install
npm start                 # http://localhost:4200
node scripts/prebuild.mjs # regenera sitemap, prerender y feed con el catálogo del repo
npm run test:scripts      # tests de reglas, generadores e integración
npm run docs:paleta       # regenera la imagen de la paleta de la guía
```
