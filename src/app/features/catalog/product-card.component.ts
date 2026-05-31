import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal, inject, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product, ProductVariant, Color } from '../../core/models/product.model';
import { CartItem } from '../../core/models/cart-item.model';
import { ColorPickerComponent } from '../../shared/components/color-picker.component';
import { VariantPickerComponent } from '../../shared/components/variant-picker.component';
import { PLACEHOLDER } from '../../shared/constants';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, ColorPickerComponent, VariantPickerComponent],
  template: `
    <div class="card card-hover flex flex-col group">
      <!-- imagen: overflow-hidden aquí para que el dropdown de la card no quede recortado -->
      <div class="relative overflow-hidden rounded-t-card aspect-square bg-tcg-border">
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

      <!-- contenido -->
      <div class="p-4 flex flex-col flex-1">
        <a [routerLink]="['/product', product.id]" class="hover:text-tcg-gold transition-colors mb-2">
          <h3 class="font-display text-xl text-tcg-text leading-tight tracking-wide line-clamp-1">{{ product.name }}</h3>
        </a>

        <p class="text-tcg-muted text-sm font-body leading-relaxed line-clamp-2 flex-1 mb-3">{{ product.description }}</p>

        <ul class="space-y-1 mb-4">
          @for (f of product.features.slice(0, 3); track f) {
            <li class="flex items-start gap-1.5 text-xs text-tcg-muted font-body">
              <span class="text-tcg-gold mt-0.5 flex-shrink-0">✓</span>
              {{ f }}
            </li>
          }
        </ul>

        <!-- zona de compra: una sola fila, precio+botón siempre a la derecha -->
        <div class="mt-auto pt-3 border-t border-tcg-border">
          <div class="flex items-center justify-between gap-2">

            <!-- izquierda: color → tamaño (solo si existen) -->
            <!-- sin overflow-hidden para que los dropdowns no queden recortados -->
            <div class="flex items-center gap-1.5 min-w-0">
              @if (product.colorPickerEnabled && colors.length > 0) {
                <app-color-picker
                  [colors]="colors"
                  [layout]="'inline'"
                  [selected]="selectedColor()"
                  (selectedChange)="selectedColor.set($event)">
                </app-color-picker>
              }
              @if (product.variants && product.variants.length > 0) {
                <app-variant-picker
                  [variants]="product.variants"
                  [selected]="selectedVariant()"
                  (selectedChange)="selectedVariant.set($event)">
                </app-variant-picker>
              }
            </div>

            <!-- derecha: precio + botón (siempre visibles y alineados) -->
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <span class="font-display text-xl text-tcg-gold leading-none">{{ currentPrice() }}€</span>
              @if (product.variants && product.variants.length > 0) {
                <button
                  class="w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-200 disabled:opacity-40"
                  [class]="justAdded() ? 'bg-green-700 text-white' : 'bg-tcg-gold hover:bg-yellow-500 text-black'"
                  [disabled]="!product.available"
                  (click)="addToCart()">
                  @if (justAdded()) {
                    <span class="text-xs font-semibold">✓</span>
                  } @else {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                  }
                </button>
              } @else {
                <button
                  [class]="justAdded() ? 'btn-success text-sm py-1.5 px-3' : 'btn-gold text-sm py-1.5 px-3'"
                  [disabled]="!product.available"
                  (click)="addToCart()">
                  @if (justAdded()) { ✓ } @else { Añadir }
                </button>
              }
            </div>

          </div>
        </div>
      </div>
    </div>
  `
})
export class ProductCardComponent implements OnChanges {
  @Input({ required: true }) product!: Product;
  @Input() colors: Color[] = [];
  @Output() addedToCart = new EventEmitter<CartItem>();

  private destroyRef = inject(DestroyRef);
  private addTimer: ReturnType<typeof setTimeout> | null = null;

  currentImageIndex = signal(0);
  selectedVariant = signal<ProductVariant | null>(null);
  selectedColor = signal<Color | null>(null);
  justAdded = signal(false);

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.addTimer) clearTimeout(this.addTimer);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['colors'] && this.colors.length > 0 && !this.selectedColor()) {
      this.selectedColor.set(this.colors.find(c => c.id === 'negro') ?? this.colors[0]);
    }
    if (changes['product'] && this.product.variants?.length && !this.selectedVariant()) {
      this.selectedVariant.set(this.product.variants[0]);
    }
  }

  currentImage() {
    return this.product.images[this.currentImageIndex()] || PLACEHOLDER;
  }

  currentPrice() {
    return this.selectedVariant()?.price ?? this.product.price;
  }

  setImage(index: number) {
    this.currentImageIndex.set(index);
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
    this.justAdded.set(true);
    if (this.addTimer) clearTimeout(this.addTimer);
    this.addTimer = setTimeout(() => this.justAdded.set(false), 1500);
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = PLACEHOLDER;
  }
}
