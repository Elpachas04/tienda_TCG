import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
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
  imports: [RevealDirective, NgClass],
  host: { class: 'block' },
  template: `
    <section id="colores" class="bg-lv-black border-t border-lv-gold/[0.08] py-20 sm:py-28 lg:py-36 px-4 sm:px-6">
      <div class="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">

        <!-- LEFT: Paleta -->
        <div>
          <p lvReveal class="font-mono text-xs uppercase tracking-wider text-lv-gold/70 mb-3">— Colores disponibles</p>
          <h2 lvReveal class="font-display uppercase text-3xl sm:text-4xl md:text-7xl text-lv-cream leading-none mb-10">
            TU COLOR,<br>TU PIEZA
          </h2>
          <p lvReveal class="font-mono text-xs uppercase tracking-wide text-lv-cream/40 mb-10 max-w-sm leading-relaxed">
            Todos los productos personalizables están disponibles en 7 colores de PLA Basic sin coste extra.
          </p>

          <div class="space-y-1">
            @for (color of colors; track color.id) {
              <div lvReveal class="flex items-center gap-4 py-3 border-b border-white/[0.05] last:border-0">
                <span class="w-7 h-7 rounded-full flex-shrink-0 border border-white/[0.08]"
                      [style.background]="color.hex">
                </span>
                <p class="font-display text-lg text-lv-cream leading-none flex-1">{{ color.name }}</p>
                <span class="font-mono text-[9px] uppercase tracking-wider text-lv-cream/25">{{ color.type }}</span>
              </div>
            }
          </div>
        </div>

        <!-- RIGHT: Proceso -->
        <div>
          <p lvReveal class="font-mono text-xs uppercase tracking-wider text-lv-gold/70 mb-3">— Proceso de pedido</p>
          <h2 lvReveal class="font-display uppercase text-3xl sm:text-4xl md:text-7xl text-lv-cream leading-none mb-10">
            EN 4<br>PASOS
          </h2>

          <div class="space-y-0">
            @for (step of steps; track step.n) {
              <div lvReveal class="flex items-start gap-5 py-6 border-t border-white/[0.05] first:border-0">
                <span class="font-display text-6xl sm:text-7xl text-lv-gold/[0.12] leading-none flex-shrink-0 select-none w-14 text-right">{{ step.n }}</span>
                <div class="pt-1">
                  <p class="font-display text-xl text-lv-cream mb-1">{{ step.title }}</p>
                  <p class="font-mono text-[11px] uppercase tracking-wide text-lv-cream/35 leading-relaxed">{{ step.desc }}</p>
                </div>
              </div>
            }
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
