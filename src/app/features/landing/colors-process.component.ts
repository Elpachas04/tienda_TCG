import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SplitHeadingDirective } from '../../shared/directives/split-heading.directive';
import { CatalogService } from '../../core/services/catalog.service';

const STEPS = [
  { n: '1', title: 'Elige tu pieza',     desc: 'Producto, tamaño y color. Si quieres algo fuera del catálogo, pregúntanos.' },
  { n: '2', title: 'Confirma el pedido', desc: 'Solo tu nombre y contacto. Al momento te llega un email con tu número de pedido.' },
  { n: '3', title: 'Paga por Bizum',     desc: 'Con tu número de pedido como concepto. Te confirmamos el pago en menos de 1 hora.' },
  { n: '4', title: 'Recíbela o recógela', desc: 'La fabricamos en 3–7 días laborables. Después, envío por Correos o recogida en mano.' },
];

@Component({
  selector: 'app-lv-colors-process',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SplitHeadingDirective],
  host: { class: 'block' },
  template: `
    <section id="colores" class="bg-lv-black py-20 sm:py-28 lg:py-32 border-t border-lv-cream/[0.06]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-16 lg:gap-24">

        <div>
          <h2 data-split class="lv-h2 text-lv-cream">Tu color, tu pieza</h2>

          <ul class="mt-10 grid grid-cols-4 sm:grid-cols-7 gap-x-3 gap-y-6 max-w-xl">
            @for (color of colors; track color.id) {
              <li class="flex flex-col gap-2">
                <span class="chip" [style.background-color]="color.hex"></span>
                <span class="text-[13px] text-lv-cream/60">{{ color.name }}</span>
              </li>
            }
          </ul>
        </div>

        <div>
          <h2 class="lv-h3 text-lv-cream">Cómo funciona</h2>
          <ol class="mt-6 border-t border-lv-cream/10">
            @for (step of steps; track step.n) {
              <li class="grid grid-cols-[3rem_1fr] gap-x-3 py-5 border-b border-lv-cream/10">
                <span class="lv-price font-display text-[2rem] font-semibold leading-none tracking-[-0.04em] text-lv-gold">{{ step.n }}</span>
                <div>
                  <p class="text-[17px] font-semibold text-lv-cream leading-snug">{{ step.title }}</p>
                  <p class="lv-note mt-1">{{ step.desc }}</p>
                </div>
              </li>
            }
          </ol>
        </div>

      </div>
    </section>
  `,
  styles: [`
    .chip {
      display: block; aspect-ratio: 63 / 88; border-radius: 6px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.28), inset 0 -10px 18px rgba(0,0,0,.28), 0 0 0 1px rgba(255,255,255,.08);
    }
  `],
})
export class ColorsProcessComponent {
  private readonly catalogService = inject(CatalogService);
  protected readonly colors = this.catalogService.colors;
  protected readonly steps  = STEPS;
}
