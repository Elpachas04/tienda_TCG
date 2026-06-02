import { Component, computed, inject } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { NavbarComponent } from './shared/components/navbar.component';
import { TelegramFabComponent } from './shared/components/telegram-fab.component';
import { CartDrawerComponent } from './shared/components/cart-drawer.component';

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
  private router = inject(Router);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e: NavigationEnd) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly isLanding = computed(() => this.currentUrl() === '/');
}
