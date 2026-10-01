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
    <div class="bg-lv-black min-h-screen flex">
      <nav class="w-56 flex-shrink-0 bg-lv-deep border-r border-lv-border flex flex-col">
        <div class="px-5 py-6">
          <p class="font-display uppercase text-lv-cream text-xl tracking-wide">LayerVault</p>
          <p class="font-mono text-[10px] uppercase tracking-widest text-lv-gold/60">Admin</p>
        </div>
        <div class="flex-1 px-3 space-y-1">
          <a routerLink="/admin/productos" routerLinkActive="bg-lv-gold/10 text-lv-gold" #productosLink="routerLinkActive"
             class="block font-mono text-xs uppercase tracking-wider rounded-xl px-3 py-2.5 transition-colors"
             [class]="productosLink.isActive ? '' : 'text-lv-muted hover:text-lv-cream hover:bg-white/[0.03]'">
            Productos
          </a>
          <a routerLink="/admin/pedidos" routerLinkActive="bg-lv-gold/10 text-lv-gold" #pedidosLink="routerLinkActive"
             class="block font-mono text-xs uppercase tracking-wider rounded-xl px-3 py-2.5 transition-colors"
             [class]="pedidosLink.isActive ? '' : 'text-lv-muted hover:text-lv-cream hover:bg-white/[0.03]'">
            Pedidos
          </a>
        </div>
        <div class="px-3 py-4 border-t border-lv-border">
          <button type="button"
            class="w-full text-left font-mono text-xs uppercase tracking-wider rounded-xl px-3 py-2.5 text-lv-muted hover:text-red-400 hover:bg-white/[0.03] transition-colors"
            (click)="logout()">
            Cerrar sesión
          </button>
        </div>
      </nav>
      <main class="flex-1 min-w-0 px-6 py-8 sm:px-10 sm:py-10">
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
