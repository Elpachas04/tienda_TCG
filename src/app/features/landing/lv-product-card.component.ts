import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal, inject, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product, ProductVariant, Color, Leader } from '../../core/models/product.model';
import { CartItem } from '../../core/models/cart-item.model';
import { CardGlowDirective } from '../../shared/directives/card-glow.directive';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { PLACEHOLDER } from '../../shared/constants';
import { CloudinaryService } from '../../core/services/cloudinary.service';
import { LeaderPickerComponent } from '../../shared/components/leader-picker.component';

@Component({
  selector: 'app-lv-product-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RevealDirective, LeaderPickerComponent],
  host: { class: 'block h-full' },
  template: `
    <div lvReveal
         [style.transition-delay]="delay"
         class="relative h-full flex flex-col group rounded-card border border-lv-border
                transition-all duration-300 hover:border-lv-gold cursor-pointer bg-lv-surface"
         style="overflow:visible;">

      <!-- Image area -->
      <a [routerLink]="['/product', product.id]"
         class="relative aspect-square rounded-t-card overflow-hidden block flex-shrink-0
                bg-gradient-to-br from-[#201e1a] to-[#2a2820]">
        @if (product.video) {
          <video class="w-full h-full object-cover scale-[1.18] bg-lv-black"
                 autoplay muted loop playsinline preload="metadata"
                 disablepictureinpicture disableremoteplayback
                 [src]="cloudinary.video(product.video!)"
                 [poster]="product.images.length ? cloudinary.card(product.images[0]) : ''">
          </video>
        } @else {
          <img
            [src]="currentImage()"
            [alt]="product.name"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            draggable="false"
            (contextmenu)="$event.preventDefault()"
            (error)="onImageError()"
          />
        }
        @if (product.badge) {
          <span class="absolute top-2 left-2 bg-lv-black/80 rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-lv-gold border border-lv-gold/30">
            {{ product.badge }}
          </span>
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
      <div class="px-4 pt-4 pb-5 flex flex-col flex-1 border-t border-lv-border">

        <a [routerLink]="['/product', product.id]" class="block mb-1">
          <p class="font-mono text-[9px] uppercase tracking-[0.25em] text-lv-gold mb-1">
            {{ product.category }}
          </p>
          <h3 class="font-display text-xl text-lv-cream leading-tight group-hover:text-lv-gold transition-colors duration-200">
            {{ product.name }}
          </h3>
          <p class="font-body text-[11px] text-lv-cream/35 mt-1 mb-2 leading-snug">{{ product.tagline }}</p>
          @if (product.id === 'caja-bulk') {
            <p class="font-mono text-[8px] uppercase tracking-wider text-lv-muted/50 mb-3">Sin cartas incluidas</p>
          }
        </a>

        <!-- Variantes -->
        @if (product.variants && product.variants.length > 0) {
          <div class="flex gap-1 flex-wrap mb-3">
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

        <!-- Precio + botón añadir -->
        <div class="flex items-center justify-between mt-auto">
          <p class="font-display text-2xl text-lv-gold leading-none">
            {{ currentPrice() }}€
          </p>
          <button
            type="button"
            class="w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-lg flex-shrink-0 transition-all duration-200 disabled:opacity-30"
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

        <!-- Color dots -->
        @if (product.colorPickerEnabled && colors.length > 0) {
          <div class="flex gap-1.5 flex-wrap items-center mt-3">
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
        }

        <!-- Leader picker (inline) -->
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
