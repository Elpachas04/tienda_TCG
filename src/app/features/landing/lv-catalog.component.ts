import { Component, inject, signal, computed } from '@angular/core';
import { LANDING_PRODUCTS, LvProduct } from './lv-products.data';
import { LvProductCardComponent } from './lv-product-card.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { CartService } from '../../core/services/cart.service';
import { CartItem } from '../../core/models/cart-item.model';

type FilterValue = 'todos' | 'deckboxes' | 'almacenaje' | 'herramientas' | 'accesorios';

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: 'Todos',        value: 'todos'        },
  { label: 'Deckboxes',    value: 'deckboxes'    },
  { label: 'Almacenaje',   value: 'almacenaje'   },
  { label: 'Herramientas', value: 'herramientas' },
  { label: 'Accesorios',   value: 'accesorios'   },
];

const BASE_PILL = 'font-mono text-xs uppercase tracking-wider rounded-full px-5 py-2 transition-all duration-200';

@Component({
  selector: 'app-lv-catalog',
  standalone: true,
  imports: [LvProductCardComponent, RevealDirective],
  host: { class: 'block' },
  template: `
    <section id="catalogo" class="bg-lv-black py-24 md:py-32 px-6">
      <div class="max-w-[1600px] mx-auto">

        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
          <div lvReveal>
            <p class="font-mono text-xs uppercase tracking-wider text-lv-gold/70 mb-3">— Catálogo completo</p>
            <h2 class="font-display uppercase text-5xl md:text-7xl leading-none">
              <span class="text-lv-cream block">LO QUE</span>
              <span class="text-lv-gold block">FABRICAMOS</span>
            </h2>
          </div>

          <!-- Filter pills -->
          <div lvReveal class="flex gap-2 flex-wrap">
            @for (f of filters; track f.value) {
              <button [class]="pillClass(f.value)" (click)="activeFilter.set(f.value)">
                {{ f.label }}
              </button>
            }
          </div>
        </div>

        <!-- Product grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          @for (p of filteredProducts(); track p.id; let i = $index) {
            <app-lv-product-card
              [product]="p"
              [delay]="i * 60 + 'ms'"
              (added)="onAddToCart($event)" />
          }
        </div>

      </div>
    </section>
  `,
})
export class LvCatalogComponent {
  private cartService = inject(CartService);
  protected filters = FILTERS;
  readonly activeFilter = signal<FilterValue>('todos');

  readonly filteredProducts = computed<LvProduct[]>(() => {
    const f = this.activeFilter();
    return f === 'todos' ? LANDING_PRODUCTS : LANDING_PRODUCTS.filter(p => p.category === f);
  });

  pillClass(value: FilterValue): string {
    return this.activeFilter() === value
      ? `${BASE_PILL} bg-lv-gold text-black font-semibold`
      : `${BASE_PILL} liquid-glass border border-lv-gold/20 text-lv-cream/60`;
  }

  onAddToCart(item: CartItem): void {
    this.cartService.addItem(item);
    this.cartService.openDrawer();
  }
}
