import { ChangeDetectionStrategy, Component, computed, inject, HostListener } from '@angular/core';
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
    <app-lv-navbar />
    <main [class.min-h-screen]="!isLanding()" [class.pt-20]="!isLanding()">
      <router-outlet />
    </main>
    @if (!isCheckout()) {
      <app-cart-drawer />
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

  readonly isLanding = computed(() => {
    const url = this.currentUrl();
    return url === '/' || url === '' || url.startsWith('/#');
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
