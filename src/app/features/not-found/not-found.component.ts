import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  host: { class: 'block animate-fade-up' },
  template: `
    <div class="relative bg-lv-black min-h-screen flex flex-col items-center justify-center text-center px-6 gap-8">

      <div class="absolute inset-0 pointer-events-none"
           style="background: radial-gradient(ellipse at center, rgba(201,168,76,0.05) 0%, transparent 60%);">
      </div>

      <div class="relative z-10 space-y-6">
        <p class="font-mono text-xs uppercase tracking-[0.35em] text-lv-gold/50">— Error 404</p>

        <h1 class="font-display uppercase leading-none">
          <span class="block text-lv-cream" style="font-size: clamp(5rem, 20vw, 14rem); opacity: 0.08">404</span>
        </h1>

        <div class="-mt-8">
          <p class="font-display uppercase text-lv-cream text-4xl md:text-5xl leading-none">Pieza no encontrada</p>
          <p class="font-mono text-xs uppercase tracking-wider text-lv-cream/30 mt-4">
            Esta página no existe o se ha movido.
          </p>
        </div>

        <div class="flex gap-4 flex-wrap justify-center pt-4">
          <a routerLink="/"
             class="bg-lv-gold text-black rounded-full px-8 py-3 font-mono text-xs uppercase tracking-wider font-semibold hover:brightness-110 transition-all duration-200">
            Ir al inicio
          </a>
          <a routerLink="/catalog"
             class="liquid-glass border border-lv-gold/30 text-lv-cream rounded-full px-8 py-3 font-mono text-xs uppercase tracking-wider hover:border-lv-gold transition-all duration-200">
            Ver catálogo
          </a>
        </div>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}
