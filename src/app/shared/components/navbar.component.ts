import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="sticky top-0 z-40 bg-tcg-surface border-b border-tcg-border">
      <div class="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <a routerLink="/" class="font-display text-2xl text-tcg-gold tracking-wider hover:opacity-80 transition-opacity">
          TCG 3D SHOP
        </a>

        <div class="flex items-center gap-4">
          <a routerLink="/catalog" routerLinkActive="text-tcg-gold"
             class="hidden sm:block text-tcg-muted hover:text-tcg-text font-body font-medium transition-colors text-sm">
            Catálogo
          </a>

          <a routerLink="/cart" class="relative flex items-center gap-2 bg-tcg-gold hover:bg-yellow-500 text-black font-body font-semibold px-4 py-2 rounded-lg transition-colors text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            Cesta
            @if (cartService.itemCount() > 0) {
              <span class="absolute -top-2 -right-2 bg-tcg-bg text-tcg-gold border border-tcg-gold text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {{ cartService.itemCount() }}
              </span>
            }
          </a>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  cartService = inject(CartService);
}
