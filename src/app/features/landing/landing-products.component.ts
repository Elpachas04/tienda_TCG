import {
  ChangeDetectionStrategy, Component, inject, signal, PLATFORM_ID,
  AfterViewInit, OnDestroy, ElementRef, viewChild
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { LvProductCardComponent } from './lv-product-card.component';
import { CartItem } from '../../core/models/cart-item.model';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-landing-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LvProductCardComponent, RevealDirective],
  host: { class: 'block' },
  template: `
    <section class="bg-lv-black border-t border-lv-gold/[0.08] py-16 sm:py-24 px-4 sm:px-6">
      <div class="max-w-[1400px] mx-auto">

        <!-- Header -->
        <div lvReveal class="flex items-baseline justify-between mb-10 sm:mb-14">
          <div>
            <p class="font-mono text-[10px] uppercase tracking-[0.35em] text-lv-gold/60 mb-3">— Colección</p>
            <h2 class="font-display uppercase leading-[0.9] text-lv-cream"
                style="font-size: clamp(2.4rem, 6vw, 5rem)">ARMERÍA TCG</h2>
          </div>
          <a routerLink="/catalog"
             class="font-mono text-[10px] uppercase tracking-widest text-lv-gold/70 hover:text-lv-gold transition-colors hidden sm:block">
            Ver todo →
          </a>
        </div>

        <!-- Desktop: grid 3 columnas -->
        <div class="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (p of featured(); track p.id; let i = $index) {
            <app-lv-product-card
              [product]="p"
              [colors]="colors"
              [delay]="(i * 60) + 'ms'"
              (added)="onAdd($event)">
            </app-lv-product-card>
          }
        </div>

        <!-- Mobile: carrusel -->
        <div class="sm:hidden">
          <div class="overflow-hidden" #carouselWrapper>
            <div class="flex transition-transform duration-350 ease-out"
                 #carouselTrack
                 (touchstart)="onTouchStart($event)"
                 (touchend)="onTouchEnd($event)">

              @for (p of featured(); track p.id) {
                <div class="min-w-full pr-0">
                  <app-lv-product-card
                    [product]="p"
                    [colors]="colors"
                    (added)="onAdd($event)">
                  </app-lv-product-card>
                </div>
              }

              <!-- Slide "Ver todo" -->
              <div class="min-w-full pr-0">
                <a routerLink="/catalog"
                   class="flex flex-col items-center justify-center gap-4 rounded-card border border-lv-gold
                          min-h-[260px] transition-colors hover:bg-lv-gold/5">
                  <span class="font-display text-5xl text-lv-gold leading-none">→</span>
                  <span class="font-display text-2xl tracking-widest text-lv-gold">VER TODO</span>
                </a>
              </div>

            </div>
          </div>

          <!-- Dots -->
          <div class="flex justify-center gap-2 mt-5">
            @for (dot of dots(); track $index; let i = $index) {
              <button
                class="w-1.5 h-1.5 rounded-full transition-all duration-200"
                [class]="currentSlide() === i ? 'bg-lv-gold w-4' : 'bg-lv-border'"
                (click)="goTo(i)">
              </button>
            }
          </div>
        </div>

        <!-- Ver todo link móvil -->
        <div class="sm:hidden mt-6 text-center">
          <a routerLink="/catalog"
             class="font-mono text-[10px] uppercase tracking-widest text-lv-gold/70 hover:text-lv-gold transition-colors">
            Ver catálogo completo →
          </a>
        </div>

      </div>
    </section>
  `,
})
export class LandingProductsComponent implements AfterViewInit, OnDestroy {
  private catalog = inject(CatalogService);
  private cart    = inject(CartService);
  private platformId = inject(PLATFORM_ID);

  private trackEl = viewChild<ElementRef<HTMLElement>>('carouselTrack');

  readonly colors   = [...this.catalog.colors];
  readonly featured = signal(this.catalog.products.slice(0, 3));
  readonly currentSlide = signal(0);
  // 3 productos + 1 "Ver todo"
  readonly dots = signal(Array(4).fill(0));

  private touchStartX = 0;

  ngAfterViewInit() {
    this.updateTrack();
  }

  ngOnDestroy() {}

  onAdd(item: CartItem) {
    this.cart.addItem(item);
  }

  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.touches[0].clientX;
  }

  onTouchEnd(e: TouchEvent) {
    const diff = this.touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 40) return;
    diff > 0 ? this.goTo(this.currentSlide() + 1) : this.goTo(this.currentSlide() - 1);
  }

  goTo(idx: number) {
    const max = this.dots().length - 1;
    this.currentSlide.set(Math.max(0, Math.min(idx, max)));
    this.updateTrack();
  }

  private updateTrack() {
    if (!isPlatformBrowser(this.platformId)) return;
    const track = this.trackEl()?.nativeElement;
    if (!track) return;
    track.style.transform = `translateX(-${this.currentSlide() * 100}%)`;
  }
}
