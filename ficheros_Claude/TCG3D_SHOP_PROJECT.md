# TCG 3D Shop — Project Brief & Architecture Document
**Versión:** 1.0  
**Fecha:** Mayo 2026  
**Autor:** Senior Software Architect  

---

## 1. Visión del Proyecto

TCG 3D Shop es una **web app de catálogo y pedidos** para un negocio de accesorios impresos en 3D orientados al mercado de TCG (Trading Card Games), especialmente One Piece Card Game. El objetivo es convertir visitas en pedidos reales con el mínimo fricción posible, canalizando la comunicación hacia Telegram y el cobro mediante pago parcial anticipado.

---

## 2. Objetivos de Negocio

| Objetivo | Métrica de éxito |
|---|---|
| Mostrar catálogo de productos con imágenes reales | 100% productos con foto |
| Permitir al cliente construir su pedido | Cesta funcional |
| Recibir pedidos en Telegram y email | Notificación < 1 min |
| Comunicar política de pago 50% adelanto | Visible en checkout |
| Acceso directo a Telegram del vendedor | Botón flotante siempre visible |

---

## 3. Stack Tecnológico

### Decisión: **Angular + Netlify**

| Tecnología | Uso | Justificación |
|---|---|---|
| **Angular 17+** | Frontend SPA | Standalone components, signals, rendimiento |
| **TailwindCSS** | Estilos | Utilidad rápida, responsive sin esfuerzo |
| **Netlify** | Hosting + Forms | Gratis, CI/CD automático, formularios sin backend |
| **Netlify Forms** | Recepción pedidos | Sin servidor, notificación email automática |
| **Telegram Bot API** | Notificación pedidos | Instantáneo, sin coste |
| **Netlify Functions** | Lambda para Telegram | Serverless, gratis hasta 125k req/mes |
| **JSON local** | Catálogo de productos | Sin base de datos, fácil de editar |

### ¿Por qué NO React/Vue?
Angular ofrece estructura más rígida que beneficia proyectos con formularios complejos y estado de cesta. Para un desarrollador solo, la convención over configuration de Angular reduce decisiones.

---

## 4. Arquitectura de la Aplicación

```
tcg3d-shop/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── models/
│   │   │   │   ├── product.model.ts
│   │   │   │   └── order.model.ts
│   │   │   ├── services/
│   │   │   │   ├── catalog.service.ts
│   │   │   │   ├── cart.service.ts
│   │   │   │   └── order.service.ts
│   │   ├── features/
│   │   │   ├── catalog/
│   │   │   │   ├── catalog.component.ts
│   │   │   │   ├── product-card.component.ts
│   │   │   │   └── product-detail.component.ts
│   │   │   ├── cart/
│   │   │   │   ├── cart.component.ts
│   │   │   │   └── cart-item.component.ts
│   │   │   └── checkout/
│   │   │       └── checkout.component.ts
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── navbar.component.ts
│   │   │   │   ├── telegram-fab.component.ts
│   │   │   │   └── image-gallery.component.ts
│   │   └── app.routes.ts
│   ├── assets/
│   │   ├── products/          ← imágenes de productos
│   │   └── data/
│   │       └── products.json  ← catálogo editable
├── netlify/
│   └── functions/
│       └── send-telegram.ts   ← Lambda notificación
├── netlify.toml
└── README.md
```

---

## 5. Modelo de Datos

### Product
```typescript
interface Product {
  id: string;
  name: string;
  category: 'deckbox' | 'storage' | 'tools' | 'accessories';
  description: string;
  features: string[];
  images: string[];        // 1-3 imágenes
  price: number;
  variants?: ProductVariant[];
  badge?: string;
  available: boolean;
}

interface ProductVariant {
  label: string;           // "60 cartas" | "100 cartas"
  price: number;
}
```

### CartItem
```typescript
interface CartItem {
  productId: string;
  productName: string;
  variant?: string;
  color?: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}
```

### Order
```typescript
interface Order {
  items: CartItem[];
  customerName: string;
  customerContact: string;  // email o teléfono
  deliveryMethod: 'pickup' | 'shipping';
  notes?: string;
  totalAmount: number;
  depositAmount: number;    // 50% calculado automáticamente
  timestamp: string;
}
```

---

