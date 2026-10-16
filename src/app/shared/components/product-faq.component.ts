import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../core/models/product.model';
import { CatalogService } from '../../core/services/catalog.service';
import { productFaq } from '../../core/assistant/shop-knowledge';

// Preguntas frecuentes de la ficha. Las respuestas salen de los datos del producto (no se escriben a mano),
// así que si cambias medidas, colores o líderes en el admin, se actualizan solas.
@Component({
  selector: 'app-product-faq',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  host: { class: 'block' },
  template: `
    <section class="mt-16 sm:mt-24 max-w-3xl" aria-labelledby="faq-title">
      <h2 id="faq-title" class="lv-h2 text-lv-cream">Preguntas frecuentes</h2>
      <div class="mt-6 border-t border-lv-cream/10">
        @for (item of faq(); track item.q) {
          <details class="group border-b border-lv-cream/10">
            <summary class="flex items-center justify-between gap-4 py-4 cursor-pointer list-none text-[17px] font-semibold text-lv-cream hover:text-lv-foil">
              {{ item.q }}
              <svg class="w-4 h-4 flex-shrink-0 text-lv-cream/60 transition-transform group-open:rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>
            </summary>
            <div class="pb-5 -mt-1 text-[15px] leading-relaxed text-lv-cream/75 max-w-[65ch]">
              <p>{{ item.a.text }}</p>
              @if (item.a.link; as link) {
                @if (link.external) {
                  <a [href]="link.url" target="_blank" rel="noopener noreferrer" class="lv-link inline-block mt-2 text-sm">{{ link.label }}</a>
                } @else {
                  <a [routerLink]="link.url" class="lv-link inline-block mt-2 text-sm">{{ link.label }}</a>
                }
              }
            </div>
          </details>
        }
      </div>
    </section>
  `,
  styles: [`summary::-webkit-details-marker { display: none; }`],
})
export class ProductFaqComponent {
  readonly product = input.required<Product>();
  private readonly catalog = inject(CatalogService);

  readonly faq = computed(() => productFaq(this.product(), {
    products: this.catalog.products,
    colors: this.catalog.colors,
    addons: this.catalog.addons,
    settings: this.catalog.settings,
  }));
}
