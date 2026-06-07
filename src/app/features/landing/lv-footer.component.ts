import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lv-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  host: { class: 'block' },
  template: `
    <footer class="border-t border-lv-gold/10 py-6 px-4 sm:px-6 pb-24 sm:pb-8">
      <div class="max-w-[1600px] mx-auto flex flex-wrap items-center gap-x-6 gap-y-2">

        <span class="font-display text-lv-gold text-base">LayerVault</span>
        <span class="font-mono text-[10px] uppercase tracking-wider text-lv-cream/25">2026</span>
        <span class="font-mono text-[10px] uppercase tracking-wider text-lv-cream/20 hidden sm:inline">· Impresión 3D · Por encargo</span>
        <a routerLink="/legal"      class="font-mono text-[10px] uppercase tracking-wider text-lv-cream/25 hover:text-lv-gold transition-colors">Legal</a>
        <a routerLink="/privacidad" class="font-mono text-[10px] uppercase tracking-wider text-lv-cream/25 hover:text-lv-gold transition-colors">Privacidad</a>

      </div>
    </footer>
  `,
})
export class LvFooterComponent {}
