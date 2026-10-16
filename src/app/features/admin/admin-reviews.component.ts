import { ChangeDetectionStrategy, Component, computed, inject, signal, afterNextRender } from '@angular/core';
import { AdminReview, ReviewStatus } from '../../core/models/review.model';
import { AdminCatalogService } from '../../core/services/admin-catalog.service';

const DATE_FORMAT = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

// Las valoraciones llegan desde el email de "Entregado" y entran como pendientes.
// Aquí se publican u ocultan, y el interruptor decide si la web las enseña.
@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <h1 class="font-display text-3xl text-lv-cream">Valoraciones</h1>
      <button type="button" role="switch" [attr.aria-checked]="visible()"
              class="flex items-center gap-3 rounded-xl border border-lv-border px-4 py-2.5 hover:bg-white/[0.03] disabled:opacity-50"
              [disabled]="savingSwitch() || !catalogReady()" (click)="toggleVisible()">
        <span class="font-body text-sm text-lv-cream/80">Mostrar en la web</span>
        <span class="relative w-10 h-6 rounded-full transition-colors flex-shrink-0" [class]="visible() ? 'bg-emerald-500/80' : 'bg-white/15'">
          <span class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform" [class.translate-x-4]="visible()"></span>
        </span>
      </button>
    </div>

    <p class="font-body text-sm text-lv-muted mb-6 max-w-2xl">
      @if (visible()) {
        La web enseña las publicadas en el inicio y en la ficha de cada producto valorado.
      } @else {
        La web no enseña ninguna todavía. Puedes ir publicando y activarlo cuando tengas unas cuantas.
      }
      Les llega el enlace para valorar en el email de "Entregado".
    </p>

    <div aria-live="polite">
      @if (loading()) {
        <p class="font-body text-sm text-lv-muted">Cargando valoraciones…</p>
      } @else if (error()) {
        <p class="rounded-xl border border-red-400/30 bg-red-400/5 text-red-300 font-body text-sm px-4 py-3 mb-4">{{ error() }}</p>
      } @else if (!reviews().length) {
        <p class="font-body text-sm text-lv-muted">Todavía no hay valoraciones.</p>
      }
    </div>

    <ul class="space-y-3">
      @for (r of reviews(); track r.orderId) {
        <li class="rounded-xl border bg-lv-surface/60 px-4 py-4"
            [class]="r.status === 'pendiente' ? 'border-lv-gold/40' : 'border-lv-border'">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-body text-lv-gold tracking-[2px]" [attr.aria-label]="r.rating + ' de 5'">{{ stars(r.rating) }}</p>
              <p class="font-body text-sm text-lv-cream/70 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                <span class="text-lv-cream">{{ r.name }}</span>
                <span>{{ r.orderId }}</span>
                <span>{{ date(r.createdAt) }}</span>
                @if (r.products.length) { <span>{{ r.products.join(', ') }}</span> }
              </p>
            </div>
            <span class="font-body text-xs rounded-full px-2.5 py-1"
                  [class]="r.status === 'publicada' ? 'bg-emerald-500/15 text-emerald-300' : r.status === 'pendiente' ? 'bg-lv-gold/15 text-lv-gold' : 'bg-white/10 text-lv-cream/60'">
              {{ statusLabel[r.status] }}
            </span>
          </div>

          @if (r.text) {
            <p class="font-body text-[15px] leading-relaxed text-lv-cream/85 mt-3 whitespace-pre-line">{{ r.text }}</p>
          }

          <div class="flex flex-wrap items-center gap-2 mt-4">
            @if (r.status !== 'publicada') {
              <button type="button" class="font-body text-sm rounded-lg px-3 py-2 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50"
                      [disabled]="busy() === r.orderId" (click)="setStatus(r, 'publicada')">Publicar</button>
            }
            @if (r.status !== 'oculta') {
              <button type="button" class="font-body text-sm rounded-lg px-3 py-2 border border-lv-border text-lv-cream/80 hover:bg-white/[0.04] disabled:opacity-50"
                      [disabled]="busy() === r.orderId" (click)="setStatus(r, 'oculta')">Ocultar</button>
            }
            <button type="button" class="font-body text-sm rounded-lg px-3 py-2 text-lv-muted hover:text-red-300 disabled:opacity-50 ml-auto"
                    [disabled]="busy() === r.orderId" (click)="remove(r)">Borrar</button>
          </div>
        </li>
      }
    </ul>
  `,
})
export class AdminReviewsComponent {
  private readonly admin = inject(AdminCatalogService);

  readonly reviews = signal<AdminReview[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly busy = signal<string | null>(null);
  readonly savingSwitch = signal(false);

  readonly catalogReady = computed(() => !!this.admin.catalog());
  readonly visible = computed(() => !!this.admin.catalog()?.settings?.reviewsVisible);

  readonly statusLabel: Record<ReviewStatus, string> = { pendiente: 'Pendiente', publicada: 'Publicada', oculta: 'Oculta' };

  constructor() {
    afterNextRender(() => {
      this.load();
      if (!this.admin.catalog()) this.admin.load().catch(() => {});
    });
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const res = await fetch('/api/admin/reviews');
      if (!res.ok) throw new Error();
      this.reviews.set(((await res.json()) as { reviews: AdminReview[] }).reviews);
    } catch {
      this.error.set('No se han podido cargar las valoraciones. Recarga la página.');
    } finally {
      this.loading.set(false);
    }
  }

  async setStatus(r: AdminReview, status: ReviewStatus): Promise<void> {
    this.busy.set(r.orderId);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: r.orderId, status }),
      });
      if (!res.ok) throw new Error();
      this.reviews.update(list => list.map(x => (x.orderId === r.orderId ? { ...x, status } : x)));
    } catch {
      this.error.set('No se ha podido guardar el cambio.');
    } finally {
      this.busy.set(null);
    }
  }

  async remove(r: AdminReview): Promise<void> {
    if (!confirm(`¿Borrar la valoración de ${r.name} (${r.orderId})? No se puede deshacer.`)) return;
    this.busy.set(r.orderId);
    try {
      const res = await fetch(`/api/admin/reviews?id=${encodeURIComponent(r.orderId)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      this.reviews.update(list => list.filter(x => x.orderId !== r.orderId));
    } catch {
      this.error.set('No se ha podido borrar.');
    } finally {
      this.busy.set(null);
    }
  }

  async toggleVisible(): Promise<void> {
    const settings = this.admin.catalog()?.settings;
    if (!settings) return;
    this.savingSwitch.set(true);
    const ok = await this.admin.saveCatalogSections({ settings: { ...settings, reviewsVisible: !settings.reviewsVisible } }).catch(() => false);
    if (!ok) this.error.set('No se ha podido cambiar. Prueba otra vez.');
    this.savingSwitch.set(false);
  }

  stars(n: number): string {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  date(iso: string): string {
    return DATE_FORMAT.format(new Date(iso));
  }
}
