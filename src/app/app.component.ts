import { Component, inject } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from './shared/components/navbar.component';
import { TelegramFabComponent } from './shared/components/telegram-fab.component';
import { CartDrawerComponent } from './shared/components/cart-drawer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, TelegramFabComponent, CartDrawerComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="min-h-screen">
      <router-outlet></router-outlet>
    </main>
    <app-telegram-fab telegramUrl="https://t.me/Elpachas_04"></app-telegram-fab>
    <app-cart-drawer></app-cart-drawer>
  `
})
export class AppComponent {
  constructor() {
    const router = inject(Router);
    router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => window.scrollTo(0, 0));
  }
}
