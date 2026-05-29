import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal, inject, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product, ProductVariant, Color } from '../../core/models/product.model';
import { CartItem } from '../../core/models/cart-item.model';
import { ColorPickerComponent } from '../../shared/components/color-picker.component';
import { PLACEHOLDER } from '../../shared/constants';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, ColorPickerComponent],
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
          <h3 class="font-display text-xl text-tcg-text leading-tight tracking-wide">{{ product.name }}</h3>
        </a>

        <!-- descripción: se estira para nivelar todas las cards -->
        <p class="text-tcg-muted text-sm font-body leading-relaxed line-clamp-2 flex-1 mb-3">{{ product.description }}</p>

        <ul class="space-y-1 mb-4">
          @for (f of product.features.slice(0, 3); track f) {
            <li class="flex items-start gap-1.5 text-xs text-tcg-muted font-body">
              <span class="text-tcg-gold mt-0.5 flex-shrink-0">✓</span>
              {{ f }}
            </li>
          }
        </ul>

        <!-- zona de compra -->
        <div class="mt-auto pt-3 border-t border-tcg-border space-y-2">

          <!-- pills P/M/G: solo para productos con variantes -->
          @if (product.variants && product.variants.length > 0) {
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] text-tcg-muted/40 font-body uppercase tracking-wider flex-shrink-0">Talla</span>
              @for (v of product.variants; track v.label) {
                <button
                  class="w-7 h-7 text-xs font-body rounded border transition-colors flex items-center justify-center flex-shrink-0"
                  [class]="selectedVariant()?.label === v.label
                    ? 'border-tcg-gold bg-tcg-gold/10 text-tcg-gold'
                    : 'border-tcg-border text-tcg-muted hover:border-tcg-gold/50'"
                  [title]="v.label + ' — ' + v.price + '€'"
                  (click)="selectVariant(v)">
                  {{ variantAbbrev(v.label) }}
                </button>
              }
            </div>
          }

          <!-- fila única: color inline + precio + botón -->
          <div class="flex items-center gap-2">
            @if (product.colorPickerEnabled && colors.length > 0) {
              <div class="flex-1 min-w-0">
                <app-color-picker
                  [colors]="colors"
                  [layout]="'inline'"
                  [selected]="selectedColor()"
                  (selectedChange)="selectedColor.set($event)">
                </app-color-picker>
              </div>
            }
            <span class="font-display text-2xl text-tcg-gold leading-none flex-shrink-0">{{ currentPrice() }}€</span>
            <button
              [class]="justAdded() ? 'btn-success text-sm py-2 px-3' : 'btn-gold text-sm py-2 px-3'"
              [disabled]="!product.available"
              (click)="addToCart()">
              @if (justAdded()) { ✓ } @else { Añadir }
            </button>
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

  selectVariant(variant: ProductVariant) {
    this.selectedVariant.set(this.selectedVariant()?.label === variant.label ? null : variant);
  }

  variantAbbrev(label: string): string {
    return label.charAt(0).toUpperCase();
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
