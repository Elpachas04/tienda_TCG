import { Component, computed, inject, HostListener } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { LvNavbarComponent } from './features/landing/lv-navbar.component';
import { TelegramFabComponent } from './shared/components/telegram-fab.component';
import { CartDrawerComponent } from './shared/components/cart-drawer.component';
import { TELEGRAM_URL } from './shared/constants';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LvNavbarComponent, TelegramFabComponent, CartDrawerComponent],
  template: `
    <app-lv-navbar />
    <main [class.min-h-screen]="!isLanding()" [class.pt-20]="!isLanding()">
      <router-outlet />
    </main>
    @if (!isLanding() && !isCheckout()) {
      <app-telegram-fab [telegramUrl]="telegramUrl" />
    }
    @if (!isCheckout()) {
      <app-cart-drawer />
    }
  `
})
export class AppComponent {
  protected readonly telegramUrl = TELEGRAM_URL;
  private router = inject(Router);

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
