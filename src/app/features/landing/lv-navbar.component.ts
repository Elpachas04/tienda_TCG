import { Component, HostListener, inject, signal } from '@angular/core';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-lv-navbar',
  standalone: true,
  host: { class: 'block' },
  template: `
    <header class="fixed top-0 left-0 right-0 z-60 flex justify-center pt-4 px-4 pointer-events-none">
      <nav
        class="liquid-glass rounded-[32px] w-full max-w-[900px] px-8 py-4 flex items-center justify-between transition-all duration-300 pointer-events-auto"
        [style.background]="scrolled() ? 'rgba(18,18,18,0.85)' : ''"
        [style.backdrop-filter]="scrolled() ? 'blur(20px)' : 'blur(6px)'"
      >
        <span class="font-display text-lv-gold text-xl tracking-wide">LayerVault</span>

        <div class="hidden lg:flex items-center gap-8">
          <a href="#catalogo" class="font-mono text-xs uppercase tracking-widest text-lv-cream/70 hover:text-lv-gold transition-colors">Productos</a>
          <a href="#colores"  class="font-mono text-xs uppercase tracking-widest text-lv-cream/70 hover:text-lv-gold transition-colors">Colores</a>
          <a href="#colores"  class="font-mono text-xs uppercase tracking-widest text-lv-cream/70 hover:text-lv-gold transition-colors">Pedidos</a>
          <a href="#contacto" class="font-mono text-xs uppercase tracking-widest text-lv-cream/70 hover:text-lv-gold transition-colors">Contacto</a>
        </div>

        <div class="flex items-center gap-3">
          @if (cart.itemCount() > 0) {
            <span class="w-7 h-7 rounded-full bg-lv-gold text-black font-mono text-xs font-bold flex items-center justify-center">
              {{ cart.itemCount() }}
            </span>
          }
          <a href="#contacto"
             class="liquid-glass border border-lv-gold/30 font-mono text-xs uppercase tracking-widest text-lv-gold px-5 py-2 rounded-full hover:bg-lv-gold hover:text-black transition-all duration-200">
            Pedir ahora
          </a>
        </div>
      </nav>
    </header>
  `,
})
export class LvNavbarComponent {
  protected cart = inject(CartService);
  readonly scrolled = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 50);
  }
}
