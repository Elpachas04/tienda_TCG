import { ChangeDetectionStrategy, Component, inject, signal, DestroyRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal, toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, tap } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { Product, ProductVariant, ProductAddon, Color } from '../../core/models/product.model';
import { PLACEHOLDER } from '../../shared/constants';
import { CloudinaryService } from '../../core/services/cloudinary.service';

type DetailData = { product: Product | null; colors: Color[] };

@Component({
  selector: 'app-product-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  host: { class: 'block animate-fade-up' },
  template: `
    @let data = productData();
    @if (data === undefined) {
      <div class="flex justify-center items-center min-h-screen">
        <div class="w-10 h-10 border-2 border-lv-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    } @else if (data.product) {
      <div class="bg-lv-black bg-grid-premium min-h-screen relative overflow-x-hidden">
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

            <!-- Media: vídeo + imágenes -->
            <div class="space-y-3">
              <div class="liquid-glass rounded-[20px] overflow-hidden aspect-square relative bg-lv-surface">
                @if (!showVideo() && !mainImageLoaded()) {
                  <div class="absolute inset-0 animate-pulse bg-white/[0.04] rounded-[20px]"></div>
                }
                @if (data.product.video && showVideo()) {
                  <video class="w-full h-full object-cover"
                         autoplay muted loop playsinline preload="metadata"
                         disablepictureinpicture disableremoteplayback>
                    <source [src]="cloudinary.video(data.product.video!)">
                  </video>
                } @else {
                  <img [src]="currentImage(data.product)" [alt]="data.product.name"
                       class="w-full h-full object-contain transition-transform duration-700 ease-out hover:scale-110"
                       loading="eager" fetchpriority="high" decoding="async"
                       draggable="false"
                       (load)="mainImageLoaded.set(true)"
                       (contextmenu)="$event.preventDefault()"
                       (error)="onImageError(data.product)"/>
                }
              </div>

              @if (data.product.video || readyThumbs().length > 1) {
                <div class="flex gap-3 flex-wrap">
                  @if (data.product.video) {
                    <button
                      class="w-14 h-14 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-colors duration-200 bg-black flex items-center justify-center flex-shrink-0"
                      [class]="showVideo() ? 'border-lv-gold' : 'border-white/10 hover:border-lv-gold/40'"
                      (click)="showVideo.set(true); showColorImage.set(false)">
                      <svg class="w-6 h-6 text-lv-gold/80" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  }
                  @for (img of readyThumbs(); track img) {
                    <button
                      class="w-14 h-14 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-colors duration-200 flex-shrink-0"
                      [class]="!showVideo() && currentImageIndex() === thumbIndex(img, data.product) ? 'border-lv-gold' : 'border-white/10 hover:border-lv-gold/40'"
                      (click)="showVideo.set(false); showColorImage.set(false); currentImageIndex.set(thumbIndex(img, data.product)); mainImageLoaded.set(false)">
                      <img [src]="cloudinary.thumb(img)" [alt]="data.product.name" class="w-full h-full object-cover"
                           loading="lazy" decoding="async"
                           draggable="false"
                           (contextmenu)="$event.preventDefault()"/>
                    </button>
                  }
                </div>
              }
            </div>

            <!-- Info -->
            <div class="flex flex-col gap-0">

              <!-- Tagline -->
              <div class="border-l-2 border-lv-gold pl-4 mb-6">
                <p class="font-body italic text-lv-cream/80 text-base sm:text-lg leading-snug">
                  {{ variantTagline(data.product) }}
                </p>
              </div>

              <!-- Badge + nombre -->
              <div class="mb-5">
                <div class="flex items-center gap-3 mb-2">
                  <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-lv-gold/50">{{ data.product.category }}</p>
                  @if (data.product.badge && !selectedVariant()?.copy) {
                    <span class="rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-lv-gold border border-lv-gold/30">
                      {{ data.product.badge }}
                    </span>
                  }
                </div>
                <h1 class="font-display text-4xl sm:text-5xl md:text-6xl text-lv-cream leading-none uppercase">{{ data.product.name }}</h1>
              </div>

              <!-- Selector de tamaño tipo card -->
              @if (data.product.variants && data.product.variants.length > 0) {
                <div class="mb-5">
                  <p class="font-mono text-[10px] uppercase tracking-widest text-lv-cream/30 mb-3">Tamaño</p>
                  <div class="grid grid-cols-3 gap-2">
                    @for (variant of data.product.variants; track variant.label) {
                      <button
                        class="flex flex-col items-center text-center px-2 py-3 rounded-card border transition-all duration-200"
                        [class]="selectedVariant()?.label === variant.label
                          ? 'border-lv-gold bg-lv-gold/8 text-lv-gold'
                          : 'border-white/10 text-lv-cream/50 hover:border-lv-gold/40 hover:text-lv-cream/80'"
                        (click)="selectVariant(variant)">
                        <span class="font-display text-2xl leading-none mb-1"
                              [class]="selectedVariant()?.label === variant.label ? 'text-lv-gold' : 'text-lv-cream'">
                          {{ variant.label }}
                        </span>
                        @if (variant.specs?.capacity) {
                          <span class="font-mono text-[9px] text-lv-muted leading-none mb-1">{{ variant.specs!.capacity }} cartas</span>
                        }
                        <span class="font-mono text-xs font-semibold"
                              [class]="selectedVariant()?.label === variant.label ? 'text-lv-gold' : 'text-lv-muted'">
                          {{ variant.price }}€
                        </span>
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- Specs de variante — fila compacta -->
              @if (selectedVariant()?.specs; as specs) {
                <div class="flex items-center justify-around bg-lv-surface border border-lv-border rounded-card px-4 py-3 mb-5">
                  @for (stat of [
                    { label: 'Capacidad', value: specs.capacity,  unit: 'cartas' },
                    { label: 'Largo',     value: specs.length_cm, unit: 'cm' },
                    { label: 'Ancho',     value: specs.width_cm,  unit: 'cm' }
                  ]; track stat.label) {
                    <div class="text-center">
                      <p class="font-display text-2xl text-lv-cream leading-none">{{ stat.value }}</p>
                      <p class="font-mono text-[9px] text-lv-muted mt-0.5">{{ stat.unit }}</p>
                      <p class="font-mono text-[8px] uppercase tracking-widest text-lv-gold/50 mt-0.5">{{ stat.label }}</p>
                    </div>
                  }
                </div>
              }

              <!-- Descripción -->
              <p class="text-lv-cream/55 font-body leading-relaxed text-sm mb-5">
                {{ variantDescription(data.product) }}
              </p>

              <!-- Ideal para (chips) o Features (checkmarks) -->
              @if (variantUses(data.product); as uses) {
                <div class="mb-5">
                  <p class="font-mono text-[10px] uppercase tracking-widest text-lv-cream/30 mb-2.5">Ideal para</p>
                  <div class="flex flex-wrap gap-2">
                    @for (use of uses; track use) {
                      <span class="rounded-full px-3 py-1.5 font-mono text-[11px] border border-lv-gold/20 text-lv-gold/70 bg-lv-gold/5">
                        {{ use }}
                      </span>
                    }
                  </div>
                </div>
              } @else {
                <ul class="space-y-2 mb-5">
                  @for (feature of data.product.features; track feature) {
                    <li class="flex items-start gap-2 text-lv-cream/40 text-sm font-body">
                      <span class="text-lv-gold mt-0.5 flex-shrink-0">✓</span>
                      {{ feature }}
                    </li>
                  }
                </ul>
              }

              <!-- Color — swatches directos One Piece -->
              @if (data.product.colorPickerEnabled && data.colors.length > 0) {
                <div class="border-t border-white/[0.06] pt-5 mb-5">
                  <p class="font-mono text-[10px] uppercase tracking-widest text-lv-cream/30 mb-3">Color</p>
                  <div class="flex flex-wrap gap-2.5">
                    @for (color of data.colors; track color.id) {
                      <button
                        type="button"
                        [title]="color.name"
                        class="w-8 h-8 rounded-full border-2 transition-all duration-150 flex-shrink-0"
                        [style.background-color]="color.hex"
                        [class]="selectedColor()?.id === color.id
                          ? 'border-lv-gold scale-110 ring-2 ring-lv-gold/30 ring-offset-2 ring-offset-lv-black'
                          : 'border-white/20 hover:border-white/50 hover:scale-105'"
                        (click)="selectColor(color)">
                      </button>
                    }
                  </div>
                  @if (selectedColor()) {
                    <p class="font-mono text-xs text-lv-muted mt-2.5">{{ selectedColor()!.name }}</p>
                  }
                </div>
              }

              <!-- Addons -->
              @if (productAddons(data.product).length > 0) {
                <div class="border-t border-white/[0.06] pt-5 mb-5">
                  @for (addon of productAddons(data.product); track addon.id) {
                    <label class="flex items-center gap-3 cursor-pointer group">
                      <button
                        type="button"
                        class="w-5 h-5 rounded flex-shrink-0 border transition-all duration-150 flex items-center justify-center"
                        [class]="selectedAddonIds().has(addon.id)
                          ? 'border-lv-gold bg-lv-gold/15'
                          : 'border-white/20 hover:border-lv-gold/50'"
                        (click)="toggleAddon(addon.id)">
                        @if (selectedAddonIds().has(addon.id)) {
                          <svg class="w-3 h-3 text-lv-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                          </svg>
                        }
                      </button>
                      <span class="font-body text-sm text-lv-cream/60 group-hover:text-lv-cream/90 transition-colors flex-1"
                            (click)="toggleAddon(addon.id)">
                        {{ addon.name }}
                      </span>
                      <span class="font-mono text-sm text-lv-gold">+{{ addon.price }}€</span>
                    </label>
                  }
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

  readonly currentImageIndex  = signal(0);
  readonly failedIds          = signal<Set<string>>(new Set());
  readonly selectedVariant    = signal<ProductVariant | null>(null);
  readonly selectedColor      = signal<Color | null>(null);
  readonly selectedAddonIds   = signal<Set<string>>(new Set());
  readonly justAdded          = signal(false);
  readonly showVideo          = signal(true);
  readonly showColorImage     = signal(false);
  readonly mainImageLoaded    = signal(false);
  readonly readyThumbs        = signal<string[]>([]);

  private addTimer: ReturnType<typeof setTimeout> | null = null;
  private thumbProbes: HTMLImageElement[] = [];
  private colorProbes: HTMLImageElement[] = [];

  readonly productData = toSignal<DetailData>(
    this.route.params.pipe(
      tap(() => {
        this.currentImageIndex.set(0);
        this.failedIds.set(new Set());
        this.selectedVariant.set(null);
        this.selectedColor.set(null);
        this.selectedAddonIds.set(new Set());
        this.showVideo.set(true);
        this.showColorImage.set(false);
        this.mainImageLoaded.set(false);
        this.readyThumbs.set([]);
        this.abortThumbProbes();
      }),
      map(params => ({
        product: this.catalogService.getProductById(params['id']) ?? null,
        colors:  this.catalogService.colors as Color[],
      }))
    )
  );

  constructor() {
    toObservable(this.productData)
      .pipe(takeUntilDestroyed())
      .subscribe(data => {
        if (data?.colors.length) {
          this.selectedColor.set(data.colors.find(c => c.id === 'negro') ?? data.colors[0]);
          if (data.product?.colorImageKey) {
            this.showColorImage.set(true);
            this.showVideo.set(false);
          }
        }
        if (data?.product) {
          this.preloadThumbs(data.product.images);
          if (data.product.colorImageKey) {
            this.preloadColorImages(data.product.colorImageKey, data.colors);
          }
          const variants = data.product.variants;
          if (variants?.length) {
            this.selectedVariant.set(variants.find(v => v.default) ?? variants[0]);
          }
        }
      });
    this.destroyRef.onDestroy(() => {
      if (this.addTimer) clearTimeout(this.addTimer);
      this.abortThumbProbes();
      this.colorProbes.forEach(p => { p.src = ''; });
    });
  }

  private preloadThumbs(images: string[]): void {
    this.abortThumbProbes();
    this.thumbProbes = images.map(id => {
      const probe = new Image();
      probe.onload = () => this.readyThumbs.update(arr => [...arr, id]);
      probe.src = this.cloudinary.thumb(id);
      return probe;
    });
  }

  private abortThumbProbes(): void {
    this.thumbProbes.forEach(p => { p.onload = null; p.src = ''; });
    this.thumbProbes = [];
  }

  private preloadColorImages(key: string, colors: Color[]): void {
    this.colorProbes.forEach(p => { p.src = ''; });
    this.colorProbes = colors.map(color => {
      const img = new Image();
      img.src = this.cloudinary.colorImage(key, color.id);
      return img;
    });
  }

  thumbIndex(img: string, product: Product): number {
    return this.validImages(product).indexOf(img);
  }

  validImages(product: Product): string[] {
    const failed = this.failedIds();
    return product.images.filter(id => !failed.has(id));
  }

  currentImage(product: Product): string {
    const color = this.selectedColor();
    if (this.showColorImage() && product.colorImageKey && color) {
      return this.cloudinary.colorImage(product.colorImageKey, color.id);
    }
    const valid = this.validImages(product);
    const id = valid[this.currentImageIndex()];
    return id ? this.cloudinary.detail(id) : PLACEHOLDER;
  }

  selectColor(color: Color): void {
    this.selectedColor.set(color);
    this.showColorImage.set(true);
    this.showVideo.set(false);
    this.mainImageLoaded.set(false);
  }

  protected productAddons(product: Product): ProductAddon[] {
    if (!product.available_addons?.length) return [];
    return this.catalogService.addons.filter(a => product.available_addons!.includes(a.id)) as ProductAddon[];
  }

  protected toggleAddon(id: string): void {
    this.selectedAddonIds.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  protected variantTagline(product: Product): string {
    return this.selectedVariant()?.copy?.tagline ?? product.tagline;
  }

  protected variantDescription(product: Product): string {
    return this.selectedVariant()?.copy?.description ?? product.description;
  }

  protected variantUses(product: Product): string[] | null {
    return this.selectedVariant()?.copy?.uses ?? null;
  }

  currentPrice(product: Product): number {
    const base = this.selectedVariant()?.price ?? product.price;
    const addonTotal = this.productAddons(product)
      .filter(a => this.selectedAddonIds().has(a.id))
      .reduce((sum, a) => sum + a.price, 0);
    return base + addonTotal;
  }

  selectVariant(variant: ProductVariant): void {
    this.selectedVariant.set(variant);
  }

  addToCart(product: Product): void {
    const colors = this.productData()?.colors ?? [];
    let color = this.selectedColor();
    if (product.colorPickerEnabled && !color && colors.length > 0) {
      color = colors.find(c => c.id === 'negro') ?? colors[0];
      this.selectedColor.set(color);
    }
    const addons = this.productAddons(product).filter(a => this.selectedAddonIds().has(a.id));
    const addonLabel = addons.map(a => a.name).join(', ');
    this.cartService.addItem({
      productId:   product.id,
      productSku:  product.sku,
      productName: product.name,
      variant:     [this.selectedVariant()?.label, addonLabel].filter(Boolean).join(' + '),
      color:       color?.name,
      quantity:    1,
      unitPrice:   this.currentPrice(product)
    });
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
}
