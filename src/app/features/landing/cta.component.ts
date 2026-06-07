import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { TELEGRAM_URL, CONTACT_EMAIL } from '../../shared/constants';

@Component({
  selector: 'app-lv-cta',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RevealDirective],
  host: { class: 'block' },
  template: `
    <section id="contacto"
      class="relative bg-lv-black overflow-hidden flex items-center justify-center"
      style="min-height: 60vh;">

      <!-- Radial glow -->
      <div class="absolute inset-0 pointer-events-none"
           style="background: radial-gradient(ellipse at center, rgba(201,168,76,0.08) 0%, transparent 70%);">
      </div>

      <!-- Watermark -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
        <span class="font-display text-lv-cream"
              style="font-size: 20vw; opacity: 0.03; white-space: nowrap; line-height: 1;">
          LAYERVAULT
        </span>
      </div>

      <!-- Content -->
      <div class="relative z-10 flex flex-col items-center gap-5 sm:gap-6 text-center py-16 sm:py-24 lg:py-32 px-4 sm:px-6 max-w-2xl mx-auto">

        <p lvReveal class="font-body italic text-lv-gold text-lg sm:text-2xl md:text-4xl">
          ¿tienes alguna pregunta?
        </p>

        <h2 lvReveal class="font-display uppercase leading-[0.95] text-4xl sm:text-6xl md:text-8xl">
          <span class="text-lv-cream block">ESCRÍBENOS</span>
          <span class="text-lv-gold block">SIN COMPROMISO</span>
        </h2>

        <p lvReveal class="font-mono text-xs uppercase tracking-wide text-lv-cream/40 max-w-md leading-relaxed">
          Te respondemos en menos de 1 hora.<br>
          Cada pieza impresa cuando la pides, como la quieres.
        </p>

        <div lvReveal class="flex gap-4 flex-wrap justify-center">
          <a [href]="telegramUrl" target="_blank" rel="noopener noreferrer"
             class="flex items-center gap-2 bg-lv-gold text-black rounded-full px-7 sm:px-10 py-3 sm:py-4 font-mono text-xs uppercase tracking-wider font-semibold hover:brightness-110 transition-all duration-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            Preguntar por Telegram
          </a>
          <a [href]="'mailto:' + contactEmail"
             class="liquid-glass flex items-center gap-2 border border-lv-gold/30 text-lv-cream rounded-full px-7 sm:px-10 py-3 sm:py-4 font-mono text-xs uppercase tracking-wider hover:border-lv-gold transition-all duration-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/>
            </svg>
            Preguntar por email
          </a>
        </div>

        <p lvReveal class="font-mono text-[10px] uppercase tracking-widest text-lv-cream/30">
          Respuesta en menos de 1 hora · Lunes a sábado
        </p>

      </div>
    </section>
  `,
})
export class CtaComponent {
  protected readonly telegramUrl  = TELEGRAM_URL;
  protected readonly contactEmail = CONTACT_EMAIL;
}
