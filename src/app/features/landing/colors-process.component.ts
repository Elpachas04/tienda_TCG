import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CatalogService } from '../../core/services/catalog.service';
import { RevealDirective } from '../../shared/directives/reveal.directive';

const STEPS = [
  { n: '1', title: 'Elige tu pieza',     desc: 'Navega el catálogo. Elige producto, tamaño y color.' },
  { n: '2', title: 'Mándanos el pedido', desc: 'Solo tu nombre y contacto. Te confirmamos al momento.' },
  { n: '3', title: 'Paga por Bizum',     desc: 'Rápido y sin rodeos. Empezamos a fabricar en el momento.' },
  { n: '4', title: 'Recíbela en casa',   desc: '3–7 días laborables. Envío acordado o recogida en persona.' },
];

@Component({
  selector: 'app-lv-colors-process',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RevealDirective],
  host: { class: 'block' },
  template: `
    <section id="colores" class="bg-lv-black border-t border-lv-gold/[0.08] py-20 sm:py-28 px-4 sm:px-6">
      <div class="max-w-[1400px] mx-auto">

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20">

          <!-- ── IZQUIERDA: Colores ── -->
          <div>
            <p lvReveal class="font-mono text-xs uppercase tracking-wider text-lv-gold/60 mb-4">
              — Elige tu facción
            </p>
            <h2 lvReveal class="font-display uppercase text-lv-cream leading-[0.88]"
                style="font-size: clamp(2.8rem, 6vw, 5rem);">
              TU COLOR,<br>TU PIEZA
            </h2>
            <p lvReveal class="font-mono text-xs uppercase tracking-wide text-lv-cream/40 mt-5 mb-8 max-w-xs leading-relaxed">
              Los 7 colores oficiales de One Piece TCG. En todos los productos sin coste extra.
            </p>

            <!-- Swatches: 4+3 centrado en móvil, fila única en sm+ -->
            <div lvReveal class="flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-5">
              @for (color of colors; track color.id) {
                <div class="flex flex-col items-center gap-2 w-[56px] sm:w-[64px]">
                  <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/[0.07] flex-shrink-0"
                       [style.background]="color.hex"></div>
                  <span class="font-mono text-[8px] uppercase tracking-wider text-lv-cream/40 text-center leading-tight">
                    {{ color.name }}
                  </span>
                </div>
              }
            </div>
          </div>

          <!-- ── DERECHA: Pasos ── -->
          <div>
            <p lvReveal class="font-mono text-xs uppercase tracking-wider text-lv-gold/60 mb-4 lg:mb-6">
              — Así funciona
            </p>

            <div class="divide-y divide-lv-gold/[0.08]">
              @for (step of steps; track step.n) {
                <div lvReveal class="flex items-start gap-4 py-4 sm:py-5 first:pt-0">
                  <span class="font-display text-[2.5rem] sm:text-[3rem] text-lv-gold/[0.15] leading-none
                               flex-shrink-0 w-9 sm:w-11 text-right select-none">
                    {{ step.n }}
                  </span>
                  <div class="pt-1">
                    <p class="font-display text-lg sm:text-xl text-lv-cream leading-tight mb-1">{{ step.title }}</p>
                    <p class="font-mono text-[11px] uppercase tracking-wide text-lv-cream/35 leading-relaxed">{{ step.desc }}</p>
                  </div>
                </div>
              }
            </div>
          </div>

        </div>
      </div>
    </section>
  `,
})
export class ColorsProcessComponent {
  private readonly catalogService = inject(CatalogService);
  protected readonly colors = this.catalogService.colors;
  protected readonly steps  = STEPS;
}
