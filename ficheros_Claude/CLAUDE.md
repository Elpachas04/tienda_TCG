# TCG 3D Shop — Instrucciones para Claude Code

## Contexto del proyecto
Tienda web para venta de accesorios impresos en 3D para One Piece TCG.
Vendedor único en Barcelona. Los clientes hacen pedidos que llegan por Telegram y email.

## Stack
- Angular 17+ (standalone components, signals)
- TailwindCSS
- Netlify (hosting + forms + functions)
- Sin backend propio — Netlify Functions para Telegram

## Lo que debes construir

### 1. Estructura del proyecto
```
ng new tcg3d-shop --standalone --routing --style=css
cd tcg3d-shop
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

### 2. Diseño visual (IMPORTANTE)
Usa EXACTAMENTE este sistema de diseño:
- Fondo: #111111
- Superficie cards: #1a1a1a
- Bordes: #2a2a2a
- Dorado principal: #C9A84C
- Texto principal: #f0f0f0
- Texto secundario: #888888
- Fuentes: Bebas Neue (títulos) + Barlow (cuerpo) desde Google Fonts
- Border radius cards: 12px
- El hover de las cards debe cambiar el borde a #C9A84C

### 3. Componentes a crear

#### AppComponent
- Navbar con logo "TCG 3D Shop" en dorado
- Icono cesta con contador badge
- Botón FAB flotante de Telegram (esquina inferior derecha, siempre visible)

#### CatalogComponent (ruta /)
- Grid responsive de ProductCards
- Filtro por categoría (deckbox, almacenaje, herramientas, accesorios)

#### ProductCardComponent
- Badge opcional (Más vendida, Premium, etc)
- Galería de 1-3 imágenes con dots navegables (swipe móvil)
- Nombre, descripción corta, lista de features con checkmark dorado
- Selector de variante si el producto tiene variants[]
- Input de color (texto libre: "Escribe el color que quieres")
- Precio grande en Bebas Neue
- Botón "Añadir a cesta" — fondo dorado, texto negro

#### CartComponent (ruta /cesta o sidebar)
- Lista de items con cantidad editable (+/-)
- Campo notas por item
- Subtotal por item y total general
- Caja aviso: "Se requiere el 50% de depósito (XX€) para confirmar"
- Botón "Hacer pedido" → navega a /checkout

#### CheckoutComponent (ruta /checkout)
- Resumen del pedido (readonly)
- Form: nombre, contacto (email o teléfono), método entrega (en mano/envío), notas generales
- Política de pago visible: 50% adelanto por Bizum/Transferencia
- Submit → Netlify Form + llamada a función Telegram
- Página de confirmación con instrucciones de pago

### 4. Servicio CartService
- Usar Angular Signals para el estado
- Persistir en localStorage
- Métodos: addItem, removeItem, updateQuantity, updateNotes, clearCart, getTotal, getDeposit

### 5. Datos — products.json
Cargar desde assets/data/products.json
Ver el archivo products.json adjunto en este proyecto

### 6. Netlify Function — send-telegram
Crear en netlify/functions/send-telegram.ts
Variables de entorno necesarias:
- TELEGRAM_BOT_TOKEN
- TELEGRAM_CHAT_ID

El mensaje debe incluir emojis, nombre cliente, contacto, lista de productos con color/notas, total y depósito.

### 7. Netlify Forms
El form de checkout debe tener atributo data-netlify="true"
Campo hidden name="form-name" value="pedido"

## Archivos adjuntos en este proyecto
- products.json — catálogo completo con todos los productos
- CLAUDE.md — este archivo

## Lo que NO debes hacer
- No uses NgModules, solo standalone components
- No uses RxJS donde puedas usar Signals
- No añadas autenticación ni base de datos
- No uses Angular Material — solo Tailwind
