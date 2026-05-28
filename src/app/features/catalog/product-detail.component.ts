import { Component, inject, signal, DestroyRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, switchMap, map, tap, catchError, of } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { Product, ProductVariant, Color } from '../../core/models/product.model';
import { PLACEHOLDER, TOAST_DURATION } from '../../shared/constants';

type DetailData = { product: Product | null; colors: Color[] };

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink],
  template: `
    @let data = productData();
    @if (data === undefined) {
      <div class="flex justify-center py-20">
        <div class="w-10 h-10 border-4 border-tcg-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    } @else if (data.product) {
      <div class="max-w-5xl mx-auto px-4 py-10">
        <a routerLink="/catalog"
           class="inline-flex items-center gap-1.5 text-tcg-muted hover:text-tcg-gold mb-8 transition-colors text-sm font-body">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver al catálogo
        </a>

        <div class="grid md:grid-cols-2 gap-10">
          <!-- imagen -->
          <div class="space-y-3">
            <div class="card overflow-hidden aspect-square bg-tcg-border">
              <img [src]="currentImage(data.product)" [alt]="data.product.name"
                   class="w-full h-full object-cover"
                   (error)="onImageError($event)"/>
            </div>
            @if (data.product.images.length > 1) {
              <div class="flex gap-3">
                @for (img of data.product.images; track $index) {
                  <button
                    class="w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors"
                    [class]="currentImageIndex() === $index ? 'border-tcg-gold' : 'border-tcg-border'"
                    (click)="currentImageIndex.set($index)">
                    <img [src]="img" [alt]="data.product.name" class="w-full h-full object-cover"
                         (error)="onImageError($event)"/>
                  </button>
                }
              </div>
            }
          </div>

          <!-- info -->
          <div class="space-y-6">
            @if (data.product.badge) {
              <span class="badge-{{ data.product.badgeStyle ?? 'gold' }}">{{ data.product.badge }}</span>
            }

            <h1 class="font-display text-5xl text-tcg-text tracking-wide leading-none">{{ data.product.name }}</h1>
            <p class="text-tcg-muted font-body leading-relaxed">{{ data.product.description }}</p>

            <ul class="space-y-2">
              @for (feature of data.product.features; track feature) {
                <li class="flex items-start gap-2 text-tcg-muted text-sm font-body">
                  <span class="text-tcg-gold mt-0.5 flex-shrink-0">✓</span>
                  {{ feature }}
                </li>
              }
            </ul>

            <!-- variantes -->
            @if (data.product.variants && data.product.variants.length > 0) {
              <div>
                <p class="text-xs font-body text-tcg-muted uppercase tracking-widest mb-2">Variante</p>
                <div class="flex flex-wrap gap-2">
                  @for (variant of data.product.variants; track variant.label) {
                    <button
                      class="px-4 py-2 rounded-lg border text-sm font-body transition-colors"
                      [class]="selectedVariant()?.label === variant.label
                        ? 'border-tcg-gold bg-tcg-gold/10 text-tcg-gold'
                        : 'border-tcg-border text-tcg-muted hover:border-tcg-gold/50'"
                      (click)="selectVariant(variant)">
                      {{ variant.label }} — {{ variant.price }}€
                    </button>
                  }
                </div>
              </div>
            }

            <!-- color swatches -->
            @if (data.product.colorPickerEnabled && data.colors.length > 0) {
              <div>
                <p class="text-xs font-body text-tcg-muted uppercase tracking-widest mb-2">Color</p>
                <div class="flex flex-wrap gap-2 mb-1.5">
                  @for (color of data.colors; track color.id) {
                    <button
                      class="w-7 h-7 rounded-full border-2 transition-all duration-150"
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
                  <p class="text-sm text-tcg-muted font-body">{{ c.name }}</p>
                } @else {
                  <p class="text-xs text-tcg-muted/50 font-body italic">Elige un color</p>
                }
              </div>
            }

            <!-- precio + botón -->
            <div class="flex items-center justify-between pt-4 border-t border-tcg-border">
              <span class="font-display text-5xl text-tcg-gold leading-none">{{ currentPrice(data.product) }}€</span>
              <button class="btn-gold" [disabled]="!data.product.available" (click)="addToCart(data.product)">
                @if (data.product.available) { Añadir a la cesta } @else { Agotado }
              </button>
            </div>

            @if (addedToast()) {
              <div class="bg-tcg-gold/10 border border-tcg-gold text-tcg-gold px-4 py-3 rounded-card flex items-center gap-2 font-body text-sm">
                ✓ Añadido a la cesta
              </div>
            }
          </div>
        </div>
      </div>
    } @else {
      <div class="flex flex-col items-center justify-center py-20 gap-3">
        <p class="text-tcg-muted font-body">Producto no encontrado.</p>
        <a routerLink="/catalog" class="btn-outline text-sm">Volver al catálogo</a>
      </div>
    }
  `
})
export class ProductDetailComponent {
  private route = inject(ActivatedRoute);
  private catalogService = inject(CatalogService);
  private cartService = inject(CartService);
  private destroyRef = inject(DestroyRef);

  readonly currentImageIndex = signal(0);
  readonly selectedVariant = signal<ProductVariant | null>(null);
  readonly selectedColor = signal<Color | null>(null);
  readonly addedToast = signal(false);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.toastTimer) clearTimeout(this.toastTimer);
    });
  }

  readonly productData = toSignal<DetailData>(
    this.route.params.pipe(
      tap(() => {
        this.currentImageIndex.set(0);
        this.selectedVariant.set(null);
        this.selectedColor.set(null);
      }),
      switchMap(params => combineLatest([
        this.catalogService.getProductById(params['id']),
        this.catalogService.getColors()
      ]).pipe(
        map(([product, colors]): DetailData => ({ product: product ?? null, colors })),
        catchError(() => of<DetailData>({ product: null, colors: [] }))
      ))
    )
  );

  currentImage(product: Product): string {
    return product.images[this.currentImageIndex()] || PLACEHOLDER;
  }

  currentPrice(product: Product): number {
    return this.selectedVariant()?.price ?? product.price;
  }

  selectVariant(variant: ProductVariant): void {
    this.selectedVariant.set(variant);
  }

  selectColor(color: Color): void {
    this.selectedColor.set(this.selectedColor()?.id === color.id ? null : color);
  }

  addToCart(product: Product): void {
    this.cartService.addItem({
      productId: product.id,
      productName: product.name,
      variant: this.selectedVariant()?.label,
      color: this.selectedColor()?.name,
      quantity: 1,
      unitPrice: this.currentPrice(product)
    });
    this.selectedColor.set(null);
    this.addedToast.set(true);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.addedToast.set(false), TOAST_DURATION);
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = PLACEHOLDER;
  }
}
