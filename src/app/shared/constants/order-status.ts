// Fuente única de verdad del flujo de estados de pedido — usado por
// admin-orders.component.ts (dropdown) y netlify/functions/admin-order-status.ts (validación)
export const ORDER_STATUSES = [
  'Pendiente de pago',
  'Pago recibido',
  'En producción',
  'Preparando envío',
  'Enviado',
  'Entregado',
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];
