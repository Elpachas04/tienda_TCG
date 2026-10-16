import { ChangeDetectionStrategy, Component, inject, signal, DestroyRef } from '@angular/core';
import { EurPipe } from '../../shared/pipes/eur.pipe';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal, toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, tap } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { Product, ProductVariant, ProductAddon, Color, Leader } from '../../core/models/product.model';
import { PLACEHOLDER } from '../../shared/constants';
import { CloudinaryService } from '../../core/services/cloudinary.service';
import { LeaderPickerComponent } from '../../shared/components/leader-picker.component';
import { CustomLeaderRequestComponent } from '../../shared/components/custom-leader-request.component';
import { FoilHoverDirective } from '../../shared/directives/foil-hover.directive';
import { SeoService } from '../../core/services/seo.service';
import { AssistantService } from '../../core/assistant/assistant.service';

type DetailData = { product: Product | null; colors: Color[] };

@Component({
  selector: 'app-product-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LeaderPickerComponent, CustomLeaderRequestComponent, FoilHoverDirective, EurPipe],
  host: { class: 'block' },
  template: `
    @let data = productData();
    @if (data === undefined) {
      <div class="flex justify-center items-center min-h-screen">
        <div class="w-10 h-10 border-2 border-lv-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    } @else if (data.product) {
      <div class="bg-lv-black min-h-screen relative overflow-x-hidden">

        <div class="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-20 sm:pt-10 lg:pt-12">

          <a routerLink="/catalog"
             class="inline-flex items-center gap-2 py-2.5 -my-2.5 text-sm text-lv-cream/60 hover:text-lv-cream transition-colors duration-200 mb-6 sm:mb-8">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Volver al catálogo
          </a>

          <div class="grid md:grid-cols-[1.1fr_1fr] gap-8 md:gap-12 lg:gap-20 items-start">

            <!-- Media: vídeo + imágenes -->
            <div class="space-y-3">
              <div lvFoil class="foil-frame rounded-card overflow-hidden aspect-square relative bg-[#111]"
                   [style.view-transition-name]="'product-' + data.product.id">
                @if (!showVideo() && !mainImageLoaded()) {
                  <div class="absolute inset-0 animate-pulse bg-white/[0.04]"></div>
                }
                @if (data.product.video && showVideo()) {
                  <video class="w-full h-full object-cover"
                         autoplay muted loop playsinline preload="metadata"
                         disablepictureinpicture disableremoteplayback>
                    <source [src]="cloudinary.video(data.product.video!)">
                  </video>
                } @else {
                  <img [src]="currentImage(data.product)" [alt]="data.product.name"
                       class="w-full h-full object-contain"
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
                    <button type="button" aria-label="Ver vídeo" [attr.aria-pressed]="showVideo()"
                      class="w-14 h-14 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-colors duration-200 bg-black flex items-center justify-center flex-shrink-0"
                      [class]="showVideo() ? 'border-lv-gold' : 'border-white/10 hover:border-lv-gold/40'"
                      (click)="showVideo.set(true); showColorImage.set(false)">
                      <svg class="w-6 h-6 text-lv-gold" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  }
                  @for (img of readyThumbs(); track img; let t = $index) {
                    <button type="button" [attr.aria-label]="'Ver foto ' + (t + 1)"
                      [attr.aria-pressed]="!showVideo() && currentImageIndex() === thumbIndex(img, data.product)"
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

              <div class="mb-8">
                @if (data.product.badge && !selectedVariant()?.copy) {
                  <span class="inline-block mb-4 rounded-full px-2.5 py-1 text-xs font-semibold text-lv-foil border border-lv-gold/30">
                    {{ data.product.badge }}
                  </span>
                }
                <h1 class="lv-h1 text-lv-cream">{{ data.product.name }}</h1>
                <p class="lv-lede mt-4">{{ variantTagline(data.product) }}</p>
              </div>

              <!-- Color: muestras directas -->
              @if (data.product.colorPickerEnabled && data.colors.length > 0) {
                <div class="mb-5">
                  <p class="text-sm font-semibold text-lv-cream mb-3">Color</p>
                  <div class="flex flex-wrap gap-2.5">
                    @for (color of data.colors; track color.id) {
                      <button
                        type="button"
                        [title]="color.name"
                        [attr.aria-label]="color.name"
                        [attr.aria-pressed]="selectedColor()?.id === color.id"
                        class="w-9 h-9 rounded-full border-2 transition-all duration-150 flex-shrink-0"
                        [style.background-color]="color.hex"
                        [class]="selectedColor()?.id === color.id
                          ? 'border-lv-gold scale-110 ring-2 ring-lv-gold/30 ring-offset-2 ring-offset-lv-black'
                          : 'border-white/20 hover:border-white/50 hover:scale-105'"
                        (click)="selectColor(color)">
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- Leader picker -->
              @if (data.product.leaderPickerEnabled && data.product.leaders?.length) {
                <div class="mb-5">
                  <p class="text-sm font-semibold text-lv-cream mb-3">Líder</p>
                  <app-leader-picker
                    [leaders]="data.product.leaders!"
                    [selected]="selectedLeader()"
                    layout="block"
                    (leaderChange)="onLeaderChange($event)">
                  </app-leader-picker>
                  @if (data.product.customLeaderRequest) {
                    <app-custom-leader-request></app-custom-leader-request>
                  }
                </div>
              }

              <!-- Selector de tamaño tipo card -->
              @if (data.product.variants && data.product.variants.length > 0) {
                <div class="mb-5">
                  <p class="text-sm font-semibold text-lv-cream mb-3">Tamaño</p>
                  <div class="grid grid-cols-3 gap-2">
                    @for (variant of data.product.variants; track variant.label) {
                      <button type="button" [attr.aria-pressed]="selectedVariant()?.label === variant.label"
                        class="flex flex-col items-center text-center px-2 py-3 rounded-card border transition-all duration-200"
                        [class]="selectedVariant()?.label === variant.label
                          ? 'border-lv-gold bg-lv-gold/8 text-lv-gold'
                          : 'border-white/10 text-lv-cream/60 hover:border-lv-gold/40 hover:text-lv-cream/80'"
                        (click)="selectVariant(variant)">
                        <span class="font-display text-2xl leading-none mb-1"
                              [class]="selectedVariant()?.label === variant.label ? 'text-lv-gold' : 'text-lv-cream'">
                          {{ variant.label }}
                        </span>
                        @if (variant.specs?.capacity) {
                          <span class="font-body text-xs leading-none mb-1"
                                [class]="selectedVariant()?.label === variant.label ? 'text-lv-gold' : 'text-lv-muted'">
                            {{ variant.specs!.capacity }} cartas
                          </span>
                        }
                        <span class="font-body text-[13px] font-semibold"
                              [class]="selectedVariant()?.label === variant.label ? 'text-lv-gold' : 'text-lv-muted'">
                          {{ variant.price | eur }}
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
                    { label: 'Alto',  value: specs.height_cm, unit: 'cm' },
                    { label: 'Largo', value: specs.length_cm, unit: 'cm' },
                    { label: 'Ancho', value: specs.width_cm,  unit: 'cm' }
                  ]; track stat.label) {
                    <div class="text-center">
                      <p class="font-display text-2xl text-lv-cream leading-none">{{ stat.value }}</p>
                      <p class="font-body text-xs text-lv-muted mt-0.5">{{ stat.unit }}</p>
                      <p class="font-body text-xs text-lv-gold mt-0.5">{{ stat.label }}</p>
                    </div>
                  }
                </div>
              }

              <!-- Descripción -->
              <p class="text-lv-cream/55 font-body leading-relaxed text-sm mb-4">
                {{ variantDescription(data.product) }}
              </p>

              <!-- Ideal para (chips) o Features (checkmarks) -->
              @if (variantUses(data.product); as uses) {
                <div class="mb-5">
                  <p class="text-sm font-semibold text-lv-cream mb-3">Ideal para</p>
                  <div class="flex flex-wrap gap-2">
                    @for (use of uses; track use) {
                      <span class="rounded-full px-3 py-1.5 font-body text-[13px] border border-lv-gold/20 text-lv-gold bg-lv-gold/5">
                        {{ use }}
                      </span>
                    }
                  </div>
                </div>
              } @else {
                <ul class="space-y-2 mb-5">
                  @for (feature of data.product.features; track feature) {
                    <li class="flex items-start gap-2 text-lv-cream/60 text-sm font-body">
                      <span class="text-lv-gold mt-0.5 flex-shrink-0">✓</span>
                      {{ feature }}
                    </li>
                  }
                </ul>
              }

              <!-- Addons -->
              @if (productAddons(data.product).length > 0) {
                <div class="border-t border-white/[0.06] pt-5 mb-5">
                  @for (addon of productAddons(data.product); track addon.id) {
                    <div class="flex items-center gap-3 cursor-pointer group min-h-[44px]">
                      <button
                        type="button" role="checkbox"
                        [attr.aria-checked]="selectedAddonIds().has(addon.id)"
                        [attr.aria-label]="addon.name + ', ' + addon.price + ' € más'"
                        class="w-6 h-6 rounded flex-shrink-0 border transition-all duration-150 flex items-center justify-center"
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
                      <span class="lv-price font-body text-sm text-lv-gold">+{{ addon.price | eur }}</span>
                    </div>
                  }
                </div>
              }

              @if (data.product.id === 'caja-bulk') {
                <div class="flex items-center gap-2.5 bg-lv-surface border border-lv-border rounded-card px-3.5 py-2.5 mb-5">
                  <svg class="w-4 h-4 text-lv-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p class="font-body text-xs text-lv-muted">Las cartas <strong class="text-lv-cream/70">no están incluidas</strong>, solo el accesorio impreso en 3D.</p>
                </div>
              }

              <!-- Precio + botón -->
              <div class="flex items-center justify-between pt-4 sm:pt-5 border-t border-white/[0.06] mt-auto gap-3">
                <span class="lv-price font-display text-4xl sm:text-5xl font-semibold tracking-[-0.03em] text-lv-cream leading-none">{{ currentPrice(data.product) | eur }}</span>
                <button
                  class="lv-btn flex-shrink-0 disabled:opacity-40"
                  [class]="!data.product.available
                    ? 'bg-white/5 text-lv-cream/60 cursor-not-allowed'
                    : justAdded()
                      ? 'lv-btn-gold'
                      : 'lv-btn-primary'"
                  [disabled]="!data.product.available"
                  (click)="addToCart(data.product)">
                  @if (!data.product.available) { Agotado }
                  @else if (justAdded()) { Añadido }
                  @else { Añadir a la cesta }
                </button>
              </div>

              <button type="button" (click)="assistant.show()"
                      class="mt-4 self-start inline-flex items-center gap-2 min-h-[44px] text-[15px] text-lv-cream/70 hover:text-lv-foil transition-colors">
                <svg class="w-5 h-5 text-lv-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/>
                </svg>
                ¿Dudas sobre esta pieza? Pregunta aquí
              </button>

            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="flex flex-col items-center justify-center min-h-screen gap-4 text-center">
        <p class="lv-h2 text-lv-cream/60">Producto no encontrado</p>
        <a routerLink="/catalog"
           class="lv-btn lv-btn-ghost">
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
  private seo            = inject(SeoService);
  protected readonly assistant = inject(AssistantService);
  protected readonly cloudinary = inject(CloudinaryService);

  readonly currentImageIndex  = signal(0);
  readonly failedIds          = signal<Set<string>>(new Set());
  readonly selectedVariant    = signal<ProductVariant | null>(null);
  readonly selectedColor      = signal<Color | null>(null);
  readonly selectedLeader     = signal<Leader | null>(null);
  readonly leaderImageIds     = signal<string[]>([]);
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
        this.selectedLeader.set(null);
        this.leaderImageIds.set([]);
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
      })),
      tap(data => this.seo.setProduct(data.product, `/product/${this.route.snapshot.params['id']}`))
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
          const variants = data.product.variants;
          if (variants?.length) {
            this.selectedVariant.set(variants.find(v => v.default) ?? variants[0]);
          }
          if (data.product.colorImageKey) {
            this.preloadColorImages(data.product.colorImageKey, data.colors);
          }
          if (data.product.leaderPickerEnabled && data.product.leaders?.length) {
            const available = data.product.leaders.filter(l => l.available);
            const leader = available.find(l => l.selected) ?? available[0] ?? null;
            this.selectedLeader.set(leader);
            if (leader && data.product.leaderImageKey) {
              const ids = this.buildLeaderImageIds(leader, data.product.leaderImageKey);
              this.leaderImageIds.set(ids);
              this.preloadThumbs(ids);
            } else {
              this.preloadThumbs(data.product.images);
            }
          } else {
            this.preloadThumbs(data.product.images);
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
    if (typeof Image === 'undefined') return; // prerender: no hay navegador
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
    if (typeof Image === 'undefined') return;
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

  private buildLeaderImageIds(leader: Leader, key: string): string[] {
    if (leader.images?.length) return [...leader.images];
    return [1, 2, 3, 4, 5].map(i => `${key}_${leader.id}_${String(i).padStart(2, '0')}`);
  }

  validImages(product: Product): string[] {
    const leaderIds = this.leaderImageIds();
    if (leaderIds.length) return leaderIds;
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

  onLeaderChange(leader: Leader | null): void {
    this.selectedLeader.set(leader);
    const product = this.productData()?.product;
    if (leader && product?.leaderImageKey) {
      const ids = this.buildLeaderImageIds(leader, product.leaderImageKey);
      this.leaderImageIds.set(ids);
      this.currentImageIndex.set(0);
      this.mainImageLoaded.set(false);
      this.showVideo.set(false);
      this.readyThumbs.set([]);
      this.preloadThumbs(ids);
    } else {
      this.leaderImageIds.set([]);
    }
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
    const leader = this.selectedLeader()?.name;
    this.cartService.addItem({
      productId:   product.id,
      productSku:  product.sku,
      productName: product.name,
      variant:     [this.selectedVariant()?.label, addonLabel].filter(Boolean).join(' + '),
      color:       color?.name,
      leader,
      quantity:    1,
      unitPrice:   this.currentPrice(product)
    });
    this.selectedColor.set(colors.find(c => c.id === 'negro') ?? colors[0] ?? null);
    this.justAdded.set(true);
    // Abrir la cesta confirma lo añadido y deja "Hacer pedido" a un toque
    this.cartService.openDrawer();
    if (this.addTimer) clearTimeout(this.addTimer);
    this.addTimer = setTimeout(() => this.justAdded.set(false), 1500);
  }

  onImageError(product: Product): void {
    if (this.leaderImageIds().length) {
      const next = this.currentImageIndex() + 1;
      if (next < this.leaderImageIds().length) {
        this.currentImageIndex.set(next);
      }
      return;
    }
    const valid = this.validImages(product);
    const failedId = valid[this.currentImageIndex()];
    if (!failedId) return;
    this.failedIds.update(s => new Set([...s, failedId]));
    const remaining = this.validImages(product);
    this.currentImageIndex.set(Math.max(0, Math.min(this.currentImageIndex(), remaining.length - 1)));
  }
}
