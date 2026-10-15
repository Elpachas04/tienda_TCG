import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  host: { class: 'block animate-fade-up' },
  template: `
    <div class="relative bg-lv-black min-h-screen flex flex-col items-center justify-center text-center px-6 gap-8">

      <div class="absolute inset-0 pointer-events-none"
           style="background: radial-gradient(ellipse at center, rgba(201,168,76,0.05) 0%, transparent 60%);">
      </div>

      <div class="relative z-10 space-y-6">
        <h1 class="font-display leading-none">
          <span class="block text-lv-cream" style="font-size: clamp(5rem, 20vw, 14rem); opacity: 0.08">404</span>
        </h1>

        <div class="-mt-8">
          <p class="lv-h1 text-lv-cream">Pieza no encontrada</p>
          <p class="font-body text-[13px] text-lv-cream/30 mt-4">
            Esta página no existe o se ha movido.
          </p>
        </div>

        <div class="flex gap-4 flex-wrap justify-center pt-4">
          <a routerLink="/"
             class="lv-btn lv-btn-primary">
            Ir al inicio
          </a>
          <a routerLink="/catalog"
             class="lv-btn lv-btn-ghost">
            Ver catálogo
          </a>
        </div>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}
