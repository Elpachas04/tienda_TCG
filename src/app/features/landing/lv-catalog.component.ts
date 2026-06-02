import { Component, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, map, catchError, of } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { CartItem } from '../../core/models/cart-item.model';
import { Product, CategoryItem, Color } from '../../core/models/product.model';
import { LvProductCardComponent } from './lv-product-card.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { BASE_PILL } from '../../shared/constants';

type CategoryFilter = CategoryItem['id'];
type CatalogData = { products: Product[]; categories: CategoryItem[]; colors: Color[] };

@Component({
  selector: 'app-lv-catalog',
  standalone: true,
  imports: [LvProductCardComponent, RevealDirective],
  host: { class: 'block' },
  template: `
    <section id="catalogo" class="bg-lv-black py-24 md:py-32 px-6">
      <div class="max-w-[1600px] mx-auto">

        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
          <div lvReveal>
            <p class="font-mono text-xs uppercase tracking-wider text-lv-gold/70 mb-3">— Catálogo completo</p>
            <h2 class="font-display uppercase text-5xl md:text-7xl leading-none">
              <span class="text-lv-cream block">LO QUE</span>
              <span class="text-lv-gold block">FABRICAMOS</span>
            </h2>
          </div>

          <!-- Filter pills -->
          <div lvReveal class="flex gap-2 flex-wrap">
            @for (cat of categories(); track cat.id) {
              <button [class]="pillClass(cat.id)" (click)="activeFilter.set(cat.id)">
                {{ cat.label }}
              </button>
            }
          </div>
        </div>

        <!-- Product grid -->
        @if (filteredProducts().length > 0) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            @for (p of filteredProducts(); track p.id; let i = $index) {
              <app-lv-product-card
                [product]="p"
                [colors]="colors()"
                [delay]="i * 60 + 'ms'"
                (added)="onAddToCart($event)" />
            }
          </div>
        }

      </div>
    </section>
  `,
})
export class LvCatalogComponent {
  private catalogService = inject(CatalogService);
  private cartService    = inject(CartService);

  private readonly catalogData = toSignal(
    combineLatest([
      this.catalogService.getProducts(),
      this.catalogService.getCategories(),
      this.catalogService.getColors(),
    ]).pipe(
      map(([products, categories, colors]): CatalogData => ({ products, categories, colors })),
      catchError(() => of(null as CatalogData | null))
    )
  );

  readonly activeFilter = signal<CategoryFilter>('all');
  readonly colors       = computed(() => this.catalogData()?.colors ?? []);

  readonly categories = computed(() => this.catalogData()?.categories ?? []);

  readonly filteredProducts = computed((): Product[] => {
    const data = this.catalogData();
    if (!data) return [];
    const f = this.activeFilter();
    return f === 'all' ? data.products : data.products.filter(p => p.category === f);
  });

  pillClass(id: CategoryFilter): string {
    return this.activeFilter() === id
      ? `${BASE_PILL} bg-lv-gold text-black font-semibold`
      : `${BASE_PILL} liquid-glass border border-lv-gold/20 text-lv-cream/60`;
  }

  onAddToCart(item: CartItem): void {
    this.cartService.addItem(item);
    this.cartService.openDrawer();
  }
}