## 6. Flujo de Usuario

```
[Catálogo] 
    → Ver producto (1-3 fotos, descripción, precio)
    → Elegir color / variante
    → Añadir a cesta
    
[Cesta] 
    → Ver resumen de pedido
    → Añadir notas por producto
    → Ver total + depósito 50%
    
[Checkout]
    → Nombre + contacto (email/teléfono)
    → Método de recogida (en mano / envío)
    → Confirmar pedido
    → ✅ Netlify Form → Email al vendedor
    → ✅ Netlify Function → Telegram al vendedor
    → ✅ Página de confirmación con instrucciones de pago
```

---

## 7. Sistema de Notificaciones

### Email (Netlify Forms — gratis)
```toml
# netlify.toml
[[redirects]]
  from = "/api/order"
  to = "/.netlify/functions/send-telegram"
  status = 200
```

Netlify Forms envía automáticamente un email con todos los campos del formulario al email configurado.

### Telegram Bot (Netlify Function)
```typescript
// netlify/functions/send-telegram.ts
export const handler = async (event) => {
  const order = JSON.parse(event.body);
  
  const message = `
🛒 *NUEVO PEDIDO — TCG 3D Shop*

👤 Cliente: ${order.customerName}
📞 Contacto: ${order.customerContact}

📦 *Productos:*
${order.items.map(i => `• ${i.quantity}x ${i.productName} ${i.variant || ''} — ${i.unitPrice}€`).join('\n')}

💰 Total: ${order.totalAmount}€
💳 Depósito 50%: ${order.depositAmount}€

📝 Notas: ${order.notes || 'Ninguna'}
🕐 ${new Date().toLocaleString('es-ES')}
  `;

  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    })
  });

  return { statusCode: 200 };
};
```

---

## 8. Componentes Clave

### ProductCard
- Imagen principal con galería de 1-3 fotos (swipe en móvil)
- Badge (Más vendida, Premium, etc.)
- Selector de variante si aplica
- Selector de color (texto libre o predefinido)
- Botón "Añadir a cesta"
- Precio destacado

### Telegram FAB (Floating Action Button)
- Siempre visible en esquina inferior derecha
- Icono de Telegram + "Hablar con nosotros"
- Enlace directo a `https://t.me/TU_USUARIO`

### Cart
- Lista de productos con cantidad editable
- Campo de notas por producto (ej: "color azul marino")
- Resumen con total
- Caja informativa: *"Se requiere el 50% de depósito para confirmar el pedido"*

### Checkout
- Formulario mínimo: nombre + contacto
- Método de entrega
- Resumen final
- Submit → dispara email + Telegram

---

## 9. Política de Pago (visible en UI)

```
⚠️  Para confirmar tu pedido:
• Se requiere el 50% del total como depósito
• Pago por Bizum / Transferencia
• El resto se abona en la entrega
• Plazo de fabricación: 3-7 días según pedido
```

---

## 10. Roadmap

### Fase 1 — MVP (1-2 semanas)
- [ ] Catálogo estático con JSON
- [ ] Galería de imágenes por producto
- [ ] Cesta funcional con localStorage
- [ ] Checkout con Netlify Forms
- [ ] Notificación Telegram
- [ ] Botón FAB Telegram
- [ ] Deploy en Netlify

### Fase 2 — Mejoras (mes 2)
- [ ] Panel admin simple para editar productos
- [ ] Fotos reales de todos los productos
- [ ] Selector de colores visual
- [ ] Página de seguimiento de pedido

### Fase 3 — Escala (mes 3+)
- [ ] Integración Stripe para cobro del 50%
- [ ] Sistema de reseñas
- [ ] Galería de trabajos realizados
- [ ] SEO y Google My Business

---

## 11. Estimación de Costes

| Servicio | Coste mensual |
|---|---|
| Netlify (Free tier) | 0€ |
| Dominio .es | ~1€/mes |
| Telegram Bot | 0€ |
| **Total** | **~1€/mes** |

---

## 12. Variables de Entorno Necesarias

```env
TELEGRAM_BOT_TOKEN=xxxx
TELEGRAM_CHAT_ID=xxxx
NOTIFY_EMAIL=tu@email.com
```

---

*Documento generado para TCG 3D Shop · Barcelona · 2026*
