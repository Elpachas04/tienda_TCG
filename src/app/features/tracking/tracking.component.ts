import { Component, signal, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

type OrderStatus =
  | 'pending_payment'
  | 'payment_received'
  | 'in_production'
  | 'preparing_shipment'
  | 'shipped'
  | 'delivered';

interface OrderStatusResponse {
  orderId:         string;
  status:          OrderStatus;
  createdAt:       string;
  customerName:    string;
  items: Array<{
    productId:   string;
    productSku?: string;
    productName: string;
    quantity:    number;
    variant?:    string;
    color?:      string;
  }>;
  trackingNumber?: string;
  sellerNote?:     string;
  statusDates?:    Partial<Record<OrderStatus, string>>;
}

interface StatusStep {
  key:   OrderStatus;
  label: string;
  icon:  string;
}

const STEPS: StatusStep[] = [
  { key: 'pending_payment',    label: 'Pendiente de pago',  icon: '💳' },
  { key: 'payment_received',   label: 'Pago recibido',      icon: '✅' },
  { key: 'in_production',      label: 'En producción',      icon: '🖨️' },
  { key: 'preparing_shipment', label: 'Preparando envío',   icon: '📦' },
  { key: 'shipped',            label: 'Enviado',            icon: '🚚' },
  { key: 'delivered',          label: 'Entregado',          icon: '🏠' },
];

type ViewState = 'idle' | 'loading' | 'found' | 'not_found' | 'unavailable' | 'invalid';

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [FormsModule, RouterLink],
  host: { class: 'block animate-fade-up' },
  template: `
    <div class="bg-grid-premium min-h-screen relative">
      <div class="absolute -top-40 -right-40 w-[500px] h-[500px] bg-[#C9A84C]/[0.04] rounded-full blur-[120px] pointer-events-none"></div>

      <div class="max-w-2xl mx-auto px-6 py-16 relative" style="z-index:1">

        <div class="mb-10">
          <a routerLink="/catalog"
             class="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-lv-cream/40 hover:text-lv-gold transition-colors duration-200 mb-8">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Volver al catálogo
          </a>
          <p class="font-mono text-xs uppercase tracking-[0.35em] text-lv-gold/60 mb-4">— Estado del pedido</p>
          <h1 class="font-display uppercase leading-none">
            <span class="block text-lv-cream" style="font-size:clamp(1.8rem,5vw,3rem)">CONSULTA TU</span>
            <span class="block text-lv-gold"  style="font-size:clamp(1.8rem,5vw,3rem)">PEDIDO</span>
          </h1>
        </div>

        <!-- Search form -->
        <div class="liquid-glass rounded-[20px] p-6 border border-white/[0.05] mb-6">
          <label class="block font-mono text-[10px] uppercase tracking-widest text-lv-cream/40 mb-2">
            Número de pedido
          </label>
          <div class="flex gap-3">
            <input
              type="text"
              class="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 font-mono text-sm text-lv-cream placeholder-lv-cream/20 focus:outline-none focus:border-lv-gold/40 transition-colors uppercase tracking-widest"
              placeholder="LV-240604-A3K7"
              maxlength="14"
              [(ngModel)]="inputId"
              (keydown.enter)="search()"
              (input)="onInput()" />
            <button type="button"
              class="px-6 py-3 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold transition-all duration-200 flex-shrink-0"
              [class]="canSearch()
                ? 'bg-lv-gold hover:brightness-110 text-black'
                : 'bg-white/[0.04] text-lv-cream/20 cursor-not-allowed'"
              [disabled]="!canSearch() || state() === 'loading'"
              (click)="search()">
              @if (state() === 'loading') {
                <span class="w-3.5 h-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin inline-block"></span>
              } @else {
                Buscar
              }
            </button>
          </div>
          @if (state() === 'invalid') {
            <p class="font-mono text-[10px] text-red-400/80 uppercase tracking-wider mt-2">
              Formato inválido — debe ser LV-YYMMDD-XXXX
            </p>
          }
        </div>

        <!-- States -->

        @if (state() === 'not_found') {
          <div class="liquid-glass rounded-[20px] p-8 border border-white/[0.05] text-center space-y-3">
            <div class="text-4xl">🔍</div>
            <p class="font-display text-xl text-lv-cream uppercase tracking-wide">Pedido no encontrado</p>
            <p class="font-mono text-xs text-lv-cream/30 leading-relaxed">
              Comprueba que el ID es correcto. Si acabas de hacer el pedido, puede tardar unos minutos en aparecer.
            </p>
          </div>
        }

        @if (state() === 'unavailable') {
          <div class="liquid-glass rounded-[20px] p-8 border border-lv-gold/10 text-center space-y-3">
            <div class="text-4xl">⚙️</div>
            <p class="font-display text-xl text-lv-cream uppercase tracking-wide">Activando sistema</p>
            <p class="font-mono text-xs text-lv-cream/30 leading-relaxed">
              El seguimiento de pedidos está siendo configurado. Escríbenos por Telegram para consultar el estado.
            </p>
          </div>
        }

        @if (state() === 'found' && order()) {
          <div class="space-y-4">

            <!-- Header -->
            <div class="liquid-glass rounded-[20px] p-6 border border-lv-gold/20">
              <div class="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p class="font-mono text-[10px] uppercase tracking-widest text-lv-gold/60 mb-1">Pedido</p>
                  <p class="font-display text-2xl text-lv-gold tracking-widest">{{ order()!.orderId }}</p>
                </div>
                <div class="text-right">
                  <p class="font-mono text-[10px] uppercase tracking-widest text-lv-cream/30 mb-1">Realizado el</p>
                  <p class="font-mono text-xs text-lv-cream/60">{{ formatDate(order()!.createdAt) }}</p>
                </div>
              </div>
            </div>

            <!-- Status timeline -->
            <div class="liquid-glass rounded-[20px] p-6 border border-white/[0.05]">
              <p class="font-mono text-[10px] uppercase tracking-widest text-lv-cream/40 mb-5">Estado</p>
              <div class="space-y-0">
                @for (step of steps; track step.key; let last = $last) {
                  <div class="flex gap-4 items-start">
                    <!-- Connector -->
                    <div class="flex flex-col items-center flex-shrink-0">
                      <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm transition-all duration-300"
                        [class]="stepClass(step.key)">
                        @if (isCompleted(step.key)) {
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                          </svg>
                        } @else if (isCurrent(step.key)) {
                          <div class="w-2.5 h-2.5 rounded-full bg-lv-gold animate-pulse"></div>
                        } @else {
                          <div class="w-2 h-2 rounded-full bg-current opacity-30"></div>
                        }
                      </div>
                      @if (!last) {
                        <div class="w-px flex-1 my-1 min-h-[20px]"
                          [class]="isCompleted(step.key) ? 'bg-lv-gold/40' : 'bg-white/[0.06]'">
                        </div>
                      }
                    </div>
                    <!-- Label -->
                    <div class="pb-5 pt-1 flex-1">
                      <div class="flex items-baseline justify-between gap-2 flex-wrap">
                        <p class="font-mono text-xs uppercase tracking-wider transition-colors duration-300"
                          [class]="isCurrent(step.key) ? 'text-lv-gold' : isCompleted(step.key) ? 'text-lv-cream/70' : 'text-lv-cream/20'">
                          {{ step.icon }} {{ step.label }}
                        </p>
                        @if (stepDate(step.key)) {
                          <span class="font-mono text-[9px] text-lv-cream/30 flex-shrink-0">{{ stepDate(step.key) }}</span>
                        }
                      </div>
                      @if (isCurrent(step.key) && step.key === 'shipped' && order()!.trackingNumber) {
                        <p class="font-mono text-[10px] text-lv-gold/60 mt-1">
                          Tracking: {{ order()!.trackingNumber }}
                        </p>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Items -->
            <div class="liquid-glass rounded-[20px] p-6 border border-white/[0.05]">
              <p class="font-mono text-[10px] uppercase tracking-widest text-lv-cream/40 mb-4">Productos</p>
              <div class="space-y-3">
                @for (item of order()!.items; track item.productId + (item.variant ?? '') + (item.color ?? '')) {
                  <div class="flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0">
                    <div class="flex-1 min-w-0">
                      <p class="font-display text-base text-lv-cream leading-tight tracking-wide">
                        <span class="text-lv-gold mr-1.5">{{ item.quantity }}×</span>{{ item.productName }}
                      </p>
                      <div class="flex gap-1.5 mt-1 flex-wrap items-center">
                        @if (item.productSku) {
                          <span class="font-mono text-[9px] uppercase tracking-wider text-lv-cream/30 bg-white/[0.04] rounded-full px-2 py-0.5">{{ item.productSku }}</span>
                        }
                        @if (item.variant) {
                          <span class="font-mono text-[9px] uppercase tracking-wider text-lv-cream/50 bg-white/[0.06] rounded-full px-2 py-0.5">{{ item.variant }}</span>
                        }
                        @if (item.color) {
                          <span class="font-mono text-[9px] uppercase tracking-wider text-lv-gold bg-lv-gold/[0.10] rounded-full px-2 py-0.5">{{ item.color }}</span>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Seller note -->
            @if (order()!.sellerNote) {
              <div class="liquid-glass rounded-[20px] p-5 border border-lv-gold/10 flex items-start gap-3">
                <span class="text-lv-gold/50 flex-shrink-0">📝</span>
                <p class="font-body text-sm text-lv-cream/60 leading-relaxed">{{ order()!.sellerNote }}</p>
              </div>
            }

          </div>
        }

      </div>
    </div>
  `
})
export class TrackingComponent implements OnInit {
  private route = inject(ActivatedRoute);

