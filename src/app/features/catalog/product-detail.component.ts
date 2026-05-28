import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { Product, ProductVariant } from '../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [AsyncPipe, RouterLink, FormsModule],
  template: `
    @if (product$ | async; as product) {
      <div class="max-w-5xl mx-auto px-4 py-10">
        <a routerLink="/catalog" class="flex items-center gap-1 text-gray-400 hover:text-white mb-8 transition-colors text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver al catálogo
        </a>

        <div class="grid md:grid-cols-2 gap-10">
          <div class="space-y-3">
            <div class="card overflow-hidden aspect-square bg-gray-700">
              <img
                [src]="currentImage()"
                [alt]="product.name"
                class="w-full h-full object-cover"
                (error)="onImageError($event)"
              />
            </div>
            @if (product.images.length > 1) {
              <div class="flex gap-3">
                @for (img of product.images; track $index) {
                  <button
                    class="w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors"
                    [class]="currentImageIndex() === $index ? 'border-red-500' : 'border-gray-600'"
                    (click)="setImage($index, product)">
                    <img [src]="img" [alt]="product.name + ' ' + $index" class="w-full h-full object-cover"
                         (error)="onImageError($event)"/>
                  </button>
                }
              </div>
            }
          </div>

          <div class="space-y-6">
            @if (product.badge) {
              <span class="inline-block bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-md">
                {{ product.badge }}
              </span>
            }
            <h1 class="text-3xl font-bold text-white">{{ product.name }}</h1>
            <p class="text-gray-300 leading-relaxed">{{ product.description }}</p>

            <ul class="space-y-2">
              @for (feature of product.features; track feature) {
                <li class="flex items-start gap-2 text-gray-300 text-sm">
                  <svg class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  {{ feature }}
                </li>
              }
            </ul>

            @if (product.variants && product.variants.length > 0) {
              <div>
                <p class="text-sm font-medium text-gray-400 mb-2">Variante</p>
                <div class="flex flex-wrap gap-2">
                  @for (variant of product.variants; track variant.label) {
                    <button
                      class="px-4 py-2 rounded-lg border transition-colors font-medium"
                      [class]="selectedVariant()?.label === variant.label
                        ? 'border-red-500 bg-red-500/20 text-red-400'
                        : 'border-gray-600 text-gray-300 hover:border-gray-400'"
                      (click)="selectVariant(variant)">
                      {{ variant.label }} — {{ variant.price }}€
                    </button>
                  }
                </div>
              </div>
            }

            <div>
              <p class="text-sm font-medium text-gray-400 mb-2">Color (opcional)</p>
              <input
                type="text"
                placeholder="Ej: Rojo, Azul marino, Negro mate..."
                class="input-field"
                [(ngModel)]="colorInput"
              />
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-gray-700">
              <span class="text-4xl font-bold text-white">{{ currentPrice(product) }}€</span>
              <button
                class="btn-primary"
                [disabled]="!product.available"
                (click)="addToCart(product)">
                @if (product.available) { Añadir a la cesta } @else { Agotado }
              </button>
            </div>

            @if (addedToast()) {
              <div class="bg-green-600/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                ¡Añadido a la cesta!
              </div>
            }
          </div>
        </div>
      </div>
    } @else {
      <div class="flex justify-center py-20">
        <div class="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }
  `
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private catalogService = inject(CatalogService);
  private cartService = inject(CartService);

  product$ = this.route.params.pipe(
    switchMap(params => this.catalogService.getProductById(params['id']))
  );

  currentImageIndex = signal(0);
  selectedVariant = signal<ProductVariant | null>(null);
  colorInput = '';
  addedToast = signal(false);

  ngOnInit() {}

  currentImage() {
    return `assets/products/placeholder.jpg`;
  }

  currentPrice(product: Product) {
    return this.selectedVariant()?.price ?? product.price;
  }

  setImage(index: number, product: Product) {
    this.currentImageIndex.set(index);
  }

  selectVariant(variant: ProductVariant) {
    this.selectedVariant.set(variant);
  }

  addToCart(product: Product) {
    this.cartService.addItem({
      productId: product.id,
      productName: product.name,
      variant: this.selectedVariant()?.label,
      color: this.colorInput || undefined,
      quantity: 1,
      unitPrice: this.currentPrice(product)
    });
    this.addedToast.set(true);
    setTimeout(() => this.addedToast.set(false), 2500);
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMyRDM3NDgiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI2NCIgZmlsbD0iIzRBNTU2OCI+8J+OqTwvdGV4dD48L3N2Zz4=';
  }
}
