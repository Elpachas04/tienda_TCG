import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar.component';
import { TelegramFabComponent } from './shared/components/telegram-fab.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, TelegramFabComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="min-h-screen">
      <router-outlet></router-outlet>
    </main>
    <app-telegram-fab telegramUrl="https://t.me/Elpachas_04"></app-telegram-fab>
  `
})
export class AppComponent {}
