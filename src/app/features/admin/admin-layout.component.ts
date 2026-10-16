import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  host: { class: 'block animate-fade-up' },
  template: `
    <!-- Móvil: barra superior. Escritorio: menú lateral -->
    <div class="bg-lv-black min-h-screen flex flex-col md:flex-row">
      <nav class="md:w-56 flex-shrink-0 bg-lv-deep border-b md:border-b-0 md:border-r border-lv-border flex md:flex-col items-center md:items-stretch gap-2 md:gap-0 px-3 md:px-0 py-2 md:py-0 md:sticky md:top-0 md:h-screen">
        <div class="md:px-5 md:py-6 pr-2">
          <a routerLink="/" class="font-display text-lv-cream text-lg md:text-xl hover:text-lv-foil" title="Ver la tienda">LayerVault</a>
          <p class="hidden md:block font-body text-xs text-lv-gold">Admin</p>
        </div>
        <div class="flex-1 flex md:block md:px-3 gap-1 md:space-y-1">
          <a routerLink="/admin/productos" routerLinkActive="bg-lv-gold/10 text-lv-gold" #productosLink="routerLinkActive"
             class="block font-body text-[13px] rounded-xl px-3 py-2.5 transition-colors"
             [class]="productosLink.isActive ? '' : 'text-lv-muted hover:text-lv-cream hover:bg-white/[0.03]'">
            Productos
          </a>
          <a routerLink="/admin/pedidos" routerLinkActive="bg-lv-gold/10 text-lv-gold" #pedidosLink="routerLinkActive"
             class="block font-body text-[13px] rounded-xl px-3 py-2.5 transition-colors"
             [class]="pedidosLink.isActive ? '' : 'text-lv-muted hover:text-lv-cream hover:bg-white/[0.03]'">
            Pedidos
          </a>
          <a routerLink="/admin/valoraciones" routerLinkActive="bg-lv-gold/10 text-lv-gold" #reviewsLink="routerLinkActive"
             class="block font-body text-[13px] rounded-xl px-3 py-2.5 transition-colors"
             [class]="reviewsLink.isActive ? '' : 'text-lv-muted hover:text-lv-cream hover:bg-white/[0.03]'">
            Valoraciones
          </a>
        </div>
        <div class="md:px-3 md:py-4 md:border-t border-lv-border md:space-y-1">
          <a routerLink="/" class="hidden md:block font-body text-[13px] rounded-xl px-3 py-2.5 text-lv-muted hover:text-lv-cream hover:bg-white/[0.03] transition-colors">
            ← Ver la tienda
          </a>
          <button type="button"
            class="w-full text-left font-body text-[13px] rounded-xl px-3 py-2.5 text-lv-muted hover:text-red-400 hover:bg-white/[0.03] transition-colors whitespace-nowrap"
            (click)="logout()">
            Cerrar sesión
          </button>
        </div>
      </nav>
      <main class="flex-1 min-w-0 px-4 py-6 sm:px-10 sm:py-10">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
})
export class AdminLayoutComponent {
  private readonly authService = inject(AdminAuthService);
  private readonly router = inject(Router);

  async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
}
