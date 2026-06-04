import { Component, inject, signal, DestroyRef, HostListener } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal, toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, switchMap, map, tap, catchError, of } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { Product, ProductVariant, Color } from '../../core/models/product.model';
import { ColorPickerComponent } from '../../shared/components/color-picker.component';
import { PLACEHOLDER } from '../../shared/constants';
import { CloudinaryService } from '../../core/services/cloudinary.service';

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
        <div class="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-[250px] h-[250px] sm:w-[500px] sm:h-[500px] bg-[#C9A84C]/[0.05] rounded-full blur-[80px] sm:blur-[120px] animate-aurora pointer-events-none" style="z-index:0"></div>

        <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">

          <a routerLink="/catalog"
             class="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-lv-cream/40 hover:text-lv-gold transition-colors duration-200 mb-6 sm:mb-10 lg:mb-12">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Volver al catálogo
          </a>

          <div class="grid md:grid-cols-2 gap-6 md:gap-10 lg:gap-12">

            <!-- Media: vídeo o imágenes -->
            <div class="space-y-3">
              <div class="liquid-glass rounded-[20px] overflow-hidden aspect-square"
                   [class.cursor-zoom-in]="!data.product.video"
                   (click)="!data.product.video && openLightbox(data.product)">
                @if (data.product.video) {
                  <video
                    class="w-full h-full object-cover"
                    [src]="data.product.video"
                    autoplay muted loop playsinline
                    preload="metadata">
                  </video>
                } @else {
                  <img [src]="currentImage(data.product)" [alt]="data.product.name"
                       class="w-full h-full object-contain"
                       draggable="false"
                       (contextmenu)="$event.preventDefault()"
                       (error)="onImageError(data.product)"/>
                }
              </div>
              @if (!data.product.video && validImages(data.product).length > 1) {
                <div class="flex gap-3">
                  @for (img of validImages(data.product); track img) {
                    <button
                      class="w-14 h-14 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-colors duration-200"
                      [class]="currentImageIndex() === $index ? 'border-lv-gold' : 'border-white/10 hover:border-lv-gold/40'"
                      (click)="currentImageIndex.set($index)">
                      <img [src]="cloudinary.thumb(img)" [alt]="data.product.name" class="w-full h-full object-cover"
                           draggable="false"
                           (contextmenu)="$event.preventDefault()"
                           (error)="onThumbError(img)"/>
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
                <h1 class="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-lv-cream leading-none uppercase">{{ data.product.name }}</h1>
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
              <div class="flex items-center justify-between pt-4 sm:pt-5 border-t border-white/[0.06] mt-auto gap-3">
                <span class="font-display text-4xl sm:text-5xl text-lv-gold leading-none">{{ currentPrice(data.product) }}€</span>
                <button
                  class="rounded-full px-4 sm:px-7 py-3 sm:py-3.5 font-mono text-xs uppercase tracking-wider font-semibold transition-all duration-200 disabled:opacity-40 flex-shrink-0"
                  [class]="!data.product.available
                    ? 'bg-white/5 text-lv-cream/30 cursor-not-allowed'
                    : justAdded()
                      ? 'bg-green-600 text-white scale-95'
                      : 'bg-lv-gold hover:brightness-110 text-black'"
                  [disabled]="!data.product.available"
                  (click)="addToCart(data.product)">
                  @if (!data.product.available) { Agotado }
                  @else if (justAdded()) { ✓ Añadido }
                  @else { Añadir a la cesta }
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
      @if (lightboxOpen()) {
        <div class="fixed inset-0 flex items-center justify-center"
             style="z-index:200; background:rgba(0,0,0,0.96);"
             (click)="closeLightbox()">
          <button class="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  (click)="closeLightbox()">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <img [src]="lightboxImg()"
               class="max-w-[95vw] max-h-[95vh] object-contain select-none transition-transform duration-300"
               [style.transform]="lightboxZoomed() ? 'scale(2.2)' : 'scale(1)'"
               [style.cursor]="lightboxZoomed() ? 'zoom-out' : 'zoom-in'"
               draggable="false"
               (contextmenu)="$event.preventDefault()"
               (click)="toggleZoom($event)" />
        </div>
      }

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
  private destroyRef     = inject(DestroyRef);
  protected readonly cloudinary = inject(CloudinaryService);

  readonly currentImageIndex = signal(0);
  readonly failedIds         = signal<Set<string>>(new Set());
  readonly selectedVariant   = signal<ProductVariant | null>(null);
  readonly selectedColor     = signal<Color | null>(null);
  readonly justAdded         = signal(false);
  readonly lightboxOpen      = signal(false);
  readonly lightboxZoomed    = signal(false);
  readonly lightboxImg       = signal('');

  private addTimer: ReturnType<typeof setTimeout> | null = null;

  readonly productData = toSignal<DetailData>(
    this.route.params.pipe(
      tap(() => {
        this.currentImageIndex.set(0);
        this.failedIds.set(new Set());
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
    this.destroyRef.onDestroy(() => {
      if (this.addTimer) clearTimeout(this.addTimer);
    });
  }

  validImages(product: Product): string[] {
    const failed = this.failedIds();
    return product.images.filter(id => !failed.has(id));
  }

  currentImage(product: Product): string {
    const valid = this.validImages(product);
    const id = valid[this.currentImageIndex()];
    return id ? this.cloudinary.detail(id) : PLACEHOLDER;
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
    this.justAdded.set(true);
    if (this.addTimer) clearTimeout(this.addTimer);
    this.addTimer = setTimeout(() => this.justAdded.set(false), 1500);
  }

  onImageError(product: Product): void {
    const valid = this.validImages(product);
    const failedId = valid[this.currentImageIndex()];
    if (!failedId) return;
    this.failedIds.update(s => new Set([...s, failedId]));
    const remaining = this.validImages(product);
    this.currentImageIndex.set(Math.max(0, Math.min(this.currentImageIndex(), remaining.length - 1)));
  }

  onThumbError(publicId: string): void {
    this.failedIds.update(s => new Set([...s, publicId]));
  }

  openLightbox(product: Product): void {
    const id = this.validImages(product)[this.currentImageIndex()];
    if (!id) return;
    this.lightboxImg.set(this.cloudinary.full(id));
    this.lightboxZoomed.set(false);
    this.lightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
    this.lightboxZoomed.set(false);
  }

  toggleZoom(event: Event): void {
    event.stopPropagation();
    this.lightboxZoomed.update(z => !z);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.lightboxOpen()) this.closeLightbox();
  }
}
