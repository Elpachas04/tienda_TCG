import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal, toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, switchMap, map, tap, catchError, of } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { Product, ProductVariant, Color } from '../../core/models/product.model';
import { ColorPickerComponent } from '../../shared/components/color-picker.component';
import { PLACEHOLDER } from '../../shared/constants';

type DetailData = { product: Product | null; colors: Color[] };

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, ColorPickerComponent],
  host: { class: 'block animate-fade-up' },
  template: `
    @let data = productData();
    @if (data === undefined) {
      <div class="flex justify-center items-center min-h-screen">
        <div class="w-10 h-10 border-2 border-lv-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    } @else if (data.product) {
      <div class="bg-grid-premium min-h-screen relative overflow-x-hidden">
        <div class="absolute -top-40 -right-40 w-[500px] h-[500px] bg-[#C9A84C]/[0.05] rounded-full blur-[120px] animate-aurora pointer-events-none"></div>

        <div class="max-w-5xl mx-auto px-6 py-16">

          <a routerLink="/catalog"
             class="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-lv-cream/40 hover:text-lv-gold transition-colors duration-200 mb-12">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Volver al catálogo
          </a>

          <div class="grid md:grid-cols-2 gap-12">

            <!-- Media: vídeo o imágenes -->
            <div class="space-y-3">
              <div class="liquid-glass rounded-[20px] overflow-hidden aspect-square">
                @if (data.product.video) {
                  <video
                    class="w-full h-full object-cover"
                    [src]="data.product.video"
                    autoplay muted loop playsinline
                    preload="metadata">
                  </video>
                } @else {
                  <img [src]="currentImage(data.product)" [alt]="data.product.name"
                       class="w-full h-full object-cover"
                       (error)="onImageError($event)"/>
                }
              </div>
              @if (!data.product.video && data.product.images.length > 1) {
                <div class="flex gap-3">
                  @for (img of data.product.images; track $index) {
                    <button
                      class="w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors duration-200"
                      [class]="currentImageIndex() === $index ? 'border-lv-gold' : 'border-white/10 hover:border-lv-gold/40'"
                      (click)="currentImageIndex.set($index)">
                      <img [src]="img" [alt]="data.product.name" class="w-full h-full object-cover"
                           (error)="onImageError($event)"/>
                    </button>
                  }
                </div>
              }
            </div>

            <!-- Info -->
            <div class="space-y-6 flex flex-col">
              @if (data.product.badge) {
                <span class="liquid-glass inline-block w-fit rounded-full px-3 py-1 font-mono text-xs uppercase tracking-wider text-lv-gold border border-lv-gold/30">
                  {{ data.product.badge }}
                </span>
              }

              <div>
                <p class="font-mono text-xs uppercase tracking-[0.3em] text-lv-gold/60 mb-2">{{ data.product.category }}</p>
                <h1 class="font-display text-5xl md:text-6xl text-lv-cream leading-none uppercase">{{ data.product.name }}</h1>
              </div>

              <p class="text-lv-cream/50 font-body leading-relaxed text-sm">{{ data.product.description }}</p>

              <ul class="space-y-2">
                @for (feature of data.product.features; track feature) {
                  <li class="flex items-start gap-2 text-lv-cream/40 text-sm font-body">
                    <span class="text-lv-gold mt-0.5 flex-shrink-0">✓</span>
                    {{ feature }}
                  </li>
                }
              </ul>

              <!-- Variantes -->
              @if (data.product.variants && data.product.variants.length > 0) {
                <div>
                  <p class="font-mono text-xs uppercase tracking-widest text-lv-cream/40 mb-3">Variante</p>
                  <div class="flex flex-wrap gap-2">
                    @for (variant of data.product.variants; track variant.label) {
                      <button
                        class="rounded-full px-4 py-2 font-mono text-xs uppercase tracking-wider border transition-all duration-200"
                        [class]="selectedVariant()?.label === variant.label
                          ? 'border-lv-gold bg-lv-gold/10 text-lv-gold'
                          : 'border-white/10 text-lv-cream/50 hover:border-lv-gold/40'"
                        (click)="selectVariant(variant)">
                        {{ variant.label }} — {{ variant.price }}€
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- Color -->
              @if (data.product.colorPickerEnabled && data.colors.length > 0) {
                <div>
                  <p class="font-mono text-xs uppercase tracking-widest text-lv-cream/40 mb-3">Color</p>
                  <app-color-picker
                    [colors]="data.colors"
                    [selected]="selectedColor()"
                    (selectedChange)="selectedColor.set($event)">
                  </app-color-picker>
                </div>
              }

              <!-- Precio + botón -->
              <div class="flex items-center justify-between pt-5 border-t border-white/[0.06] mt-auto">
                <span class="font-display text-5xl text-lv-gold leading-none">{{ currentPrice(data.product) }}€</span>
                <button
                  class="rounded-full px-7 py-3.5 font-mono text-xs uppercase tracking-wider font-semibold transition-all duration-200 disabled:opacity-40"
                  [class]="data.product.available
                    ? 'bg-lv-gold hover:brightness-110 text-black'
                    : 'bg-white/5 text-lv-cream/30 cursor-not-allowed'"
                  [disabled]="!data.product.available"
                  (click)="addToCart(data.product)">
                  @if (data.product.available) { Añadir a la cesta } @else { Agotado }
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="flex flex-col items-center justify-center min-h-screen gap-4 text-center">
        <p class="font-display text-4xl text-lv-cream/30 uppercase tracking-wide">Producto no encontrado</p>
        <a routerLink="/catalog"
           class="liquid-glass border border-lv-gold/20 text-lv-cream rounded-full px-6 py-3 font-mono text-xs uppercase tracking-wider hover:border-lv-gold transition-all duration-200">
          Volver al catálogo
        </a>
      </div>
    }
  `
})
export class ProductDetailComponent {
  private route          = inject(ActivatedRoute);
  private catalogService = inject(CatalogService);
  private cartService    = inject(CartService);

  readonly currentImageIndex = signal(0);
  readonly selectedVariant   = signal<ProductVariant | null>(null);
  readonly selectedColor     = signal<Color | null>(null);

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

  constructor() {
    toObservable(this.productData)
      .pipe(takeUntilDestroyed())
      .subscribe(data => {
        if (data?.colors.length) {
          this.selectedColor.set(data.colors.find(c => c.id === 'negro') ?? data.colors[0]);
        }
      });
  }

  currentImage(product: Product): string {
    return product.images[this.currentImageIndex()] || PLACEHOLDER;
  }

  currentPrice(product: Product): number {
    return this.selectedVariant()?.price ?? product.price;
  }

  selectVariant(variant: ProductVariant): void {
    this.selectedVariant.set(variant);
  }

  addToCart(product: Product): void {
    this.cartService.addItem({
      productId:   product.id,
      productSku:  product.sku,
      productName: product.name,
      variant:     this.selectedVariant()?.label,
      color:       this.selectedColor()?.name,
      quantity:    1,
      unitPrice:   this.currentPrice(product)
    });
    const colors = this.productData()?.colors ?? [];
    this.selectedColor.set(colors.find(c => c.id === 'negro') ?? colors[0] ?? null);
    this.cartService.openDrawer();
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = PLACEHOLDER;
  }
}
