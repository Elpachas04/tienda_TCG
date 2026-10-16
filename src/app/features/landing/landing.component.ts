import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroComponent } from './hero.component';
import { LandingProductsComponent } from './landing-products.component';
import { ColorsProcessComponent } from './colors-process.component';
import { CtaComponent } from './cta.component';
import { LvFooterComponent } from './lv-footer.component';
import { ReviewsSectionComponent } from '../../shared/components/reviews-section.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeroComponent, LandingProductsComponent, ColorsProcessComponent, CtaComponent, LvFooterComponent, ReviewsSectionComponent],
  host: { class: 'block bg-lv-black text-lv-cream min-h-screen' },
  template: `
    <!-- Hero: pinta inmediatamente (LCP) -->
    <app-lv-hero />

    <!-- Productos destacados: sin @defer para que salgan en el HTML prerenderizado (enlaces a las fichas) -->
    <app-landing-products />

    <!-- Sección de colores: on idle para que el layout esté estable antes de cualquier anchor scroll -->
    @defer (on idle) {
      <app-lv-colors-process />
    } @placeholder {
      <div id="colores" class="min-h-[500px]"></div>
    }

    <!-- Valoraciones: solo aparecen si están activadas en el admin y hay alguna publicada -->
    <app-reviews-section />

    <!-- CTA/contacto: on idle por el mismo motivo -->
    @defer (on idle) {
      <app-lv-cta />
    } @placeholder {
      <div id="contacto" class="min-h-[360px]"></div>
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
