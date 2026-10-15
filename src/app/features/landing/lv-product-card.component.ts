import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal, inject, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product, ProductVariant, Color, Leader } from '../../core/models/product.model';
import { CartItem } from '../../core/models/cart-item.model';
import { FoilHoverDirective } from '../../shared/directives/foil-hover.directive';
import { PLACEHOLDER } from '../../shared/constants';
import { CloudinaryService } from '../../core/services/cloudinary.service';
import { LeaderPickerComponent } from '../../shared/components/leader-picker.component';

@Component({
  selector: 'app-lv-product-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FoilHoverDirective, LeaderPickerComponent],
  host: { class: 'block h-full' },
  template: `
    <article class="group relative h-full flex flex-col">

      <a [routerLink]="['/product', product.id]" lvFoil
         class="foil-frame relative block aspect-square rounded-card bg-[#111] flex-shrink-0"
         [style.view-transition-name]="'product-' + product.id"
         [attr.aria-label]="product.name">
        <div class="absolute inset-0 rounded-card overflow-hidden">
          @if (product.video) {
            <video class="w-full h-full object-cover scale-[1.18] bg-[#111]"
                   autoplay muted loop playsinline preload="metadata"
                   disablepictureinpicture disableremoteplayback
                   [src]="cloudinary.video(product.video!)"
                   [poster]="product.images.length ? cloudinary.card(product.images[0]) : ''">
            </video>
          } @else {
            <img
              [src]="currentImage()"
              [alt]="product.name"
              class="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
              loading="lazy"
              draggable="false"
              (contextmenu)="$event.preventDefault()"
              (error)="onImageError()"
            />
          }
        </div>
        @if (product.badge) {
          <span class="absolute z-[2] top-3 left-3 rounded-full bg-lv-black/75 backdrop-blur px-2.5 py-1 text-xs font-semibold text-lv-foil">
            {{ product.badge }}
          </span>
        }
        @if (!product.available) {
          <div class="absolute inset-0 z-[2] rounded-card bg-black/75 grid place-items-center">
            <span class="text-sm font-semibold text-lv-cream/60">Agotado</span>
          </div>
        }
      </a>

      <div class="flex flex-col flex-1 pt-4">
        <a [routerLink]="['/product', product.id]" class="block">
          <h3 class="lv-h3 text-lv-cream group-hover:text-lv-foil transition-colors duration-200">{{ product.name }}</h3>
          <p class="lv-note mt-1 line-clamp-2">{{ product.tagline }}</p>
          @if (product.id === 'caja-bulk') {
            <p class="text-xs text-lv-muted mt-1">Sin cartas incluidas</p>
          }
        </a>

        @if (product.variants && product.variants.length > 0) {
          <div class="flex gap-1.5 flex-wrap items-center mt-3" role="group" aria-label="Tamaño">
            @for (v of product.variants; track v.label) {
              <button type="button"
                class="rounded-full px-3 h-8 text-[13px] font-medium border transition-colors duration-150"
                [class]="selectedVariant()?.label === v.label
                  ? 'border-lv-gold text-lv-foil bg-lv-gold/10'
                  : 'border-lv-cream/15 text-lv-cream/60 hover:border-lv-cream/40 hover:text-lv-cream'"
                [attr.aria-pressed]="selectedVariant()?.label === v.label"
                (click)="selectedVariant.set(v)">
                {{ v.label }}
              </button>
            }
            @if (selectedVariant()?.specs?.capacity) {
              <span class="text-[13px] text-lv-cream/45 ml-1">{{ selectedVariant()!.specs!.capacity }} cartas</span>
            }
          </div>
        }

        @if (product.colorPickerEnabled && colors.length > 0) {
          <div class="flex gap-2 flex-wrap items-center mt-3" role="group" aria-label="Color">
            @for (color of colors; track color.id) {
              <button
                type="button"
                class="w-[18px] h-[18px] rounded-full flex-shrink-0 transition-shadow duration-150"
                [title]="color.name"
                [attr.aria-label]="color.name"
                [attr.aria-pressed]="selectedColor()?.id === color.id"
                [style.background]="color.hex"
                [style.box-shadow]="selectedColor()?.id === color.id
                  ? '0 0 0 2px #121212, 0 0 0 3.5px #C9A84C'
                  : 'inset 0 0 0 1px rgba(255,255,255,.14)'"
                (click)="selectColor(color, $event)">
              </button>
            }
            @if (selectedColor()) {
              <span class="text-[13px] text-lv-cream/45 ml-1">{{ selectedColor()!.name }}</span>
            }
          </div>
        }

        @if (product.leaderPickerEnabled && product.leaders?.length) {
          <div class="mt-3" (click)="$event.stopPropagation()">
            <app-leader-picker
              [leaders]="product.leaders!"
              [selected]="selectedLeader()"
              layout="inline"
              (leaderChange)="selectedLeader.set($event)">
            </app-leader-picker>
          </div>
        }

        <div class="flex items-center justify-between gap-3 mt-auto pt-4">
          <p class="lv-price font-display text-[1.375rem] font-semibold tracking-[-0.02em] text-lv-cream leading-none">
            {{ currentPrice() }} €
          </p>
          <button
            type="button"
            class="h-10 px-4 rounded-full text-sm font-semibold transition-colors duration-200 disabled:opacity-30 disabled:pointer-events-none"
            [class]="justAdded()
              ? 'bg-lv-gold text-lv-black'
              : 'border border-lv-cream/20 text-lv-cream hover:bg-lv-cream hover:text-lv-black'"
            [disabled]="!product.available"
            (click)="onAdd($event)">
            {{ justAdded() ? 'Añadido' : 'Añadir' }}
          </button>
        </div>
      </div>
    </article>
  `,
})
export class LvProductCardComponent implements OnChanges {
  @Input({ required: true }) product!: Product;
  @Input() colors: Color[] = [];
  @Output() added = new EventEmitter<CartItem>();

