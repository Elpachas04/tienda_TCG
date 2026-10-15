import { ChangeDetectionStrategy, Component, HostListener, afterNextRender, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  selector: 'app-lv-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  host: { class: 'block' },
  template: `
    <header class="fixed inset-x-0 top-0 z-60 transition-[background-color,border-color,backdrop-filter] duration-300 border-b"
            [class]="scrolled() || !isLanding()
              ? 'bg-lv-black/85 backdrop-blur-xl border-lv-gold/[0.12]'
              : 'bg-transparent border-transparent'">
      <nav class="max-w-7xl mx-auto h-16 sm:h-[72px] px-4 sm:px-6 flex items-center justify-between gap-6" aria-label="Principal">
        <a routerLink="/" class="font-display text-[1.375rem] font-[760] tracking-[-0.04em] text-lv-cream hover:text-lv-foil transition-colors"
           style="font-variation-settings: 'opsz' 48">LayerVault</a>

        <div class="hidden md:flex items-center gap-8 text-[15px] text-lv-cream/70">
          <a routerLink="/catalog" routerLinkActive="!text-lv-cream" class="hover:text-lv-cream transition-colors">Catálogo</a>
          <a routerLink="/" fragment="colores" class="hover:text-lv-cream transition-colors">Colores</a>
          <a routerLink="/" fragment="contacto" class="hover:text-lv-cream transition-colors">Contacto</a>
          <a routerLink="/seguimiento" routerLinkActive="!text-lv-cream" class="hover:text-lv-cream transition-colors">Mis pedidos</a>
          @if (admin.authenticated()) {
            <a routerLink="/admin" routerLinkActive="!text-lv-foil" class="text-lv-gold hover:text-lv-foil transition-colors">Admin</a>
          }
        </div>

        <div class="flex items-center gap-1 sm:gap-2">
          @if (admin.authenticated()) {
            <a routerLink="/admin" class="md:hidden px-2 py-2 text-[15px] text-lv-gold hover:text-lv-foil">Admin</a>
          }
          <a routerLink="/catalog" class="md:hidden px-3 py-2 text-[15px] text-lv-cream/75 hover:text-lv-cream">Catálogo</a>
          <a routerLink="/seguimiento"
             class="md:hidden flex items-center justify-center w-11 h-11 text-lv-cream/60 hover:text-lv-cream transition-colors"
             aria-label="Mis pedidos">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/></svg>
          </a>
          @if (!isCheckout()) {
            <button type="button"
              class="relative flex items-center gap-2 h-10 pl-3.5 pr-4 rounded-full border border-lv-cream/20 text-[15px] font-semibold text-lv-cream hover:border-lv-gold hover:text-lv-foil transition-colors"
              [attr.aria-label]="'Abrir cesta, ' + cart.itemCount() + ' artículos'"
              (click)="cart.openDrawer()">
              <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"/></svg>
              <span class="hidden sm:inline">Cesta</span>
              @if (cart.itemCount() > 0) {
                <span class="lv-price min-w-[20px] h-5 px-1.5 rounded-full bg-lv-gold text-lv-black text-xs font-bold grid place-items-center [animation:badge-pop_0.35s_ease-out]">
                  {{ cart.itemCount() }}
                </span>
              }
            </button>
          }
        </div>
      </nav>
    </header>
  `,
})
export class LvNavbarComponent {
  protected cart = inject(CartService);
  protected admin = inject(AdminAuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  readonly scrolled = signal(false);

  constructor() {
    afterNextRender(() => this.admin.restore());
  }

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e: NavigationEnd) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly isLanding = computed(() => {
    const url = this.currentUrl();
    return url === '/' || url === '' || url.startsWith('/#');
  });

  readonly isCheckout = computed(() => this.currentUrl().startsWith('/checkout'));

  @HostListener('window:scroll')
  onScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.scrolled.set(window.scrollY > 24);
  }
}
