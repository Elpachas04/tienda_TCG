import { Component, computed, inject } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, RouterOutlet } from '@angular/router';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { NavbarComponent } from './shared/components/navbar.component';
import { TelegramFabComponent } from './shared/components/telegram-fab.component';
import { CartDrawerComponent } from './shared/components/cart-drawer.component';
import { CartService } from './core/services/cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, TelegramFabComponent, CartDrawerComponent],
  template: `
    @if (!isLanding()) {
      <app-navbar />
    }
    <main [class.min-h-screen]="!isLanding()">
      <router-outlet />
    </main>
    @if (!isLanding()) {
      <app-telegram-fab telegramUrl="https://t.me/Elpachas_04" />
    }
    <app-cart-drawer />
  `
})
export class AppComponent {
  private router  = inject(Router);
  private cart    = inject(CartService);

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

  constructor() {
    // Close cart drawer on every route change
    this.router.events.pipe(
      filter(e => e instanceof NavigationStart),
      takeUntilDestroyed(),
    ).subscribe(() => this.cart.closeDrawer());
  }
}
