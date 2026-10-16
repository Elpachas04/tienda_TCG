import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { SplitHeadingDirective } from '../../shared/directives/split-heading.directive';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { LvProductCardComponent } from '../landing/lv-product-card.component';
import { CartItem } from '../../core/models/cart-item.model';
import { Product, CategoryItem, Color } from '../../core/models/product.model';
import { BASE_PILL } from '../../shared/constants';

type CategoryFilter = CategoryItem['id'];
type CategoryPill = CategoryItem & { count: number };


@Component({
  selector: 'app-catalog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LvProductCardComponent, SplitHeadingDirective],
  host: { class: 'block' },
  template: `
    <div class="bg-lv-black min-h-screen">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-24">

        <header class="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end mb-10 sm:mb-14">
          <div>
            <h1 data-split class="lv-h1 text-lv-cream">Catálogo</h1>
            <p class="lv-lede mt-4">
              Accesorios para TCG. Cada pieza se fabrica cuando la pides, en el color que elijas.
            </p>
          </div>

          <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
            @for (cat of categories(); track cat.id) {
              <button type="button" [class]="pillClass(cat.id)" [attr.aria-pressed]="activeCategory() === cat.id"
                      (click)="activeCategory.set(cat.id)">
                {{ cat.label }}
                <span class="lv-price opacity-50 ml-1">{{ cat.count }}</span>
              </button>
            }
          </div>
        </header>

        <h2 class="sr-only">Productos</h2>
        <!-- Sin @defer: la rejilla sale en el HTML prerenderizado con enlaces a cada ficha -->
        @if (filteredProducts().length === 0) {
            <p class="font-body text-[13px] text-lv-cream/60 text-center py-28">
              Sin productos en esta categoría
            </p>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12 lg:gap-x-8">
              @for (product of filteredProducts(); track product.id; let i = $index) {
                <app-lv-product-card
                  [product]="product"
                  [colors]="colorsArr"
                  (added)="onAddToCart($event)">
                </app-lv-product-card>
              }
            </div>
          }

      </div>
    </div>
  `
})
export class CatalogComponent {
  protected readonly catalogService = inject(CatalogService);
  private   readonly cartService    = inject(CartService);


  get colorsArr() { return this.catalogService.colors as Color[]; }

  readonly activeCategory = signal<CategoryFilter>('all');

  // Un solo recorrido O(n) para construir las frecuencias,
  // en lugar de .filter() por cada categoría O(n×m)
  readonly categories = computed((): CategoryPill[] => {
    const freq = new Map<string, number>();
    for (const p of this.catalogService.products) {
      freq.set(p.category, (freq.get(p.category) ?? 0) + 1);
    }
    return this.catalogService.categories
      .map(cat => ({
        ...cat,
        count: cat.id === 'all' ? this.catalogService.products.length : (freq.get(cat.id) ?? 0),
      }))
      .filter(cat => cat.count > 0);
  });

  readonly filteredProducts = computed((): Product[] => {
    const cat = this.activeCategory();
    return cat === 'all'
      ? [...this.catalogService.products]
      : this.catalogService.products.filter((p: Product) => p.category === cat);
  });

  pillClass(id: CategoryFilter): string {
    return this.activeCategory() === id
      ? `${BASE_PILL} bg-lv-cream text-lv-black border border-lv-cream`
      : `${BASE_PILL} border border-lv-cream/15 text-lv-cream/70 hover:border-lv-cream/40 hover:text-lv-cream`;
  }

  onAddToCart(item: CartItem) {
    this.cartService.addItem(item);
  }
}
