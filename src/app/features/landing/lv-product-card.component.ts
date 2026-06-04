import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal, inject, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product, ProductVariant, Color } from '../../core/models/product.model';
import { CartItem } from '../../core/models/cart-item.model';
import { CardGlowDirective } from '../../shared/directives/card-glow.directive';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { PLACEHOLDER } from '../../shared/constants';
import { CloudinaryService } from '../../core/services/cloudinary.service';

@Component({
  selector: 'app-lv-product-card',
  standalone: true,
  imports: [RouterLink, CardGlowDirective, RevealDirective],
  host: { class: 'block h-full' },
  template: `
    <div lvCardGlow lvReveal
         [style.transition-delay]="delay"
         class="relative h-full card-glow liquid-glass rounded-[28px] flex flex-col group
                before:absolute before:inset-0 before:rounded-[28px] before:opacity-0
                before:transition-opacity before:duration-500 before:pointer-events-none
                hover:before:opacity-100
                before:bg-[radial-gradient(300px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(201,168,76,0.08),transparent_80%)]"
         style="overflow:visible;">

      <!-- Image area -->
      <a [routerLink]="['/product', product.id]"
         class="relative m-3 aspect-square bg-lv-surface rounded-[20px] overflow-hidden block flex-shrink-0">
        @if (product.video) {
          <video
            class="w-full h-full object-cover"
            [src]="product.video"
            autoplay muted loop playsinline
            preload="none">
          </video>
        } @else {
          <img
            [src]="currentImage()"
            [alt]="product.name"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            (error)="onImageError($event)"
          />
        }
        @if (product.badge) {
          <span class="absolute top-2 left-2 liquid-glass rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-lv-gold border border-lv-gold/30">
            {{ product.badge }}
          </span>
        }
        @if (product.images.length > 1) {
          <div class="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            @for (img of product.images; track $index) {
              <button
                class="w-1.5 h-1.5 rounded-full transition-colors"
                [class]="currentImageIndex() === $index ? 'bg-lv-gold' : 'bg-white/30'"
                (click)="setImage($index); $event.stopPropagation(); $event.preventDefault()">
              </button>
            }
          </div>
        }
        @if (!product.available) {
          <div class="absolute inset-0 bg-black/80 flex items-center justify-center">
            <span class="font-mono text-xs uppercase tracking-widest text-lv-cream/40">Agotado</span>
          </div>
        }
        @if (product.colorPickerEnabled && selectedColor()) {
          <div class="absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white/30"
               [style.background]="selectedColor()!.hex"></div>
        }
      </a>

      <!-- Body -->
      <div class="px-4 pb-4 flex flex-col flex-1">
        <a [routerLink]="['/product', product.id]" class="block hover:text-lv-gold transition-colors duration-200">
          <h3 class="font-display text-xl text-lv-cream leading-tight">{{ product.name }}</h3>
          <p class="font-body text-[11px] italic text-lv-cream/35 mt-0.5 mb-2 leading-snug">{{ product.tagline }}</p>
        </a>

        <!-- Variantes -->
        @if (product.variants && product.variants.length > 0) {
          <div class="flex gap-1 flex-wrap mb-2">
            @for (v of product.variants; track v.label) {
              <button
                class="rounded-full px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider border transition-all duration-150"
                [class]="selectedVariant()?.label === v.label
                  ? 'border-lv-gold bg-lv-gold/10 text-lv-gold'
                  : 'border-white/10 text-lv-cream/40 hover:border-lv-gold/30'"
                (click)="selectedVariant.set(v)">
                {{ v.label }}
              </button>
            }
          </div>
        }

        <p class="font-display text-2xl text-lv-gold leading-none mb-3">
          {{ currentPrice() }}€
          <span class="font-mono text-[10px] uppercase text-lv-cream/40 ml-1">/ unidad</span>
        </p>

        <!-- Color dots + add button -->
        <div class="flex justify-between items-center mt-auto">
          @if (product.colorPickerEnabled && colors.length > 0) {
            <div class="flex gap-1.5 flex-wrap items-center">
              @for (color of colors; track color.id) {
                <button
                  type="button"
                  class="rounded-full transition-all duration-150 cursor-pointer flex-shrink-0"
                  [title]="color.name"
                  [style.width]="selectedColor()?.id === color.id ? '14px' : '10px'"
                  [style.height]="selectedColor()?.id === color.id ? '14px' : '10px'"
                  [style.background]="color.hex"
                  [style.outline]="selectedColor()?.id === color.id ? '2px solid #C9A84C' : '1px solid rgba(255,255,255,0.15)'"
                  [style.outline-offset]="'2px'"
                  (click)="selectColor(color, $event)">
                </button>
              }
            </div>
          } @else {
            <span class="font-mono text-[9px] uppercase tracking-wider text-lv-cream/30">Color fijo</span>
          }

          <button
            type="button"
            class="w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-lg flex-shrink-0 ml-2 transition-all duration-200 disabled:opacity-30"
            [class]="justAdded()
              ? 'bg-green-600 text-white scale-90'
              : 'bg-lv-gold hover:scale-110 hover:brightness-110 text-black'"
            [disabled]="!product.available"
            (click)="onAdd($event)">
            @if (justAdded()) {
              <span class="text-xs font-bold">✓</span>
            } @else {
              +
            }
          </button>
        </div>

        @if (product.colorPickerEnabled && selectedColor()) {
          <p class="font-mono text-[9px] uppercase tracking-wider text-lv-gold/60 mt-2">
            Color: {{ selectedColor()!.name }}
          </p>
        }
      </div>
    </div>
  `,
})
export class LvProductCardComponent implements OnChanges {
  @Input({ required: true }) product!: Product;
  @Input() colors: Color[] = [];
  @Input() delay = '0ms';
  @Output() added = new EventEmitter<CartItem>();

  protected readonly cloudinary = inject(CloudinaryService);
  private destroyRef = inject(DestroyRef);
  private addTimer: ReturnType<typeof setTimeout> | null = null;

  readonly currentImageIndex = signal(0);
  readonly selectedVariant   = signal<ProductVariant | null>(null);
  readonly selectedColor     = signal<Color | null>(null);
  readonly justAdded         = signal(false);

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
    const id = this.product.images[this.currentImageIndex()];
    return id ? this.cloudinary.card(id) : PLACEHOLDER;
  }

  currentPrice() {
    return this.selectedVariant()?.price ?? this.product.price;
  }

  setImage(index: number) {
    this.currentImageIndex.set(index);
  }

  selectColor(color: Color, event: Event): void {
    event.stopPropagation();
    this.selectedColor.set(color);
  }

  onAdd(event: Event): void {
    event.stopPropagation();
    this.added.emit({
      productId:   this.product.id,
      productSku:  this.product.sku,
      productName: this.product.name,
      variant:     this.selectedVariant()?.label,
      color:       this.selectedColor()?.name,
      quantity:    1,
      unitPrice:   this.currentPrice()
    });
    this.justAdded.set(true);
    if (this.addTimer) clearTimeout(this.addTimer);
    this.addTimer = setTimeout(() => this.justAdded.set(false), 1500);
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = PLACEHOLDER;
  }
}
