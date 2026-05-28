# TCG 3D Shop 🏴‍☠️

Web app de catálogo y pedidos para accesorios 3D de One Piece TCG.

## Setup rápido

```bash
# 1. Crear proyecto Angular
ng new tcg3d-shop --standalone --routing --style=css
cd tcg3d-shop

# 2. Instalar dependencias
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
npm install @netlify/functions

# 3. Copiar archivos de este proyecto
# - products.json → src/assets/data/products.json
# - netlify-function-telegram.ts → netlify/functions/send-telegram.ts
# - netlify.toml → raíz del proyecto
# - CLAUDE.md → raíz del proyecto (para Claude Code)

# 4. Configurar variables de entorno en Netlify
# TELEGRAM_BOT_TOKEN
# TELEGRAM_CHAT_ID
```

## Cómo obtener tu Telegram Bot Token y Chat ID

### Bot Token
1. Abre Telegram y busca @BotFather
2. Escribe /newbot
3. Sigue las instrucciones
4. Copia el token que te da

### Chat ID
1. Escribe a tu bot algo cualquiera
2. Abre: https://api.telegram.org/bot[TU_TOKEN]/getUpdates
3. Busca "chat":{"id": XXXXXXX}
4. Ese número es tu Chat ID

## Añadir fotos a los productos

1. Mete las fotos en src/assets/products/
2. Edita src/assets/data/products.json
3. Añade las rutas en el array "images":
```json
"images": [
  "assets/products/deckbox-ventana-1.jpg",
  "assets/products/deckbox-ventana-2.jpg"
]
```

## Deploy en Netlify

1. Sube el proyecto a GitHub
2. Conecta el repo en app.netlify.com
3. Añade las variables de entorno en Netlify
4. Deploy automático en cada push a main

## Estructura de archivos importantes

```
src/
├── assets/
│   ├── data/
│   │   └── products.json  ← EDITA AQUÍ TUS PRODUCTOS
│   └── products/          ← METE AQUÍ LAS FOTOS
netlify/
│   └── functions/
│       └── send-telegram.ts
netlify.toml
CLAUDE.md                  ← instrucciones para Claude Code
```
