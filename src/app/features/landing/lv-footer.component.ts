import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TELEGRAM_URL, CONTACT_EMAIL } from '../../shared/constants';

@Component({
  selector: 'app-lv-footer',
  standalone: true,
  imports: [RouterLink],
  host: { class: 'block' },
  template: `
    <footer class="border-t border-lv-gold/10 py-8 px-6">
      <div class="max-w-[1600px] mx-auto flex items-center justify-between flex-wrap gap-4">

        <div class="flex items-center">
          <span class="font-display text-lv-gold text-lg">LayerVault</span>
          <span class="font-mono text-[10px] uppercase tracking-wider text-lv-cream/30 ml-3">2026</span>
        </div>

        <div class="flex items-center gap-4">
          <p class="font-mono text-[10px] uppercase tracking-wider text-lv-cream/20">
            Impresión 3D artesanal · PLA Basic · Por encargo
          </p>
          <span class="text-lv-cream/10">·</span>
          <a routerLink="/legal" class="font-mono text-[10px] uppercase tracking-wider text-lv-cream/20 hover:text-lv-gold transition-colors">Legal</a>
          <a routerLink="/privacidad" class="font-mono text-[10px] uppercase tracking-wider text-lv-cream/20 hover:text-lv-gold transition-colors">Privacidad</a>
        </div>

        <div class="flex gap-2">
          <a [href]="telegramUrl" target="_blank" rel="noopener noreferrer"
             class="liquid-glass rounded-full p-3 text-lv-cream/50 hover:text-lv-gold border border-transparent hover:border-lv-gold/40 transition-all duration-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </a>
          <a [href]="'mailto:' + contactEmail"
             class="liquid-glass rounded-full p-3 text-lv-cream/50 hover:text-lv-gold border border-transparent hover:border-lv-gold/40 transition-all duration-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/>
            </svg>
          </a>
        </div>

      </div>
    </footer>
  `,
})
export class LvFooterComponent {
  protected readonly telegramUrl  = TELEGRAM_URL;
  protected readonly contactEmail = CONTACT_EMAIL;
}
