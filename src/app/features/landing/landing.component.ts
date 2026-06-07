import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroComponent } from './hero.component';
import { ColorsProcessComponent } from './colors-process.component';
import { CtaComponent } from './cta.component';
import { LvFooterComponent } from './lv-footer.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeroComponent, ColorsProcessComponent, CtaComponent, LvFooterComponent],
  host: { class: 'block bg-lv-black text-lv-cream min-h-screen' },
  template: `
    <!-- Hero: pinta inmediatamente (LCP) -->
    <app-lv-hero />

    <!-- Sección de colores: se renderiza al entrar en viewport -->
    @defer (on viewport) {
      <app-lv-colors-process />
    } @placeholder {
      <div class="min-h-[500px]"></div>
    }

    <!-- CTA: se renderiza al entrar en viewport -->
    @defer (on viewport) {
      <app-lv-cta />
    } @placeholder {
      <div class="min-h-[360px]"></div>
    }

    <!-- Footer: se renderiza al entrar en viewport -->
    @defer (on viewport) {
      <app-lv-footer />
    } @placeholder {
      <div class="min-h-[80px]"></div>
    }
  `,
})
export class LandingComponent {}