  protected readonly cloudinary = inject(CloudinaryService);
  private destroyRef   = inject(DestroyRef);
  private addTimer: ReturnType<typeof setTimeout> | null = null;

  readonly currentImageIndex = signal(0);
  readonly failedIds         = signal<Set<string>>(new Set());
  readonly selectedVariant   = signal<ProductVariant | null>(null);
  readonly selectedColor     = signal<Color | null>(null);
  readonly selectedLeader    = signal<Leader | null>(null);
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
    if (changes['product']) {
      this.failedIds.set(new Set());
      this.currentImageIndex.set(0);
      const variants = this.product.variants;
      this.selectedVariant.set(variants?.length ? (variants.find(v => v.default) ?? variants[0]) : null);
      if (this.product.leaderPickerEnabled && this.product.leaders?.length) {
        const avail = this.product.leaders.filter(l => l.available);
        this.selectedLeader.set(avail.find(l => l.selected) ?? avail[0] ?? null);
      }
    }
  }

  validImages(): string[] {
    const failed = this.failedIds();
    return this.product.images.filter(id => !failed.has(id));
  }

  currentImage(): string {
    const valid = this.validImages();
    const id = valid[this.currentImageIndex()];
    return id ? this.cloudinary.card(id) : PLACEHOLDER;
  }

  currentPrice() {
    return this.selectedVariant()?.price ?? this.product.price;
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
      leader:      this.selectedLeader()?.name,
      quantity:    1,
      unitPrice:   this.currentPrice()
    });
    this.justAdded.set(true);
    if (this.addTimer) clearTimeout(this.addTimer);
    this.addTimer = setTimeout(() => this.justAdded.set(false), 1500);
  }

  onImageError(): void {
    const valid = this.validImages();
    const failedId = valid[this.currentImageIndex()];
    if (!failedId) return;
    this.failedIds.update(s => new Set([...s, failedId]));
    const remaining = this.validImages();
    this.currentImageIndex.set(Math.max(0, Math.min(this.currentImageIndex(), remaining.length - 1)));
  }
}
