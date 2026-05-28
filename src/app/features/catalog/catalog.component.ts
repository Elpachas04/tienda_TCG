import { Component, inject, signal, computed, DestroyRef } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, map, catchError, of } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { ProductCardComponent } from './product-card.component';
import { CartItem } from '../../core/models/cart-item.model';
import { Product, CategoryItem, Color } from '../../core/models/product.model';
import { TOAST_DURATION } from '../../shared/constants';

type CategoryFilter = CategoryItem['id'];
type CatalogData = { products: Product[]; categories: CategoryItem[]; colors: Color[] };

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [ProductCardComponent],
  template: `
    <!-- Hero -->
    <div class="hero">
      <img src="assets/logo/logo.png" alt="LayerVault" class="h-28 w-auto mx-auto mb-3 drop-shadow-xl">
      <p class="text-tcg-muted font-body text-sm tracking-widest uppercase">Barcelona · Accesorios 3D para TCG</p>
    </div>

    <div class="max-w-6xl mx-auto px-4 py-10">
      <!-- Toast añadido -->
      @if (toastVisible()) {
        <div class="fixed top-20 right-4 z-50 bg-tcg-surface border border-tcg-gold text-tcg-gold px-5 py-3 rounded-card shadow-2xl flex items-center gap-2 font-body text-sm">
          ✓ Añadido a la cesta
        </div>
      }

      @if (isLoading()) {
        <!-- Skeleton loader -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          @for (i of [1,2,3,4,5,6,7,8,9]; track i) {
            <div class="card animate-pulse">
              <div class="aspect-square bg-tcg-border"></div>
              <div class="p-4 space-y-3">
                <div class="h-5 bg-tcg-border rounded w-3/4"></div>
                <div class="h-3 bg-tcg-border rounded w-full"></div>
                <div class="h-3 bg-tcg-border rounded w-2/3"></div>
              </div>
            </div>
          }
        </div>
      } @else if (hasError()) {
        <div class="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <p class="text-tcg-muted font-body text-lg">No se pudo cargar el catálogo.</p>
          <p class="text-tcg-muted/50 font-body text-sm">Comprueba tu conexión y recarga la página.</p>
        </div>
      } @else {
        <!-- Filtros desde JSON -->
        <div class="flex flex-wrap gap-2 mb-8">
          @for (cat of categories(); track cat.id) {
            <button
              class="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-body transition-colors border"
              [class]="activeCategory() === cat.id
                ? 'bg-tcg-gold text-black border-tcg-gold font-semibold'
                : 'bg-tcg-surface text-tcg-muted border-tcg-border hover:border-tcg-gold/50'"
              (click)="activeCategory.set(cat.id)">
              <span>{{ cat.emoji }}</span> {{ cat.label }}
            </button>
          }
        </div>

        <!-- Grid de productos -->
        @if (filteredProducts().length === 0) {
          <p class="text-tcg-muted text-center py-16 font-body">No hay productos en esta categoría.</p>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            @for (product of filteredProducts(); track product.id) {
              <app-product-card
                [product]="product"
                [colors]="colors()"
                (addedToCart)="onAddToCart($event)">
              </app-product-card>
            }
          </div>
        }
      }
    </div>
  `
})
export class CatalogComponent {
  private catalogService = inject(CatalogService);
  private cartService = inject(CartService);
  private destroyRef = inject(DestroyRef);

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
  readonly toastVisible = signal(false);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.toastTimer) clearTimeout(this.toastTimer);
    });
  }

  readonly isLoading = computed(() => this.catalogData() === undefined);
  readonly hasError = computed(() => this.catalogData() === null);
  readonly categories = computed(() => this.catalogData()?.categories ?? []);
  readonly colors = computed(() => this.catalogData()?.colors ?? []);

  readonly filteredProducts = computed((): Product[] => {
    const data = this.catalogData();
    if (!data) return [];
    const cat = this.activeCategory();
    return cat === 'all' ? data.products : data.products.filter(p => p.category === cat);
  });

  onAddToCart(item: CartItem) {
    this.cartService.addItem(item);
    this.toastVisible.set(true);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastVisible.set(false), TOAST_DURATION);
  }
}
