import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, untracked, viewChild } from '@angular/core';
import { EurPipe } from '../pipes/eur.pipe';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService, cartItemKey } from '../../core/services/cart.service';
import { NOTES_MAX } from '../constants';
import { FreeShippingProgressComponent } from './free-shipping-progress.component';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, EurPipe, FreeShippingProgressComponent],
  template: `
    <div class="fixed inset-0 flex justify-end"
         style="z-index:70"
         [class.pointer-events-none]="!cart.drawerOpen()"
         [attr.inert]="cart.drawerOpen() ? null : ''"
         [attr.aria-hidden]="cart.drawerOpen() ? null : 'true'"
         (keydown.escape)="cart.closeDrawer()">

      <!-- Backdrop -->
      <div class="absolute inset-0 transition-opacity duration-300"
           style="background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);"
           [class.opacity-0]="!cart.drawerOpen()"
           [class.opacity-100]="cart.drawerOpen()"
           aria-hidden="true"
           (click)="cart.closeDrawer()">
      </div>

      <!-- Panel -->
      <div #panel role="dialog" (keydown.tab)="trapFocus($event)" (keydown.shift.tab)="trapFocus($event)" aria-modal="true" aria-labelledby="cart-title" tabindex="-1"
           class="relative w-full max-w-sm h-full flex flex-col shadow-2xl transition-transform duration-300 ease-in-out border-l border-white/[0.07] bg-lv-void"
           [class.translate-x-full]="!cart.drawerOpen()"
           [class.translate-x-0]="cart.drawerOpen()">

        <!-- Header -->
        <div class="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-white/[0.07] flex-shrink-0">
          <div class="flex items-center gap-3">
            <h2 id="cart-title" class="lv-h3 text-lv-cream">Cesta</h2>
            @if (cart.itemCount() > 0) {
              <span class="bg-lv-gold text-black font-body text-[13px] font-bold px-2 py-0.5 rounded-full leading-none [animation:badge-pop_0.35s_ease-out]">
                {{ cart.itemCount() }}
              </span>
            }
          </div>
          <button
            aria-label="Cerrar cesta"
            class="w-8 h-8 flex items-center justify-center text-lv-cream/60 hover:text-lv-cream rounded-full hover:bg-white/[0.06] transition-all"
            (click)="cart.closeDrawer()">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Items -->
        <div class="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 space-y-2.5 sm:space-y-3">
          @if (cart.cartItems().length === 0) {
            <div class="flex flex-col items-center justify-center h-full gap-5 text-center py-16">
              <div class="w-16 h-16 rounded-full liquid-glass flex items-center justify-center">
                <svg class="w-7 h-7 text-lv-cream/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <div>
                <p class="font-display text-xl text-lv-cream/60 ">Cesta vacía</p>
                <p class="font-body text-xs text-lv-cream/60 mt-1">Añade algo del catálogo</p>
              </div>
              <button
                class="liquid-glass border border-lv-gold/20 text-lv-gold font-body text-[13px] rounded-full px-6 py-2.5 hover:bg-lv-gold hover:text-black transition-all duration-200"
                (click)="goToCatalog()">
                Ver catálogo
              </button>
            </div>
          } @else {
            @for (item of cart.cartItems(); track cartItemKey(item)) {
              <div class="liquid-glass rounded-[16px] p-3 sm:p-3.5 border border-white/[0.05]">
                <div class="flex gap-3 items-start">
                  <div class="flex-1 min-w-0">
                    <h3 class="font-display text-base text-lv-cream leading-tight line-clamp-1 ">{{ item.productName }}</h3>
                    <div class="flex gap-2 mt-1 flex-wrap">
                      @if (item.variant) {
                        <span class="font-body text-xs text-lv-cream/60 bg-white/[0.04] rounded-full px-2 py-0.5">{{ item.variant }}</span>
                      }
                      @if (item.color) {
                        <span class="font-body text-xs text-lv-gold bg-lv-gold/[0.06] rounded-full px-2 py-0.5">{{ item.color }}</span>
                      }
                    </div>
                    <p class="font-display text-base text-lv-gold mt-1.5 leading-none">{{ item.unitPrice | eur }}<span class="font-body text-xs text-lv-cream/60 ml-1">/ud</span></p>
                  </div>

                  <div class="flex flex-col items-end gap-2 flex-shrink-0">
                    <!-- Contador -->
                    <div class="flex items-center rounded-full overflow-hidden border border-white/[0.08]">
                      <button
                        class="w-9 h-9 flex items-center justify-center transition-colors text-sm"
                        [class]="item.quantity === 1 ? 'text-red-400/70 hover:text-red-400 hover:bg-red-500/10' : 'text-lv-cream/60 hover:text-lv-cream hover:bg-white/[0.06]'"
                        [attr.aria-label]="item.quantity === 1 ? 'Quitar ' + item.productName + ' de la cesta' : 'Quitar una unidad'"
                        (click)="cart.updateQuantity(item, item.quantity - 1)">
                        @if (item.quantity === 1) {
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        } @else { − }
                      </button>
                      <span class="w-7 text-center font-body text-[13px] font-semibold text-lv-cream">{{ item.quantity }}</span>
                      <button
                        class="w-9 h-9 flex items-center justify-center text-lv-cream/60 hover:text-lv-cream hover:bg-white/[0.06] transition-colors"
                        aria-label="Añadir una unidad"
                        (click)="cart.updateQuantity(item, item.quantity + 1)">
                        +
                      </button>
                    </div>
                    <span class="font-display text-lg text-lv-cream leading-none">{{ item.unitPrice * item.quantity | eur }}</span>
                  </div>
                </div>

                <textarea
                  class="w-full mt-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-sm font-body text-lv-cream/60 placeholder-lv-cream/45 resize-none focus:outline-none focus:border-lv-gold/30 transition-colors"
                  rows="1"
                  placeholder="Notas (acabado, detalles...)"
                  [attr.maxlength]="NOTES_MAX"
                  [ngModel]="item.notes"
                  (ngModelChange)="cart.updateNotes(item, $event)">
                </textarea>
              </div>
            }
          }
        </div>

        <!-- Footer -->
        @if (cart.cartItems().length > 0) {
          <div class="flex-shrink-0 border-t border-white/[0.07] px-4 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-4 bg-lv-void">
            <app-free-shipping-progress [subtotal]="cart.total()" />

            <div class="flex justify-between items-center">
              <div>
                <span class="font-display text-xl sm:text-2xl text-lv-cream ">Total</span>
                <span class="font-body text-xs text-lv-cream/60 ml-2">
                  {{ cart.itemCount() }} {{ cart.itemCount() === 1 ? 'artículo' : 'artículos' }}
                </span>
              </div>
              <span class="font-display text-xl sm:text-2xl text-lv-gold">{{ cart.total() | eur }}</span>
            </div>

            <button
              class="lv-btn lv-btn-primary w-full"
              (click)="goToCheckout()">
              Hacer pedido
            </button>
          </div>
        }
      </div>
    </div>
  `
})
export class CartDrawerComponent {
  cart = inject(CartService);
  private router = inject(Router);
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private returnFocus: HTMLElement | null = null;

  constructor() {
    // Al abrir, el foco entra en la cesta; al cerrar, vuelve a donde estaba (p. ej. el botón Cesta)
    effect(() => {
      const open = this.cart.drawerOpen();
      untracked(() => {
        if (typeof document === 'undefined') return;
        if (open) {
          this.returnFocus = document.activeElement as HTMLElement | null;
          setTimeout(() => this.panel().nativeElement.focus(), 50);
        } else if (this.returnFocus) {
          this.returnFocus.focus();
          this.returnFocus = null;
        }
      });
    });
  }
  protected readonly NOTES_MAX = NOTES_MAX;
  protected readonly cartItemKey = cartItemKey;

  // Tab no se escapa de la cesta abierta
  trapFocus(event: Event): void {
    const e = event as KeyboardEvent;
    const items = Array.from(this.panel().nativeElement.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], textarea, input, select, [tabindex]:not([tabindex="-1"])'));
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === this.panel().nativeElement)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  }

  goToCheckout() {
    this.cart.closeDrawer();
    this.router.navigate(['/checkout']);
  }

  goToCatalog() {
    this.cart.closeDrawer();
    this.router.navigate(['/catalog']);
  }
}
