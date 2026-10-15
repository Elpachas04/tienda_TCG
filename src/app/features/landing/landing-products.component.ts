import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SplitHeadingDirective } from '../../shared/directives/split-heading.directive';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { LvProductCardComponent } from './lv-product-card.component';
import { CartItem } from '../../core/models/cart-item.model';

@Component({
  selector: 'app-landing-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LvProductCardComponent, SplitHeadingDirective],
  host: { class: 'block' },
  template: `
    <section class="bg-lv-black py-20 sm:py-28 lg:py-32">
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        <div class="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 mb-10 sm:mb-14">
          <div class="max-w-xl">
            <h2 data-split class="lv-h2 text-lv-cream">Cada pieza, un propósito</h2>
            <p class="lv-note mt-4 max-w-md">
              Las más pedidas. Todas se fabrican cuando haces el pedido, en el color que elijas.
            </p>
          </div>
          <a routerLink="/catalog" class="lv-link text-[15px]">Ver todo el catálogo</a>
        </div>
      </div>

      <!-- Móvil: fila con scroll nativo y la siguiente pieza asomando. Escritorio: rejilla de 3 -->
      <div class="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8
                  overflow-x-auto sm:overflow-visible snap-x snap-mandatory scroll-px-4
                  px-4 sm:px-6 pb-2 max-w-7xl mx-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        @for (p of featured; track p.id) {
          <div class="snap-start shrink-0 w-[78%] sm:w-auto">
            <app-lv-product-card [product]="p" [colors]="colors" (added)="onAdd($event)" />
          </div>
        }
      </div>
    </section>
  `,
})
export class LandingProductsComponent {
  private catalog = inject(CatalogService);
  private cart    = inject(CartService);

  readonly colors   = [...this.catalog.colors];
  readonly featured = this.catalog.products.slice(0, 3);

  onAdd(item: CartItem) {
    this.cart.addItem(item);
  }
}
