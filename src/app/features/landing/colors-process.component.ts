import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { RevealDirective } from '../../shared/directives/reveal.directive';

const STEPS = [
  { n: '1', title: 'Elige tu pieza',  desc: 'Navega el catálogo, selecciona producto, variante y color.' },
  { n: '2', title: 'Manda el pedido', desc: 'Rellena nombre y contacto. Confirmación inmediata.' },
  { n: '3', title: 'Abona el total',   desc: 'Pago por Bizum o transferencia para iniciar fabricación.' },
  { n: '4', title: 'Recibe tu pieza', desc: 'En 3–7 días laborables. Recogida en persona o envío acordado.' },
];

@Component({
  selector: 'app-lv-colors-process',
  standalone: true,
  imports: [RevealDirective, NgClass],
  host: { class: 'block' },
  template: `
    <section id="colores" class="bg-lv-deep py-14 sm:py-20 lg:py-24 px-4 sm:px-6">
      <div class="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-10 sm:gap-14 lg:gap-16">

        <!-- LEFT: Paleta -->
        <div>
          <p lvReveal class="font-mono text-xs uppercase tracking-wider text-lv-gold/70 mb-3">— Colores disponibles</p>
          <h2 lvReveal class="font-display uppercase text-3xl sm:text-4xl md:text-7xl text-lv-cream leading-none mb-4">
            TU COLOR,<br>TU PIEZA
          </h2>
          <p lvReveal class="font-mono text-xs uppercase tracking-wide text-lv-cream/50 mt-4 max-w-sm leading-relaxed">
            Todos los productos personalizables están disponibles en 7 colores de PLA Basic sin coste extra.
          </p>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            @for (color of colors(); track color.id) {
              <div lvReveal class="liquid-glass rounded-[20px] p-4 flex items-center gap-3">
                <span class="w-10 h-10 rounded-full border border-white/10 flex-shrink-0"
                      [style.background]="color.hex">
                </span>
                <div>
                  <p class="font-display text-lg text-lv-cream leading-tight">{{ color.name }}</p>
                  <span class="font-mono text-[9px] uppercase tracking-wider text-lv-gold/50">{{ color.type }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- RIGHT: Proceso -->
        <div>
          <p lvReveal class="font-mono text-xs uppercase tracking-wider text-lv-gold/70 mb-3">— Proceso de pedido</p>
          <h2 lvReveal class="font-display uppercase text-3xl sm:text-4xl md:text-7xl text-lv-cream leading-none mb-6 sm:mb-8">
            EN 4<br>PASOS
          </h2>

          @for (step of steps; track step.n; let last = $last) {
            <div lvReveal
                 class="flex items-start gap-4 py-4 sm:py-5"
                 [ngClass]="{'border-b border-lv-gold/10': !last}">
              <span class="font-display text-5xl text-lv-gold/20 leading-none w-12 flex-shrink-0">{{ step.n }}</span>
              <div>
                <p class="font-display text-xl text-lv-cream">{{ step.title }}</p>
                <p class="font-mono text-[11px] uppercase tracking-wide text-lv-cream/40 mt-1 leading-relaxed">{{ step.desc }}</p>
              </div>
            </div>
          }

          <div lvReveal class="liquid-glass rounded-[20px] p-5 mt-6 border border-lv-gold/20">
            <p class="font-mono text-[11px] uppercase tracking-wide text-lv-cream/60 leading-relaxed">
              Sin pasarela de pago · Sin registro · Sin comisiones<br>
              Trato directo con el creador en menos de 1 hora
            </p>
          </div>
        </div>

      </div>
    </section>
  `,
})
export class ColorsProcessComponent {
  private catalogService = inject(CatalogService);

  protected readonly colors = toSignal(
    this.catalogService.getColors().pipe(catchError(() => of([]))),
    { initialValue: [] }
  );

  protected readonly steps = STEPS;
}
