import { ChangeDetectionStrategy, Component, ElementRef, NgZone, afterNextRender, inject } from '@angular/core';
import { SplitHeadingDirective } from '../../shared/directives/split-heading.directive';
import { RouterLink } from '@angular/router';
import { FoilCardComponent } from '../../shared/components/foil-card.component';
import { CloudinaryService } from '../../core/services/cloudinary.service';
import { gsap, prefersReducedMotion } from '../../core/motion/motion';

@Component({
  selector: 'app-lv-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FoilCardComponent, SplitHeadingDirective],
  host: { class: 'block' },
  template: `
    <section id="hero" class="relative min-h-[100svh] flex items-center overflow-hidden bg-lv-black">

      <!-- Vitrina: fondo quieto y un foco cálido sobre la pieza -->
      <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
           style="background: radial-gradient(60% 75% at 74% 42%, #1d1a11 0%, #121212 58%, #0c0c0b 100%);"></div>
      <div class="hero-cone absolute pointer-events-none" aria-hidden="true"></div>

      <div class="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-16 sm:pt-32 lg:pt-28 lg:pb-20
                  grid gap-10 lg:gap-x-20 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] items-center">

        <div class="hero-copy flex flex-col items-start gap-7 lg:col-start-1 lg:row-start-1 lg:self-end">
          <h1 data-split [splitDelay]="0.1" class="lv-display text-lv-cream max-w-[11ch]">
            La primera carta que ven es tu caja.
          </h1>
        </div>

        <lv-foil-card class="hero-card hero-reveal lg:col-start-2 lg:row-start-1 lg:row-span-2"
          name="Leader Vault"
          [price]="50"
          [image]="leaderVaultImage" />

        <div class="hero-copy flex flex-col items-start gap-8 lg:col-start-1 lg:row-start-2 lg:self-start">
          <p class="lv-lede hero-reveal">
            No les decepciones. Deckboxes, expositores y organizadores para TCG,
            impresos en 3D en Barcelona.
          </p>

          <div class="flex gap-3 flex-wrap hero-reveal">
            <a routerLink="/catalog" class="lv-btn lv-btn-primary">Ver catálogo</a>
          </div>

          <dl class="hero-reveal grid grid-cols-3 gap-x-6 sm:gap-x-10 pt-6 border-t border-lv-cream/10 w-full max-w-md">
            <div>
              <dt class="text-xs text-lv-cream/45">Fabricación</dt>
              <dd class="mt-1 text-[15px] font-semibold text-lv-cream">Uno a uno</dd>
            </div>
            <div>
              <dt class="text-xs text-lv-cream/45">Entrega</dt>
              <dd class="mt-1 text-[15px] font-semibold text-lv-cream">3–7 días</dd>
            </div>
            <div>
              <dt class="text-xs text-lv-cream/45">Pago</dt>
              <dd class="mt-1 text-[15px] font-semibold text-lv-cream">Bizum</dd>
            </div>
          </dl>
        </div>

      </div>
    </section>
  `,
  styles: [`
    .hero-cone {
      top: 0; right: 2%; width: 48%; height: 100%;
      background: radial-gradient(ellipse 34% 92% at 50% 0%, rgba(255, 226, 165, .11), rgba(255, 226, 165, .03) 55%, transparent 80%);
    }
    @media (max-width: 1023px) { .hero-cone { display: none; } }
  `],
})
export class HeroComponent {
  readonly leaderVaultImage = inject(CloudinaryService).detail('leader-vault_yamato_01');

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const zone = inject(NgZone);
    // Un solo momento orquestado: el titular sube línea a línea y después aparecen la pieza y el resto
    afterNextRender(() => {
      const items = host.querySelectorAll<HTMLElement>('.hero-reveal');
      if (prefersReducedMotion()) { gsap.set(items, { autoAlpha: 1 }); return; }
      zone.runOutsideAngular(() => {
        gsap.fromTo(host.querySelector('.hero-card'),
          { autoAlpha: 0, y: 28, scale: 0.97 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 1.3, delay: 0.35, ease: 'expo.out' });
        gsap.fromTo(host.querySelectorAll('.hero-copy .hero-reveal'),
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.9, delay: 0.55, stagger: 0.08, ease: 'expo.out' });
      });
    });
  }
}
