import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EurPipe } from '../../shared/pipes/eur.pipe';
import { ORDER_STATUSES } from '../../shared/constants/order-status';

const DATE_FORMAT = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

interface OrderListItem {
  orderId:        string;
  customerName:   string;
  total:          number;
  status:         string;
  createdAt:      string;
  deliveryMethod: string;
}

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, EurPipe],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <h1 class="font-display text-3xl text-lv-cream">Pedidos</h1>
      <label class="flex items-center gap-2 font-body text-sm text-lv-cream/70">
        Mostrar
        <select class="bg-white/[0.03] border border-lv-border rounded-xl px-3 py-2.5 font-body text-sm text-lv-cream"
          [(ngModel)]="statusFilter" (ngModelChange)="load()">
          <option value="">Todos los estados</option>
          @for (status of statuses; track status) { <option [value]="status">{{ status }}</option> }
        </select>
      </label>
    </div>

    <div aria-live="polite">
      @if (loading()) {
        <p class="font-body text-sm text-lv-muted">Cargando pedidos…</p>
      } @else if (error()) {
        <p class="rounded-xl border border-red-400/30 bg-red-400/5 text-red-300 font-body text-sm px-4 py-3 mb-4">{{ error() }}</p>
      }
    </div>

    <ul class="space-y-2">
      @for (order of orders(); track order.orderId) {
        <li class="rounded-xl border border-lv-border bg-lv-surface/60 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div class="flex-1 min-w-0">
            <p class="font-display text-lg text-lv-cream">{{ order.orderId }}</p>
            <p class="font-body text-sm text-lv-cream/70 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
              <span>{{ order.customerName }}</span>
              <span class="lv-price">{{ order.total | eur }}</span>
              <span>{{ deliveryLabel(order.deliveryMethod) }}</span>
              <span>{{ formatDate(order.createdAt) }}</span>
            </p>
          </div>
          <div class="flex items-center gap-3 flex-shrink-0">
            @if (savedId() === order.orderId) {
              <span class="font-body text-sm text-emerald-300" role="status">{{ savedMessage() }}</span>
            }
            <select class="bg-white/[0.03] border border-lv-border rounded-lg px-3 py-2.5 font-body text-sm text-lv-cream"
              [attr.aria-label]="'Estado del pedido ' + order.orderId"
              [ngModel]="order.status" (ngModelChange)="updateStatus(order, $event)"
              [title]="order.deliveryMethod === 'En mano' ? 'Pago recibido, Enviado (= listo para recoger) y Entregado avisan al cliente por email' : 'Pago recibido, Enviado y Entregado avisan al cliente por email'">
              @for (status of statuses; track status) { <option [value]="status">{{ status }}</option> }
            </select>
          </div>
        </li>
      }
    </ul>
    @if (orders().length === 0 && !loading() && !error()) {
      <p class="font-body text-sm text-lv-muted">{{ statusFilter ? 'No hay pedidos en este estado.' : 'Todavía no hay pedidos.' }}</p>
    }
  `,
})
export class AdminOrdersComponent implements OnInit {
  protected readonly statuses = ORDER_STATUSES;

  orders  = signal<OrderListItem[]>([]);
  savedId = signal<string | null>(null);
  savedMessage = signal('Guardado');
  private savedTimer: ReturnType<typeof setTimeout> | null = null;
  loading = signal(false);
  error   = signal('');
  statusFilter = '';

  ngOnInit(): void {
    this.load();
  }

  deliveryLabel(method: string): string {
    return method === 'shipping' ? 'Envío' : method === 'pickup' ? 'En mano' : method; // Notion ya guarda "Envío"/"En mano"
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : DATE_FORMAT.format(d);
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const qs = this.statusFilter ? `?status=${encodeURIComponent(this.statusFilter)}` : '';
      const res = await fetch(`/api/admin/orders${qs}`);
      if (!res.ok) throw new Error('fetch_failed');
      const data = await res.json() as { orders: OrderListItem[] };
      this.orders.set(data.orders);
    } catch {
      this.error.set('No se pudieron cargar los pedidos. Recarga la página para reintentarlo.');
    } finally {
      this.loading.set(false);
    }
  }

  async updateStatus(order: OrderListItem, status: string): Promise<void> {
    const previous = order.status;
    // Al marcar como enviado por Correos, el número de seguimiento va en el email al cliente (opcional)
    let trackingNumber: string | undefined;
    if (status === 'Enviado' && order.deliveryMethod !== 'En mano' && previous !== 'Enviado') {
      const answer = prompt('Número de seguimiento de Correos (opcional). Se lo enviamos al cliente por email.');
      if (answer === null) {
        this.orders.update(list => list.map(o => ({ ...o }))); // cancelado: el desplegable vuelve al estado anterior
        return;
      }
      trackingNumber = answer.trim() || undefined;
    }
    this.orders.update(list => list.map(o => o.orderId === order.orderId ? { ...o, status } : o));

    try {
      const res = await fetch('/api/admin/orders/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.orderId, status, trackingNumber }),
      });
      if (!res.ok) throw new Error('update_failed');
      const result = await res.json().catch(() => ({})) as { emailSent?: boolean };
      this.error.set('');
      this.savedMessage.set(result.emailSent ? 'Guardado · email enviado al cliente' : 'Guardado');
      this.savedId.set(order.orderId);
      if (this.savedTimer) clearTimeout(this.savedTimer);
      this.savedTimer = setTimeout(() => this.savedId.set(null), 2500);
    } catch {
      this.orders.update(list => list.map(o => o.orderId === order.orderId ? { ...o, status: previous } : o));
      this.error.set(`No se pudo cambiar el estado de ${order.orderId}. Se ha dejado como estaba.`);
    }
  }
}