  protected readonly steps = STEPS;

  inputId = signal('');
  state   = signal<ViewState>('idle');
  order   = signal<OrderStatusResponse | null>(null);

  // Format: LV-YYMMDD-XXXX (14 chars)
  private readonly ID_RE = /^LV-\d{6}-[A-Z2-9]{4}$/;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const id = (params['id'] ?? '').trim().toUpperCase();
      if (id && this.ID_RE.test(id)) {
        this.inputId.set(id);
        this.search();
      }
    });
  }

  onInput(): void {
    this.inputId.set(this.inputId().toUpperCase());
    if (this.state() !== 'idle') this.state.set('idle');
  }

  canSearch(): boolean {
    return this.inputId().trim().length > 0;
  }

  async search(): Promise<void> {
    const id = this.inputId().trim().toUpperCase();
    if (!id) return;

    if (!this.ID_RE.test(id)) {
      this.state.set('invalid');
      return;
    }

    this.state.set('loading');
    this.order.set(null);

    try {
      const res = await fetch(`/.netlify/functions/get-order-status?id=${encodeURIComponent(id)}`);

      if (res.status === 503) { this.state.set('unavailable'); return; }
      if (res.status === 404) { this.state.set('not_found');   return; }
      if (res.status === 400) { this.state.set('invalid');     return; }

      if (res.ok) {
        const data = await res.json() as OrderStatusResponse;
        this.order.set(data);
        this.state.set('found');
        return;
      }

      this.state.set('not_found');
    } catch {
      this.state.set('not_found');
    }
  }

  stepIndex(key: OrderStatus): number {
    return STEPS.findIndex(s => s.key === key);
  }

  currentIndex(): number {
    return this.order() ? this.stepIndex(this.order()!.status) : -1;
  }

  isCompleted(key: OrderStatus): boolean {
    return this.stepIndex(key) < this.currentIndex();
  }

  isCurrent(key: OrderStatus): boolean {
    return this.stepIndex(key) === this.currentIndex();
  }

  stepClass(key: OrderStatus): string {
    if (this.isCurrent(key))   return 'border-lv-gold bg-lv-gold/10 text-lv-gold';
    if (this.isCompleted(key)) return 'border-lv-gold/50 bg-lv-gold/[0.06] text-lv-gold/70';
    return 'border-white/[0.08] bg-white/[0.02] text-lv-cream/20';
  }

  stepDate(key: OrderStatus): string {
    const iso = this.order()?.statusDates?.[key];
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return iso;
    }
  }
}
