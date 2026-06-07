import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { LvProductCardComponent } from '../landing/lv-product-card.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { CartItem } from '../../core/models/cart-item.model';
import { Product, CategoryItem, Color } from '../../core/models/product.model';
import { BASE_PILL } from '../../shared/constants';

type CategoryFilter = CategoryItem['id'];
type CategoryPill = CategoryItem & { count: number };

@Component({
  selector: 'app-catalog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LvProductCardComponent, RevealDirective],
  host: { class: 'block' },
  template: `
    <div class="bg-lv-black bg-grid-premium min-h-screen relative">

      <!-- Blobs de luz -->
      <div class="fixed -top-20 -right-20 sm:-top-40 sm:-right-40 w-[250px] h-[250px] sm:w-[450px] sm:h-[450px] lg:w-[600px] lg:h-[600px] bg-[#C9A84C]/[0.05] rounded-full blur-[80px] sm:blur-[140px] animate-aurora pointer-events-none" style="z-index:0"></div>
      <div class="fixed bottom-0 -left-10 sm:-left-60 w-40 h-40 sm:w-80 sm:h-80 bg-[#C9A84C]/[0.03] rounded-full blur-[60px] sm:blur-[100px] animate-aurora pointer-events-none" style="z-index:0;animation-delay:-9s"></div>

      <div class="relative max-w-[1600px] mx-auto px-4 sm:px-6 py-10 sm:py-16 lg:py-20" style="z-index:1">

        <!-- Header -->
        <div lvReveal class="mb-8 sm:mb-12 lg:mb-16">
          <p class="font-mono text-xs uppercase tracking-[0.35em] text-lv-gold/60 mb-4 sm:mb-5">— Colección completa</p>
          <h1 class="font-display uppercase leading-[0.9]">
            <span class="block text-lv-cream" style="font-size: clamp(2rem, 8vw, 7rem)">LO QUE</span>
            <span class="block text-lv-gold" style="font-size: clamp(2rem, 8vw, 7rem)">FABRICAMOS</span>
          </h1>
          <p class="font-mono text-xs uppercase tracking-wide text-lv-cream/30 mt-4 sm:mt-6 max-w-sm leading-relaxed">
            Accesorios para TCG impresos en 3D.<br>Cada pieza, por encargo. Cada color, el tuyo.
          </p>
        </div>

        <!-- Pills de filtro -->
        <div lvReveal class="flex flex-wrap gap-2 mb-8 sm:mb-12">
          @for (cat of categories(); track cat.id) {
            <button [class]="pillClass(cat.id)" (click)="activeCategory.set(cat.id)">
              {{ cat.label }}
              <span class="opacity-40 ml-1">({{ cat.count }})</span>
            </button>
          }
        </div>

        <!-- Grid de productos -->
        @if (filteredProducts().length === 0) {
          <p class="font-mono text-xs uppercase tracking-wider text-lv-cream/25 text-center py-28">
            Sin productos en esta categoría
          </p>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            @for (product of filteredProducts(); track product.id; let i = $index) {
              <app-lv-product-card
                [product]="product"
                [colors]="colorsArr"
                [delay]="(i * 50) + 'ms'"
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

  // El Input de LvProductCardComponent espera Color[] mutable
  get colorsArr() { return this.catalogService.colors as Color[]; }

  readonly activeCategory = signal<CategoryFilter>('all');

  // computed() memoriza hasta que activeCategory cambia — no recalcula en cada tick
  readonly categories = computed((): CategoryPill[] =>
    this.catalogService.categories.map(cat => ({
      ...cat,
      count: cat.id === 'all'
        ? this.catalogService.products.length
        : this.catalogService.products.filter((p: Product) => p.category === cat.id).length
    }))
  );

  readonly filteredProducts = computed((): Product[] => {
    const cat = this.activeCategory();
    return cat === 'all'
      ? [...this.catalogService.products]
      : this.catalogService.products.filter((p: Product) => p.category === cat);
  });

  pillClass(id: CategoryFilter): string {
    return this.activeCategory() === id
      ? `${BASE_PILL} bg-lv-gold text-black font-semibold`
      : `${BASE_PILL} liquid-glass border border-lv-gold/20 text-lv-cream/50 hover:border-lv-gold/40`;
  }

  onAddToCart(item: CartItem) {
    this.cartService.addItem(item);
  }
}
