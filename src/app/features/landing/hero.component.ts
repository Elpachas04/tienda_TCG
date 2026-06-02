import { Component } from '@angular/core';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-lv-hero',
  standalone: true,
  imports: [RevealDirective],
  host: { class: 'block' },
  template: `
    <section id="hero"
      class="relative min-h-screen flex flex-col justify-center items-center text-center px-6 pt-28 pb-24 rounded-b-[40px] bg-lv-black">

      <!-- Radial glow -->
      <div class="absolute inset-0 pointer-events-none rounded-b-[40px] overflow-hidden" aria-hidden="true"
           style="background: radial-gradient(ellipse at 80% 10%, rgba(201,168,76,0.06) 0%, transparent 60%);">
        <!-- Diagonal lines -->
        <svg class="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="25%" x2="100%" y2="80%" stroke="rgba(201,168,76,0.08)" stroke-width="1"/>
          <line x1="100%" y1="15%" x2="0"    y2="70%" stroke="rgba(201,168,76,0.08)" stroke-width="1"/>
        </svg>
      </div>

      <!-- Content -->
      <div class="relative z-10 flex flex-col items-center gap-6 max-w-3xl mx-auto">

        <p lvReveal class="font-mono text-xs uppercase tracking-[0.3em] text-lv-gold">
          Barcelona · Ingeniería 3D · Alta precisión
        </p>

        <h1 lvReveal
            class="font-display leading-[0.95] uppercase text-[56px] md:text-[84px] lg:text-[112px] xl:text-[140px]">
          <span class="text-lv-cream block">TU MAZO VALE</span>
          <span class="text-lv-gold block">MÁS QUE UNA</span>
          <span class="text-lv-cream block">CAJA DE 2€</span>
        </h1>

        <p lvReveal class="font-accent italic text-lv-gold text-2xl md:text-4xl">
          tolerancia milimétrica en cada capa
        </p>

        <p lvReveal class="font-mono text-xs uppercase tracking-wide text-lv-cream/50 max-w-md leading-relaxed">
          Accesorios high-end para TCG con tolerancias mecánicas reales.<br>
          Sin holguras ni cierres débiles. Fabricación exclusiva bajo demanda.
        </p>

        <div lvReveal class="flex gap-4 flex-wrap justify-center">
          <a href="#catalogo"
             class="bg-lv-gold text-black rounded-full px-8 py-4 font-mono text-xs uppercase tracking-wider font-semibold hover:brightness-110 transition-all duration-200">
            Asegurar mi mazo
          </a>
          <a href="#colores"
             class="liquid-glass border border-lv-gold/30 text-lv-cream rounded-full px-8 py-4 font-mono text-xs uppercase tracking-wider hover:border-lv-gold transition-all duration-200">
            Ingeniería Vault →
          </a>
        </div>

        <div lvReveal class="flex gap-3 flex-wrap justify-center">
          <span class="liquid-glass rounded-full px-6 py-3 font-mono text-xs uppercase tracking-wider text-lv-cream/70">Diseño paramétrico</span>
          <span class="liquid-glass rounded-full px-6 py-3 font-mono text-xs uppercase tracking-wider text-lv-cream/70">Colores de facción</span>
          <span class="liquid-glass rounded-full px-6 py-3 font-mono text-xs uppercase tracking-wider text-lv-cream/70">Cero stock masivo</span>
        </div>

      </div>
    </section>
  `,
})
export class HeroComponent {}
