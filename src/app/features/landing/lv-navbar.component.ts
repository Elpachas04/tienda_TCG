import { Component, HostListener, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-lv-navbar',
  standalone: true,
  imports: [RouterLink],
  host: { class: 'block' },
  template: `
    <header class="fixed top-0 left-0 right-0 z-60 flex justify-center pt-3 sm:pt-4 px-3 sm:px-4 pointer-events-none">
      <nav
        class="liquid-glass rounded-[24px] sm:rounded-[32px] w-full max-w-[900px] px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between transition-all duration-300 pointer-events-auto"
        [style.background]="scrolled() ? 'rgba(18,18,18,0.85)' : ''"
        [style.backdrop-filter]="scrolled() ? 'blur(20px)' : 'blur(6px)'"
      >
        <a routerLink="/" class="font-display text-lv-gold text-base sm:text-xl tracking-wide hover:opacity-80 transition-opacity flex-shrink-0">LayerVault</a>

        <div class="hidden lg:flex items-center gap-8">
          @if (isLanding()) {
            <a routerLink="/catalog"    class="font-mono text-xs uppercase tracking-widest text-lv-cream/70 hover:text-lv-gold transition-colors">Productos</a>
            <a routerLink="/" fragment="colores"  class="font-mono text-xs uppercase tracking-widest text-lv-cream/70 hover:text-lv-gold transition-colors">Colores</a>
            <a routerLink="/" fragment="contacto" class="font-mono text-xs uppercase tracking-widest text-lv-cream/70 hover:text-lv-gold transition-colors">Contacto</a>
          } @else {
            <a routerLink="/catalog"    class="font-mono text-xs uppercase tracking-widest text-lv-cream/70 hover:text-lv-gold transition-colors">Catálogo</a>
          }
          <a routerLink="/seguimiento" class="font-mono text-xs uppercase tracking-widest text-lv-cream/70 hover:text-lv-gold transition-colors">Mis pedidos</a>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">
          <a routerLink="/seguimiento"
             class="lg:hidden flex items-center justify-center w-8 h-8 text-lv-cream/50 hover:text-lv-gold transition-colors"
             title="Mis pedidos">
            📦
          </a>
          @if (!isCheckout() && cart.itemCount() > 0) {
            <button type="button"
              [attr.aria-label]="'Ver cesta — ' + cart.itemCount() + ' artículos'"
              class="w-8 h-8 rounded-full bg-lv-gold text-black font-mono text-xs font-bold flex items-center justify-center hover:brightness-110 transition-all [animation:badge-pop_0.35s_ease-out] flex-shrink-0"
              (click)="cart.openDrawer()">
              {{ cart.itemCount() }}
            </button>
          }
          @if (!isCheckout()) {
            <button type="button"
              class="liquid-glass border border-lv-gold/30 font-mono text-xs uppercase tracking-widest text-lv-gold px-3 sm:px-5 py-2 rounded-full hover:bg-lv-gold hover:text-black transition-all duration-200 whitespace-nowrap"
              (click)="onOrderClick()">
              <span class="hidden sm:inline">Pedir ahora</span>
              <span class="sm:hidden">Pedir</span>
            </button>
          }
        </div>
      </nav>
    </header>
  `,
})
export class LvNavbarComponent {
  protected cart = inject(CartService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  readonly scrolled = signal(false);

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
    return url === '/' || url === '';
  });

  readonly isCheckout = computed(() => this.currentUrl().startsWith('/checkout'));

  @HostListener('window:scroll')
  onScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.scrolled.set(window.scrollY > 50);
  }

  onOrderClick(): void {
    if (this.cart.itemCount() > 0) {
      this.cart.closeDrawer();
      this.router.navigate(['/checkout']);
    } else {
      this.router.navigate(['/catalog']);
    }
  }
}
