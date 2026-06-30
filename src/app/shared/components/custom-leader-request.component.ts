import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CatalogService } from '../../core/services/catalog.service';

@Component({
  selector: 'app-custom-leader-request',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a [href]="waUrl"
       target="_blank"
       rel="noopener noreferrer"
       class="inline-flex items-center gap-1.5 mt-3 font-mono text-[10px] uppercase tracking-wider text-lv-cream/40 hover:text-lv-gold transition-colors duration-200">
      ¿No está tu Líder? Pídelo a medida
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
      </svg>
    </a>
  `
})
export class CustomLeaderRequestComponent {
  private catalog = inject(CatalogService);

  get waUrl(): string {
    const phone = this.catalog.settings.whatsappPhone;
    const normalized = phone.startsWith('34') ? phone : `34${phone}`;
    const msg = encodeURIComponent('Hola! Quiero un Leader Vault personalizado. Mi líder es: ');
    return `https://wa.me/${normalized}?text=${msg}`;
  }
}
