import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { FoilCardComponent } from '../../shared/components/foil-card.component';
import { CloudinaryService } from '../../core/services/cloudinary.service';

@Component({
  selector: 'app-lv-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RevealDirective, RouterLink, FoilCardComponent],
  host: { class: 'block' },
  template: `
    <section id="hero"
      class="relative min-h-screen flex items-center px-4 sm:px-6 pt-32 sm:pt-36 pb-16 sm:pb-24 bg-lv-black overflow-hidden">

      <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
           style="background: radial-gradient(70% 90% at 72% 45%, #19160e 0%, #0a0a0a 60%);"></div>

      <!-- Móvil: titular → tarjeta → botones. Escritorio: texto a la izquierda, tarjeta a la derecha -->
      <div class="relative z-10 w-full max-w-7xl mx-auto grid gap-10 lg:gap-x-16 lg:grid-cols-[1.4fr_1fr] items-center text-center lg:text-left">

        <div class="flex flex-col items-center lg:items-start gap-6 lg:col-start-1 lg:row-start-1 lg:self-end">
          <p lvReveal class="font-body text-[13px] text-lv-gold">
            Bajo demanda · One Piece TCG
          </p>

          <h1 lvReveal
              class="font-display leading-[0.95] text-[44px] sm:text-[64px] md:text-[84px] lg:text-[84px] xl:text-[100px]">
            <span class="text-lv-cream block">LA PRIMERA CARTA</span>
            <span class="text-lv-cream block">QUE VEN ES</span>
            <span class="text-lv-gold block">TU CAJA.</span>
          </h1>

          <p lvReveal class="font-display text-lv-cream/70 text-xl sm:text-2xl md:text-4xl ">
            No les decepciones.
          </p>
        </div>

        <lv-foil-card class="lg:col-start-2 lg:row-start-1 lg:row-span-2"
          name="Leader Vault"
          [price]="50"
          [image]="leaderVaultImage" />

        <div class="flex flex-col items-center lg:items-start gap-6 lg:col-start-1 lg:row-start-2 lg:self-start">
          <p lvReveal class="font-body text-[13px] text-lv-cream/50 max-w-md leading-relaxed">
            Accesorios TCG hechos a medida, en el color de tu facción.<br>
            Sin stock masivo.
          </p>

          <div lvReveal class="flex gap-4 flex-wrap justify-center lg:justify-start">
            <a routerLink="/catalog"
               class="bg-lv-gold text-black rounded-full px-6 sm:px-8 py-3 sm:py-4 font-body text-[13px] font-semibold hover:brightness-110 transition-all duration-200">
              Quiero el mío
            </a>
            <a href="#colores"
               class="border border-lv-gold/30 text-lv-cream rounded-full px-6 sm:px-8 py-3 sm:py-4 font-body text-[13px] hover:border-lv-gold transition-all duration-200">
              Ver colores →
            </a>
          </div>

          <p lvReveal class="font-body text-xs text-lv-cream/25">
            UNO A UNO &nbsp;·&nbsp; A TU COLOR &nbsp;·&nbsp; SIN COMPROMISOS
          </p>
        </div>

      </div>
    </section>
  `,
})
export class HeroComponent {
  readonly leaderVaultImage = inject(CloudinaryService).detail('leader-vault_yamato_01');
}
