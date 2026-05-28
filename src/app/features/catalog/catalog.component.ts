import { Component, inject, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { combineLatest, map } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { ProductCardComponent } from './product-card.component';
import { CartItem } from '../../core/models/cart-item.model';
import { Product, CategoryItem } from '../../core/models/product.model';

type CategoryFilter = CategoryItem['id'];

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [AsyncPipe, ProductCardComponent],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-10">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="font-display text-5xl text-tcg-gold tracking-wider mb-1">CATÁLOGO</h1>
        <p class="text-tcg-muted font-body">Accesorios impresos en 3D para One Piece Card Game · Barcelona</p>
      </div>

      <!-- Toast añadido -->
      @if (toastVisible()) {
        <div class="fixed top-20 right-4 z-50 bg-tcg-surface border border-tcg-gold text-tcg-gold px-5 py-3 rounded-card shadow-2xl flex items-center gap-2 font-body text-sm">
          ✓ Añadido a la cesta
        </div>
      }

      @if (data$ | async; as data) {
        <!-- Filtros desde JSON -->
        <div class="flex flex-wrap gap-2 mb-8">
          @for (cat of data.categories; track cat.id) {
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
        @let filtered = filteredProducts(data.products);
        @if (filtered.length === 0) {
          <p class="text-tcg-muted text-center py-16 font-body">No hay productos en esta categoría.</p>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            @for (product of filtered; track product.id) {
              <app-product-card
                [product]="product"
                (addedToCart)="onAddToCart($event)">
              </app-product-card>
            }
          </div>
        }
      } @else {
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
      }
    </div>
  `
})
export class CatalogComponent {
  private catalogService = inject(CatalogService);
  private cartService = inject(CartService);

  data$ = combineLatest([
    this.catalogService.getProducts(),
    this.catalogService.getCategories()
  ]).pipe(map(([products, categories]) => ({ products, categories })));

  activeCategory = signal<CategoryFilter>('all');
  toastVisible = signal(false);

  filteredProducts(products: Product[]) {
    if (this.activeCategory() === 'all') return products;
    return products.filter(p => p.category === this.activeCategory());
  }

  onAddToCart(item: CartItem) {
    this.cartService.addItem(item);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 2500);
  }
}
