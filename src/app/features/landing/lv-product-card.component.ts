import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal } from '@angular/core';
import { Product, Color } from '../../core/models/product.model';
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
          @if (selectedColor()) {
            <polygon points="100,30 162,65 100,100 38,65"
                     [attr.fill]="selectedColor()!.hex"
                     opacity="0.25"/>
          }
        </svg>
        @if (product.colorPickerEnabled) {
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
          {{ product.price }}€
          <span class="font-mono text-[10px] uppercase text-lv-cream/40 ml-1">/ unidad</span>
        </p>

        <!-- Color picker row -->
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
            class="w-7 h-7 rounded-full bg-lv-gold text-black font-mono font-bold text-base flex items-center justify-center hover:scale-110 transition-transform flex-shrink-0 ml-2"
            (click)="onAdd($event)">
            +
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

  readonly selectedColor = signal<Color | null>(null);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['colors'] && this.colors.length > 0 && !this.selectedColor()) {
      this.selectedColor.set(this.colors.find(c => c.id === 'negro') ?? this.colors[0]);
    }
  }

  selectColor(color: Color, event: Event): void {
    event.stopPropagation();
    this.selectedColor.set(color);
  }

  onAdd(event: Event): void {
    event.stopPropagation();
    this.added.emit({
      productId:   this.product.id,
      productName: this.product.name,
      color:       this.selectedColor()?.name,
      quantity:    1,
      unitPrice:   this.product.price,
    });
  }
}
