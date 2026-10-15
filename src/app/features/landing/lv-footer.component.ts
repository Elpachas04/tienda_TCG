import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WHATSAPP_URL, CONTACT_EMAIL } from '../../shared/constants';

@Component({
  selector: 'app-lv-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  host: { class: 'block' },
  template: `
    <footer class="border-t border-lv-cream/[0.06] bg-lv-black">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-10 grid gap-10 sm:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <p class="font-display text-2xl font-[760] tracking-[-0.04em] text-lv-cream" style="font-variation-settings: 'opsz' 48">LayerVault</p>
          <p class="lv-note mt-3 max-w-xs">Accesorios para One Piece TCG impresos en 3D en Barcelona.</p>
        </div>
        <nav aria-label="Tienda" class="flex flex-col gap-2.5 text-[15px] text-lv-cream/65">
          <a routerLink="/catalog" class="hover:text-lv-cream transition-colors w-fit">Catálogo</a>
          <a routerLink="/seguimiento" class="hover:text-lv-cream transition-colors w-fit">Mis pedidos</a>
          <a [href]="whatsappUrl" target="_blank" rel="noopener noreferrer" class="hover:text-lv-cream transition-colors w-fit">WhatsApp</a>
          <a [href]="'mailto:' + contactEmail" class="hover:text-lv-cream transition-colors w-fit">{{ contactEmail }}</a>
        </nav>
        <nav aria-label="Legal" class="flex flex-col gap-2.5 text-[15px] text-lv-cream/65">
          <a routerLink="/legal" class="hover:text-lv-cream transition-colors w-fit">Aviso legal</a>
          <a routerLink="/privacidad" class="hover:text-lv-cream transition-colors w-fit">Privacidad</a>
        </nav>
      </div>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <p class="text-xs text-lv-cream/35">© 2026 LayerVault</p>
      </div>
    </footer>
  `,
})
export class LvFooterComponent {
  protected readonly whatsappUrl  = WHATSAPP_URL;
  protected readonly contactEmail = CONTACT_EMAIL;
}
