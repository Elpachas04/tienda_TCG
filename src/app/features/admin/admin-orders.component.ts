import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { ORDER_STATUSES } from '../../shared/constants/order-status';

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
  imports: [FormsModule, SlicePipe],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-display text-3xl text-lv-cream uppercase tracking-wide">Pedidos</h1>
      <select class="bg-white/[0.03] border border-lv-border rounded-xl px-3 py-2 font-mono text-xs text-lv-cream"
        [(ngModel)]="statusFilter" (ngModelChange)="load()">
        <option value="">Todos los estados</option>
        @for (status of statuses; track status) { <option [value]="status">{{ status }}</option> }
      </select>
    </div>

    @if (loading()) {
      <p class="font-mono text-xs text-lv-muted uppercase tracking-wider">Cargando…</p>
    } @else if (error()) {
      <p class="text-red-400/80 font-mono text-[10px] uppercase tracking-wider mb-4">{{ error() }}</p>
    }

    <div class="space-y-2">
      @for (order of orders(); track order.orderId) {
        <div class="liquid-glass border border-lv-border rounded-xl px-4 py-3 flex items-center gap-4">
          <div class="flex-1 min-w-0">
            <p class="font-display text-lg text-lv-gold">{{ order.orderId }}</p>
            <p class="font-mono text-[10px] text-lv-muted uppercase tracking-wider">
              {{ order.customerName }} · {{ order.total.toFixed(2) }}€ · {{ order.deliveryMethod }} · {{ order.createdAt | slice:0:10 }}
            </p>
          </div>
          <select class="bg-white/[0.03] border border-lv-border rounded-lg px-3 py-2 font-mono text-[11px] text-lv-cream flex-shrink-0"
            [ngModel]="order.status" (ngModelChange)="updateStatus(order, $event)">
            @for (status of statuses; track status) { <option [value]="status">{{ status }}</option> }
          </select>
        </div>
      }
      @if (orders().length === 0 && !loading()) {
        <p class="font-mono text-xs text-lv-muted uppercase tracking-wider">No hay pedidos.</p>
      }
    </div>
  `,
})
export class AdminOrdersComponent implements OnInit {
  protected readonly statuses = ORDER_STATUSES;

  orders  = signal<OrderListItem[]>([]);
  loading = signal(false);
  error   = signal('');
  statusFilter = '';

  ngOnInit(): void {
    this.load();
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
      this.error.set('No se pudieron cargar los pedidos');
    } finally {
      this.loading.set(false);
    }
  }

  async updateStatus(order: OrderListItem, status: string): Promise<void> {
    const previous = order.status;
    this.orders.update(list => list.map(o => o.orderId === order.orderId ? { ...o, status } : o));

    try {
      const res = await fetch('/api/admin/orders/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.orderId, status }),
      });
      if (!res.ok) throw new Error('update_failed');
    } catch {
      this.orders.update(list => list.map(o => o.orderId === order.orderId ? { ...o, status: previous } : o));
      this.error.set('No se pudo actualizar el estado del pedido');
    }
  }
}
