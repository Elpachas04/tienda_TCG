import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { WHATSAPP_URL, CONTACT_EMAIL } from '../../shared/constants';

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
          <a [href]="whatsappUrl" target="_blank" rel="noopener noreferrer"
             class="flex items-center gap-2 bg-lv-gold text-black rounded-full px-7 sm:px-10 py-3 sm:py-4 font-mono text-xs uppercase tracking-wider font-semibold hover:brightness-110 transition-all duration-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
            WhatsApp · 644 794 412
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
  protected readonly whatsappUrl  = WHATSAPP_URL;
  protected readonly contactEmail = CONTACT_EMAIL;
}
