import { ChangeDetectionStrategy, Component, computed, inject, input, afterNextRender } from '@angular/core';
import { ReviewsService } from '../../core/services/reviews.service';

// Valoraciones de clientes. No pinta nada si están desactivadas en el admin o si no hay ninguna publicada
// (en una ficha: ninguna de ese producto).
@Component({
  selector: 'app-reviews-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (list().length) {
      <section [class]="compact() ? 'mt-16 sm:mt-24' : 'border-t border-lv-cream/[0.06]'" aria-labelledby="reviews-title">
        <div [class]="compact() ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28'">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <h2 id="reviews-title" class="lv-h2 text-lv-cream">{{ compact() ? 'Lo que dicen quienes lo tienen' : 'Lo que dicen los clientes' }}</h2>
            <p class="text-[15px] text-lv-cream/70">
              <span class="text-lv-gold" aria-hidden="true">★</span>
              {{ average() }} de 5 · {{ list().length }} {{ list().length === 1 ? 'valoración' : 'valoraciones' }}
            </p>
          </div>

          <ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (r of visible(); track r.createdAt + r.name) {
              <li class="rounded-card border border-lv-cream/10 bg-white/[0.02] p-6 flex flex-col gap-4">
                <p class="text-lv-gold tracking-[2px] text-[15px]" [attr.aria-label]="r.rating + ' de 5 estrellas'">
                  {{ stars(r.rating) }}
                </p>
                @if (r.text) {
                  <p class="text-[16px] leading-relaxed text-lv-cream/85">{{ r.text }}</p>
                }
                <p class="mt-auto text-[14px] text-lv-cream/55">{{ r.name }} · {{ date(r.createdAt) }}</p>
              </li>
            }
          </ul>
        </div>
      </section>
    }
  `,
})
export class ReviewsSectionComponent {
  /** En una ficha: solo las valoraciones de ese producto */
  readonly productId = input<string | null>(null);
  readonly compact = computed(() => !!this.productId());

  private readonly service = inject(ReviewsService);

  readonly list = computed(() => {
    const id = this.productId();
    const all = this.service.reviews();
    return id ? all.filter(r => r.productIds.includes(id)) : all;
  });
  readonly visible = computed(() => this.list().filter(r => r.text).concat(this.list().filter(r => !r.text)).slice(0, 6));
  readonly average = computed(() => {
    const l = this.list();
    return (l.reduce((s, r) => s + r.rating, 0) / l.length).toFixed(1).replace('.', ',');
  });

  constructor() {
    afterNextRender(() => this.service.load());
  }

  stars(n: number): string {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  date(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }
}
