import { Component, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, map, catchError, of } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { ProductCardComponent } from './product-card.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { CartItem } from '../../core/models/cart-item.model';
import { Product, CategoryItem, Color } from '../../core/models/product.model';

type CategoryFilter = CategoryItem['id'];
type CatalogData = { products: Product[]; categories: CategoryItem[]; colors: Color[] };
type CategoryPill = CategoryItem & { count: number };

const BASE_PILL = 'font-mono text-xs uppercase tracking-wider rounded-full px-5 py-2 transition-all duration-200 cursor-pointer';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [ProductCardComponent, RevealDirective],
  host: { class: 'block' },
  template: `
    <div class="bg-grid-premium min-h-screen relative">

      <!-- Blobs de luz -->
      <div class="fixed -top-40 -right-40 w-[600px] h-[600px] bg-[#C9A84C]/[0.05] rounded-full blur-[140px] animate-aurora pointer-events-none" style="z-index:0"></div>
      <div class="fixed bottom-0 -left-60 w-80 h-80 bg-[#C9A84C]/[0.03] rounded-full blur-[100px] animate-aurora pointer-events-none" style="z-index:0;animation-delay:-9s"></div>

      <div class="relative max-w-[1600px] mx-auto px-6 py-20" style="z-index:1">

        <!-- Header -->
        <div lvReveal class="mb-16">
          <p class="font-mono text-xs uppercase tracking-[0.35em] text-lv-gold/60 mb-5">— Colección completa</p>
          <h1 class="font-display uppercase leading-[0.9]">
            <span class="block text-lv-cream" style="font-size: clamp(3rem, 8vw, 7rem)">LO QUE</span>
            <span class="block text-lv-gold" style="font-size: clamp(3rem, 8vw, 7rem)">FABRICAMOS</span>
          </h1>
          <p class="font-mono text-xs uppercase tracking-wide text-lv-cream/30 mt-6 max-w-sm leading-relaxed">
            Accesorios para TCG impresos en Barcelona.<br>Cada pieza, por encargo. Cada color, el tuyo.
          </p>
        </div>

        @if (isLoading()) {
          <!-- Skeleton -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            @for (i of [1,2,3,4,5,6,7,8]; track i) {
              <div class="liquid-glass rounded-[24px] animate-pulse">
                <div class="aspect-square bg-white/[0.03] rounded-[16px] m-3"></div>
                <div class="px-4 pb-4 space-y-3">
                  <div class="h-3 bg-white/[0.04] rounded-full w-1/3"></div>
                  <div class="h-5 bg-white/[0.06] rounded-full w-4/5"></div>
                  <div class="h-7 bg-white/[0.04] rounded-full w-2/5"></div>
                </div>
              </div>
            }
          </div>
        } @else if (hasError()) {
          <div class="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <p class="font-display text-4xl text-lv-cream/20 uppercase tracking-wide">Sin conexión</p>
            <p class="font-mono text-xs text-lv-cream/15 uppercase tracking-wider">Comprueba tu conexión y recarga</p>
          </div>
        } @else {

          <!-- Pills de filtro -->
          <div lvReveal class="flex flex-wrap gap-2 mb-12">
            @for (cat of categories(); track cat.id) {
              <button [class]="pillClass(cat.id)" (click)="activeCategory.set(cat.id)">
                {{ cat.emoji }} {{ cat.label }}
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
                <app-product-card
                  [product]="product"
                  [colors]="colors()"
                  [delay]="(i * 50) + 'ms'"
                  (addedToCart)="onAddToCart($event)">
                </app-product-card>
              }
            </div>
          }
        }
      </div>
    </div>
  `
})
export class CatalogComponent {
  private catalogService = inject(CatalogService);
  private cartService    = inject(CartService);

  private readonly catalogData = toSignal(
    combineLatest([
      this.catalogService.getProducts(),
      this.catalogService.getCategories(),
      this.catalogService.getColors()
    ]).pipe(
      map(([products, categories, colors]): CatalogData => ({ products, categories, colors })),
      catchError(() => of(null as CatalogData | null))
    )
  );

  readonly activeCategory = signal<CategoryFilter>('all');
  readonly isLoading = computed(() => this.catalogData() === undefined);
  readonly hasError  = computed(() => this.catalogData() === null);

  readonly categories = computed((): CategoryPill[] => {
    const data = this.catalogData();
    if (!data) return [];
    return data.categories.map(cat => ({
      ...cat,
      count: cat.id === 'all'
        ? data.products.length
        : data.products.filter(p => p.category === cat.id).length
    }));
  });

  readonly colors = computed(() => this.catalogData()?.colors ?? []);

  readonly filteredProducts = computed((): Product[] => {
    const data = this.catalogData();
    if (!data) return [];
    const cat = this.activeCategory();
    return cat === 'all' ? data.products : data.products.filter(p => p.category === cat);
  });

  pillClass(id: CategoryFilter): string {
    return this.activeCategory() === id
      ? `${BASE_PILL} bg-lv-gold text-black font-semibold`
      : `${BASE_PILL} liquid-glass border border-lv-gold/20 text-lv-cream/50 hover:border-lv-gold/40`;
  }

  onAddToCart(item: CartItem) {
    this.cartService.addItem(item);
    this.cartService.openDrawer();
  }
}
