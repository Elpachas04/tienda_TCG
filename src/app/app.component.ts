import { ChangeDetectionStrategy, Component, computed, inject, HostListener, signal, afterNextRender } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { LvNavbarComponent } from './features/landing/lv-navbar.component';
import { CartDrawerComponent } from './shared/components/cart-drawer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, LvNavbarComponent, CartDrawerComponent],
  template: `
    <div class="h-8 overflow-hidden flex items-center"
         style="background:rgba(201,168,76,0.07);border-bottom:1px solid rgba(201,168,76,0.14)">
      <div class="flex whitespace-nowrap animate-marquee" aria-hidden="true">
        @for (i of bannerItems; track i) {
          <span class="font-mono text-[10px] uppercase tracking-[0.25em] text-lv-gold/75 px-24">
            ENVÍO GRATIS EN PEDIDOS SUPERIORES A 50€
          </span>
        }
      </div>
    </div>

    <app-lv-navbar />
    <main [class.min-h-screen]="!isLanding()" [class.pt-28]="!isLanding()">
      <router-outlet />
    </main>
    @if (!isCheckout()) {
      <app-cart-drawer />
    }

    @if (showBerryModal()) {
      <div class="fixed inset-0 z-[999] flex items-center justify-center px-4"
           style="background:rgba(0,0,0,0.78);backdrop-filter:blur(6px);animation:overlay-in 220ms ease-out both">
        <div class="bg-lv-surface border border-lv-border rounded-[24px] p-8 flex flex-col items-center gap-5 max-w-xs w-full text-center"
             style="animation:modal-pop 380ms cubic-bezier(0.34,1.56,0.64,1) both">
          <img src="https://res.cloudinary.com/dew1whfdu/image/upload/v1781902915/berrycoin.png"
               alt="₿erry" width="120" height="120"
               class="w-[120px] h-[120px] object-contain select-none" draggable="false"
               style="animation:coin-drop 520ms cubic-bezier(0.34,1.56,0.64,1) 80ms both" />
          <div style="animation:fade-up 300ms ease-out 200ms both">
            <h2 class="font-display text-4xl text-lv-gold uppercase tracking-wide">ENVÍO GRATIS</h2>
            <p class="font-mono text-xs uppercase tracking-wide text-lv-cream/50 mt-2 leading-relaxed">
              Tu ₿erry está activa. El envío de tu pedido corre por nuestra cuenta.
            </p>
          </div>
          <button type="button"
            class="bg-lv-gold text-black font-mono text-xs uppercase tracking-widest font-semibold rounded-full px-8 py-3 hover:brightness-110 transition-all duration-200"
            style="animation:fade-up 300ms ease-out 320ms both"
            (click)="closeBerryModal()">
            ¡A LA TIENDA!
          </button>
        </div>
      </div>
    }
  `
})
export class AppComponent {
  private router = inject(Router);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e: NavigationEnd) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly isLanding  = computed(() => {
    const url = this.currentUrl();
    return url === '/' || url === '' || url.startsWith('/#');
  });
  readonly isCheckout = computed(() => this.currentUrl().startsWith('/checkout'));

  readonly showBerryModal = signal(false);
  readonly bannerItems = Array(14).fill(0);

  constructor() {
    afterNextRender(() => {
      const checkBerry = () => {
        if (sessionStorage.getItem('berry_active') === 'true' &&
            !sessionStorage.getItem('berry_shown')) {
          this.showBerryModal.set(true);
        }
      };
      checkBerry();
      this.router.events.pipe(filter(e => e instanceof NavigationEnd))
        .subscribe(() => checkBerry());
    });
  }

  closeBerryModal(): void {
    sessionStorage.setItem('berry_shown', 'true');
    this.showBerryModal.set(false);
  }

  @HostListener('document:contextmenu', ['$event'])
  onContextMenu(e: MouseEvent): void {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'IMG' || tag === 'VIDEO') e.preventDefault();
  }

  @HostListener('document:dragstart', ['$event'])
  onDragStart(e: DragEvent): void {
    if ((e.target as HTMLElement).tagName === 'IMG') e.preventDefault();
  }
}
