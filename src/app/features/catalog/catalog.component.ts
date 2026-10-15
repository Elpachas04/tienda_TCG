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

const SKELETONS = [1,2,3,4,5,6,7,8];

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
              Accesorios para One Piece TCG impresos en 3D. Cada pieza se fabrica cuando la pides, en el color que elijas.
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

        <!--
          Grid diferido hasta que el browser esté idle.
          El usuario puede navegar, hacer clic en pills y leer el header
          mientras el grid de tarjetas se construye en segundo plano.
        -->
        @defer (on idle) {
          @if (filteredProducts().length === 0) {
            <p class="font-body text-[13px] text-lv-cream/25 text-center py-28">
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
        } @placeholder {
          <!-- Skeleton mostrado mientras el browser no está idle aún -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12 lg:gap-x-8">
            @for (i of skeletons; track i) {
              <div class="animate-pulse">
                <div class="aspect-square rounded-card bg-white/[0.035]"></div>
                <div class="pt-4 space-y-3">
                  <div class="h-5 bg-white/[0.06] rounded-full w-3/5"></div>
                  <div class="h-3 bg-white/[0.04] rounded-full w-4/5"></div>
                </div>
              </div>
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

  protected readonly skeletons = SKELETONS;

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
