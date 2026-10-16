import { ChangeDetectionStrategy, Component, computed, inject, input, afterNextRender } from '@angular/core';
import { ReviewsService } from '../../core/services/reviews.service';

/** Primero las que tienen fotos y texto */
const score = (r: { text: string; photos: string[] }) => (r.photos.length ? 2 : 0) + (r.text ? 1 : 0);

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

          <!-- Columnas según cuántas haya: con 1 o 2 no quedan huecos vacíos -->
          <ul class="mt-8 grid gap-4" [class]="cols()">
            @for (r of visible(); track r.createdAt + r.name) {
              <li class="rounded-card border border-lv-cream/10 bg-white/[0.02] p-6 flex flex-col gap-4">
                <p class="tracking-[2px] text-[15px]" role="img" [attr.aria-label]="r.rating + ' de 5 estrellas'">
                  <span class="text-lv-gold">{{ stars(r.rating) }}</span><span class="text-lv-cream/25">{{ stars(5 - r.rating) }}</span>
                </p>
                @if (r.text) {
                  <p class="text-[16px] leading-relaxed text-lv-cream/85">{{ r.text }}</p>
                }
                @if (r.photos.length) {
                  <div class="flex gap-2">
                    @for (id of r.photos; track id) {
                      <a [href]="photo(id, 1400)" target="_blank" rel="noopener noreferrer" class="block w-20 h-20 rounded-lg overflow-hidden border border-lv-cream/10 hover:border-lv-gold/50">
                        <img [src]="photo(id, 200)" [alt]="'Foto de ' + r.name" loading="lazy" width="80" height="80" class="w-full h-full object-cover" />
                      </a>
                    }
                  </div>
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
  readonly visible = computed(() => [...this.list()].sort((a, b) => score(b) - score(a)).slice(0, 6));
  readonly cols = computed(() => {
    const n = this.visible().length;
    return n === 1 ? 'max-w-md' : n === 2 || n === 4 ? 'sm:grid-cols-2 max-w-4xl' : 'sm:grid-cols-2 lg:grid-cols-3';
  });
  readonly average = computed(() => {
    const l = this.list();
    return (l.reduce((s, r) => s + r.rating, 0) / l.length).toFixed(1).replace('.', ',');
  });

  constructor() {
    afterNextRender(() => this.service.load());
  }

  photo(id: string, size: number): string {
    const t = size > 400 ? `f_auto,q_auto,c_limit,w_${size}` : `f_auto,q_auto,c_fill,w_${size},h_${size}`;
    return `https://res.cloudinary.com/dew1whfdu/image/upload/${t}/${id}`;
  }

  stars(n: number): string {
    return '★'.repeat(n);
  }

  date(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }
}
