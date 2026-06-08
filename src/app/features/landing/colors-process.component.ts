import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CatalogService } from '../../core/services/catalog.service';
import { RevealDirective } from '../../shared/directives/reveal.directive';

const STEPS = [
  { n: '1', title: 'Elige tu pieza',  desc: 'Navega el catálogo, selecciona producto, variante y color.' },
  { n: '2', title: 'Manda el pedido', desc: 'Rellena nombre y contacto. Confirmación inmediata.' },
  { n: '3', title: 'Abona el total',  desc: 'Pago por Bizum para iniciar fabricación.' },
  { n: '4', title: 'Recibe tu pieza', desc: 'En 3–7 días laborables. Recogida en persona o envío acordado.' },
];

@Component({
  selector: 'app-lv-colors-process',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RevealDirective],
  host: { class: 'block' },
  template: `
    <div id="colores">

      <!-- ── COLORES ── -->
      <section class="bg-lv-black border-t border-lv-gold/[0.08] py-20 sm:py-28 px-4 sm:px-6">
        <div class="max-w-[1400px] mx-auto">

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-end">

            <!-- Heading -->
            <div>
              <p lvReveal class="font-mono text-xs uppercase tracking-wider text-lv-gold/60 mb-4">
                — Colores disponibles
              </p>
              <h2 lvReveal class="font-display uppercase text-lv-cream leading-[0.88]"
                  style="font-size: clamp(2.8rem, 6vw, 5rem);">
                TU COLOR,<br>TU PIEZA
              </h2>
              <p lvReveal class="font-mono text-xs uppercase tracking-wide text-lv-cream/40 mt-6 max-w-xs leading-relaxed">
                7 colores de PLA Basic en todos los productos personalizables. Sin coste extra.
              </p>
            </div>

            <!-- Swatches -->
            <div lvReveal class="flex flex-wrap gap-5 sm:gap-8">
              @for (color of colors; track color.id) {
                <div class="flex flex-col items-center gap-2.5 w-[52px] sm:w-[60px]">
                  <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/[0.07] flex-shrink-0"
                       [style.background]="color.hex"></div>
                  <span class="font-mono text-[8px] uppercase tracking-wider text-lv-cream/40 text-center leading-tight">
                    {{ color.name }}
                  </span>
                </div>
              }
            </div>

          </div>
        </div>
      </section>

      <!-- ── PASOS ── -->
      <section class="bg-lv-black border-t border-lv-gold/[0.08] py-20 sm:py-28 px-4 sm:px-6">
        <div class="max-w-[1400px] mx-auto">

          <p lvReveal class="font-mono text-xs uppercase tracking-wider text-lv-gold/60 mb-12 sm:mb-16">
            — Proceso de pedido
          </p>

          <div class="grid grid-cols-1 lg:grid-cols-4">
            @for (step of steps; track step.n) {
              <div lvReveal
                   class="py-8 lg:py-0 lg:px-8
                          border-b border-lv-gold/[0.08] last:border-b-0
                          lg:border-b-0 lg:border-r lg:border-lv-gold/[0.08]
                          lg:last:border-r-0 lg:first:pl-0 lg:last:pr-0">
                <p class="font-display text-[5rem] sm:text-[6rem] lg:text-[5rem] xl:text-[6rem]
                           text-lv-gold/[0.12] leading-none mb-5 select-none">
                  {{ step.n }}
                </p>
                <p class="font-display text-xl sm:text-2xl text-lv-cream mb-2 leading-tight">{{ step.title }}</p>
                <p class="font-mono text-[11px] uppercase tracking-wide text-lv-cream/35 leading-relaxed">{{ step.desc }}</p>
              </div>
            }
          </div>

        </div>
      </section>

    </div>
  `,
})
export class ColorsProcessComponent {
  private readonly catalogService = inject(CatalogService);
  protected readonly colors = this.catalogService.colors;
  protected readonly steps  = STEPS;
}
