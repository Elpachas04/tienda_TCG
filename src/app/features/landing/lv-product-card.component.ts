import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { LvProduct, LANDING_COLORS } from './lv-products.data';
import { CartItem } from '../../core/models/cart-item.model';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-lv-product-card',
  standalone: true,
  imports: [RevealDirective],
  template: `
    <div lvReveal
         class="card-glow liquid-glass rounded-[28px] cursor-pointer flex flex-col"
         style="overflow:visible;"
         [style.transition-delay]="delay">

      <!-- Image area -->
      <div class="aspect-square bg-lv-surface rounded-[20px] m-3 relative overflow-hidden flex-shrink-0">
        <svg viewBox="0 0 200 200" class="w-full h-full p-8" xmlns="http://www.w3.org/2000/svg">
          <g stroke="#C9A84C" stroke-width="1.5" fill="none">
            <polygon points="100,30 162,65 100,100 38,65"  fill="rgba(201,168,76,0.05)"/>
            <polygon points="38,65  100,100 100,158 38,123" fill="rgba(201,168,76,0.03)"/>
            <polygon points="100,100 162,65  162,123 100,158" fill="rgba(201,168,76,0.07)"/>
          </g>
          <!-- Color preview fill on the top face -->
          @if (selectedColor()) {
            <polygon points="100,30 162,65 100,100 38,65"
                     [attr.fill]="selectedColor()"
                     opacity="0.25"/>
          }
        </svg>
        @if (product.customizable) {
          <span class="absolute top-2 left-2 liquid-glass rounded-full px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-lv-gold">
            Color libre
          </span>
        }
      </div>

      <!-- Body -->
      <div class="p-4 pt-2 flex flex-col flex-1">
        <h3 class="font-display text-xl text-lv-cream leading-tight">{{ product.name }}</h3>
        <p class="font-body text-[11px] italic text-lv-cream/35 mt-0.5 mb-2 leading-snug">{{ product.tagline }}</p>

        <p class="font-display text-2xl text-lv-gold leading-none mb-3">
          {{ product.price }}
          <span class="font-mono text-[10px] uppercase text-lv-cream/40 ml-1">/ unidad</span>
        </p>

        <!-- Color picker row -->
        <div class="flex justify-between items-center mt-auto">
          @if (product.customizable) {
            <div class="flex gap-1.5 flex-wrap items-center">
              @for (color of colors; track color.hex) {
                <button
                  type="button"
                  class="rounded-full transition-all duration-150 cursor-pointer flex-shrink-0"
                  [title]="color.name"
                  [style.width]="selectedColor() === color.hex ? '14px' : '10px'"
                  [style.height]="selectedColor() === color.hex ? '14px' : '10px'"
                  [style.background]="color.hex"
                  [style.outline]="selectedColor() === color.hex ? '2px solid #C9A84C' : '1px solid rgba(255,255,255,0.15)'"
                  [style.outline-offset]="'2px'"
                  (click)="selectColor(color.hex, $event)">
                </button>
              }
            </div>
          } @else {
            <span class="font-mono text-[9px] uppercase tracking-wider text-lv-cream/30">Color fijo</span>
          }

          <button
            type="button"
            class="w-7 h-7 rounded-full bg-lv-gold text-black font-mono font-bold text-base flex items-center justify-center hover:scale-110 transition-transform flex-shrink-0 ml-2"
            (click)="onAdd($event)">
            +
          </button>
        </div>

        <!-- Selected color label -->
        @if (product.customizable && selectedColor()) {
          <p class="font-mono text-[9px] uppercase tracking-wider text-lv-gold/60 mt-2">
            Color: {{ selectedColorName() }}
          </p>
        }
      </div>
    </div>
  `,
})
export class LvProductCardComponent {
  @Input({ required: true }) product!: LvProduct;
  @Input() delay = '0ms';
  @Output() added = new EventEmitter<CartItem>();

  protected colors = LANDING_COLORS;
  readonly selectedColor = signal<string>('');

  selectedColorName(): string {
    return this.colors.find(c => c.hex === this.selectedColor())?.name ?? '';
  }

  selectColor(hex: string, event: Event): void {
    event.stopPropagation();
    this.selectedColor.set(this.selectedColor() === hex ? '' : hex);
  }

  onAdd(event: Event): void {
    event.stopPropagation();
    const colorName = this.selectedColorName() || undefined;
    const unitPrice = parseInt(this.product.price.match(/\d+/)?.[0] ?? '0', 10);
    this.added.emit({
      productId:   this.product.id,
      productName: this.product.name,
      variant:     undefined,
      color:       colorName,
      quantity:    1,
      unitPrice,
    });
  }
}
