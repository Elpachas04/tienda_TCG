# TCG 3D Shop — LayerVault · Barcelona

Tienda web de accesorios impresos en 3D para One Piece TCG.
Vendedor único. Los pedidos llegan por Telegram y email (Netlify Forms).

---

## Stack

| Tecnología | Uso |
|---|---|
| Angular 18 (standalone + signals) | Frontend SPA |
| TailwindCSS 3 | Estilos (tokens custom `tcg-*`) |
| Netlify | Hosting + Forms + Functions |
| JSON local | Catálogo (`src/assets/data/products.json`) |

Sin backend propio, sin NgModules, sin Angular Material.

---

## Diseño visual

```
Fondo bg:       #111111  → tcg-bg
Superficie:     #1a1a1a  → tcg-surface
Bordes:         #2a2a2a  → tcg-border
Dorado:         #C9A84C  → tcg-gold
Texto:          #f0f0f0  → tcg-text
Texto muted:    #888888  → tcg-muted
Fuente títulos: Bebas Neue  → font-display
Fuente cuerpo:  Barlow      → font-body
Border radius:  12px     → rounded-card
```

Hover de cards: borde cambia a `tcg-gold`.
`overflow-hidden` va en el div de imagen (`rounded-t-card`), NO en `.card`, para que el color-picker no quede recortado.

---

## Estructura

```
src/app/
├── core/
│   ├── models/          product.model.ts · cart-item.model.ts · order.model.ts
│   └── services/        catalog.service.ts · cart.service.ts · order.service.ts
├── features/
│   ├── catalog/         catalog.component.ts · product-card.component.ts · product-detail.component.ts
│   ├── cart/            cart.component.ts
│   └── checkout/        checkout.component.ts
└── shared/
    ├── components/      navbar.component.ts · telegram-fab.component.ts · color-picker.component.ts
    └── constants/       index.ts
```

---

## Componentes clave

### ColorPickerComponent
- `layout: 'block'` → ancho completo, dropdown hacia abajo (detalle de producto)
- `layout: 'inline'` → compacto, dropdown hacia arriba `bottom-full` (tarjetas catálogo)
- Click-outside via `@HostListener('document:click', ['$event'])`
- Negro seleccionado por defecto (`id: 'negro'`)

### ProductCardComponent
- Zona de compra unificada en la parte inferior: `[● Color ▾] [precio] [Añadir]`
- Productos con variantes muestran pills `P / M / G` encima de esa fila
- `ngOnChanges` para default Negro al recibir colores
- `justAdded` signal: botón muestra `✓` durante 1,5 s tras añadir

### CatalogComponent
- Pills de categoría con contador de productos
- Toast animado al añadir a la cesta

### NavbarComponent
- Badge del carrito con animación `badge-pop` cuando aumenta
- `toObservable(itemCount).pipe(takeUntilDestroyed())`

---

## Animaciones (styles.css)

```
animate-fade-up       → pages al navegar (host: { class: 'block animate-fade-up' })
animate-toast-in      → toast de confirmación
animate-badge-pop     → badge del carrito
animate-dropdown-in   → dropdown del color picker
```

---

## Datos

Catálogo en `src/assets/data/products.json`.
Colores definidos en el JSON con `id`, `name`, `hex`.
`colorPickerEnabled: true` activa el selector en la tarjeta/detalle.

---

## Notificaciones de pedido

- **Netlify Forms** → email automático al vendedor
- **Netlify Function** `netlify/functions/send-telegram.ts` → mensaje Telegram
- Variables de entorno necesarias: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- Ver `.env.example` en la raíz

---

## Normas de código

- Solo standalone components, sin NgModules
- Signals para estado reactivo; RxJS solo cuando sea necesario (`toObservable`, `takeUntilDestroyed`)
- Sin Angular Material, sin librerías de UI externas
- Sin comentarios obvios; solo cuando el "por qué" no es evidente
- No añadir features no pedidas
