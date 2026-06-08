import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-lv-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RevealDirective, RouterLink],
  host: { class: 'block' },
  template: `
    <section id="hero"
      class="relative min-h-screen flex flex-col justify-center items-center text-center px-4 sm:px-6 pt-24 sm:pt-28 pb-16 sm:pb-24 bg-lv-black">

      <!-- Radial glow -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true"
           style="background: radial-gradient(ellipse at 80% 10%, rgba(201,168,76,0.06) 0%, transparent 60%);">
        <svg class="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="25%" x2="100%" y2="80%" stroke="rgba(201,168,76,0.08)" stroke-width="1"/>
          <line x1="100%" y1="15%" x2="0"    y2="70%" stroke="rgba(201,168,76,0.08)" stroke-width="1"/>
        </svg>
      </div>

      <!-- Content -->
      <div class="relative z-10 flex flex-col items-center gap-6 max-w-3xl mx-auto">

        <p lvReveal class="font-mono text-xs uppercase tracking-[0.3em] text-lv-gold">
          Ingeniería 3D · Alta precisión
        </p>

        <h1 lvReveal
            class="font-display leading-[0.95] uppercase text-[36px] sm:text-[56px] md:text-[84px] lg:text-[112px] xl:text-[140px]">
          <span class="text-lv-cream block">TU MAZO VALE</span>
          <span class="text-lv-gold block">MÁS QUE UNA</span>
          <span class="text-lv-cream block">CAJA DE 2€</span>
        </h1>

        <p lvReveal class="font-display text-lv-gold/70 text-xl sm:text-2xl md:text-4xl tracking-wide uppercase">
          tolerancia milimétrica en cada capa
        </p>

        <p lvReveal class="font-mono text-xs uppercase tracking-wide text-lv-cream/50 max-w-md leading-relaxed">
          Accesorios high-end para TCG con tolerancias mecánicas reales.<br>
          Sin holguras ni cierres débiles. Fabricación exclusiva bajo demanda.
        </p>

        <div lvReveal class="flex gap-4 flex-wrap justify-center">
          <a routerLink="/catalog"
             class="bg-lv-gold text-black rounded-full px-6 sm:px-8 py-3 sm:py-4 font-mono text-xs uppercase tracking-wider font-semibold hover:brightness-110 transition-all duration-200">
            Asegurar mi mazo
          </a>
          <a href="#colores"
             class="border border-lv-gold/30 text-lv-cream rounded-full px-6 sm:px-8 py-3 sm:py-4 font-mono text-xs uppercase tracking-wider hover:border-lv-gold transition-all duration-200">
            Ingeniería Vault →
          </a>
        </div>

        <p lvReveal class="font-mono text-[10px] uppercase tracking-widest text-lv-cream/25">
          Diseño paramétrico &nbsp;·&nbsp; Colores de facción &nbsp;·&nbsp; Cero stock masivo
        </p>

      </div>
    </section>
  `,
})
export class HeroComponent {}
