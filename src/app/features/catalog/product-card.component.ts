import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product, ProductVariant, Color } from '../../core/models/product.model';
import { CartItem } from '../../core/models/cart-item.model';
import { PLACEHOLDER } from '../../shared/constants';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="card card-hover flex flex-col group">
      <!-- imagen -->
      <div class="relative overflow-hidden aspect-square bg-tcg-border">
        <img
          [src]="currentImage()"
          [alt]="product.name"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          (error)="onImageError($event)"
        />
        @if (product.badge) {
          <span class="absolute top-3 left-3 badge-{{ product.badgeStyle ?? 'gold' }}">
            {{ product.badge }}
          </span>
        }
        @if (!product.available) {
          <div class="absolute inset-0 bg-black/70 flex items-center justify-center">
            <span class="text-tcg-muted font-body font-bold text-lg tracking-widest uppercase">Agotado</span>
          </div>
        }
        @if (product.images.length > 1) {
          <div class="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            @for (img of product.images; track $index) {
              <button
                class="w-1.5 h-1.5 rounded-full transition-colors"
                [class]="currentImageIndex() === $index ? 'bg-tcg-gold' : 'bg-white/30'"
                (click)="setImage($index); $event.stopPropagation()">
              </button>
            }
          </div>
        }
      </div>

      <div class="p-4 flex flex-col flex-1 gap-3">
        <!-- nombre -->
        <a [routerLink]="['/product', product.id]" class="hover:text-tcg-gold transition-colors">
          <h3 class="font-display text-xl text-tcg-text leading-tight tracking-wide">{{ product.name }}</h3>
        </a>

        <!-- descripción -->
        <p class="text-tcg-muted text-sm font-body leading-relaxed line-clamp-2 flex-1">{{ product.description }}</p>

        <!-- features con checkmark dorado -->
        <ul class="space-y-1">
          @for (f of product.features.slice(0, 3); track f) {
            <li class="flex items-start gap-1.5 text-xs text-tcg-muted font-body">
              <span class="text-tcg-gold mt-0.5 flex-shrink-0">✓</span>
              {{ f }}
            </li>
          }
        </ul>

        <!-- variantes -->
        @if (product.variants && product.variants.length > 0) {
          <div class="flex flex-wrap gap-1.5">
            @for (v of product.variants; track v.label) {
              <button
                class="px-2.5 py-1 text-xs font-body rounded border transition-colors"
                [class]="selectedVariant()?.label === v.label
                  ? 'border-tcg-gold bg-tcg-gold/10 text-tcg-gold'
                  : 'border-tcg-border text-tcg-muted hover:border-tcg-gold/50'"
                (click)="selectVariant(v)">
                {{ v.label }}
              </button>
            }
          </div>
        }

        <!-- color swatches -->
        @if (product.colorPickerEnabled && colors.length > 0) {
          <div>
            <div class="flex flex-wrap gap-1.5 mb-1">
              @for (color of colors; track color.id) {
                <button
                  class="w-6 h-6 rounded-full border-2 transition-all duration-150"
                  [style.background-color]="color.hex"
                  [class]="selectedColor()?.id === color.id
                    ? 'border-tcg-gold scale-110 shadow-lg'
                    : 'border-transparent hover:border-tcg-muted'"
                  [title]="color.name"
                  (click)="selectColor(color)">
                </button>
              }
            </div>
            @if (selectedColor(); as c) {
              <p class="text-xs text-tcg-muted font-body">{{ c.name }}</p>
            } @else {
              <p class="text-xs text-tcg-muted/50 font-body italic">Elige un color</p>
            }
          </div>
        }

        <!-- precio + botón -->
        <div class="flex items-center justify-between pt-3 border-t border-tcg-border mt-auto">
          <span class="font-display text-3xl text-tcg-gold leading-none">{{ currentPrice() }}€</span>
          <button
            class="btn-gold text-sm py-2 px-4"
            [disabled]="!product.available"
            (click)="addToCart()">
            Añadir a cesta
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Input() colors: Color[] = [];
  @Output() addedToCart = new EventEmitter<CartItem>();

  currentImageIndex = signal(0);
  selectedVariant = signal<ProductVariant | null>(null);
  selectedColor = signal<Color | null>(null);

  currentImage() {
    return this.product.images[this.currentImageIndex()] || PLACEHOLDER;
  }

  currentPrice() {
    return this.selectedVariant()?.price ?? this.product.price;
  }

  setImage(index: number) {
    this.currentImageIndex.set(index);
  }

  selectVariant(variant: ProductVariant) {
    this.selectedVariant.set(variant);
  }

  selectColor(color: Color) {
    this.selectedColor.set(this.selectedColor()?.id === color.id ? null : color);
  }

  addToCart() {
    this.addedToCart.emit({
      productId: this.product.id,
      productName: this.product.name,
      variant: this.selectedVariant()?.label,
      color: this.selectedColor()?.name,
      quantity: 1,
      unitPrice: this.currentPrice()
    });
    this.selectedColor.set(null);
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = PLACEHOLDER;
  }
}
