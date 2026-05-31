import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { CartItem } from '../../core/models/cart-item.model';
import { NOTES_MAX } from '../constants';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [FormsModule],
  template: `
    <!-- Overlay container: siempre en DOM, invisible cuando cerrado -->
    <div class="fixed inset-0 z-50 flex justify-end"
         [class.pointer-events-none]="!cart.drawerOpen()">

      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 transition-opacity duration-300"
           [class.opacity-0]="!cart.drawerOpen()"
           [class.opacity-100]="cart.drawerOpen()"
           (click)="cart.closeDrawer()">
      </div>

      <!-- Panel deslizante -->
      <div class="relative w-full max-w-sm h-full bg-tcg-surface border-l border-tcg-border flex flex-col shadow-2xl transition-transform duration-300 ease-in-out"
           [class.translate-x-full]="!cart.drawerOpen()"
           [class.translate-x-0]="cart.drawerOpen()">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-tcg-border flex-shrink-0">
          <div class="flex items-center gap-3">
            <h2 class="font-display text-3xl text-tcg-gold tracking-wider leading-none">CESTA</h2>
            @if (cart.itemCount() > 0) {
              <span class="bg-tcg-gold text-black text-xs font-bold px-2 py-0.5 rounded-full font-body leading-none">
                {{ cart.itemCount() }}
              </span>
            }
          </div>
          <button
            class="w-8 h-8 flex items-center justify-center text-tcg-muted hover:text-tcg-text hover:bg-tcg-border rounded-lg transition-colors"
            (click)="cart.closeDrawer()">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Items (scrollable) -->
        <div class="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          @if (cart.cartItems().length === 0) {
            <div class="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
              <span class="text-6xl">🛒</span>
              <p class="text-tcg-muted font-body">Tu cesta está vacía</p>
              <button class="btn-gold text-sm" (click)="cart.closeDrawer()">Ver catálogo</button>
            </div>
          } @else {
            @for (item of cart.cartItems(); track itemKey(item)) {
              <div class="bg-tcg-bg rounded-card p-3 border border-tcg-border">
                <div class="flex gap-3 items-start">
                  <div class="flex-1 min-w-0">
                    <h3 class="font-display text-base text-tcg-text tracking-wide leading-tight line-clamp-1">{{ item.productName }}</h3>
                    @if (item.variant) {
                      <p class="text-[11px] text-tcg-muted font-body mt-0.5">{{ item.variant }}</p>
                    }
                    @if (item.color) {
                      <p class="text-[11px] text-tcg-muted font-body">{{ item.color }}</p>
                    }
                    <p class="text-tcg-gold font-body font-semibold text-sm mt-1">{{ item.unitPrice }}€/ud</p>
                  </div>

                  <div class="flex flex-col items-end gap-2 flex-shrink-0">
                    <div class="flex items-center border border-tcg-border rounded-lg overflow-hidden">
                      <button
                        class="w-7 h-7 flex items-center justify-center transition-colors text-sm font-bold"
                        [class]="item.quantity === 1 ? 'text-red-400 hover:bg-red-500/10' : 'text-tcg-muted hover:text-tcg-gold hover:bg-tcg-border'"
                        (click)="cart.updateQuantity(item, item.quantity - 1)">
                        @if (item.quantity === 1) {
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        } @else { − }
                      </button>
                      <span class="w-7 text-center font-body font-semibold text-tcg-text text-sm">{{ item.quantity }}</span>
                      <button
                        class="w-7 h-7 flex items-center justify-center text-tcg-muted hover:text-tcg-gold hover:bg-tcg-border transition-colors font-bold text-sm"
                        (click)="cart.updateQuantity(item, item.quantity + 1)">
                        +
                      </button>
                    </div>
                    <span class="font-display text-lg text-tcg-text">{{ (item.unitPrice * item.quantity).toFixed(2) }}€</span>
                  </div>
                </div>

                <textarea
                  class="input-field text-xs resize-none mt-2 w-full"
                  rows="2"
                  placeholder="Notas (acabado, detalles...)"
                  [attr.maxlength]="NOTES_MAX"
                  [ngModel]="item.notes"
                  (ngModelChange)="cart.updateNotes(item, $event)">
                </textarea>
              </div>
            }
          }
        </div>

        <!-- Footer: resumen + botón -->
        @if (cart.cartItems().length > 0) {
          <div class="flex-shrink-0 border-t border-tcg-border px-5 py-4 space-y-4 bg-tcg-surface">
            <div class="space-y-1.5 font-body text-sm">
              <div class="flex justify-between text-tcg-muted">
                <span>{{ cart.itemCount() }} {{ cart.itemCount() === 1 ? 'artículo' : 'artículos' }}</span>
                <span>{{ cart.total().toFixed(2) }}€</span>
              </div>
              <div class="flex justify-between text-tcg-gold font-semibold">
                <span>Depósito 50%</span>
                <span>{{ cart.deposit().toFixed(2) }}€</span>
              </div>
              <div class="flex justify-between pt-2 border-t border-tcg-border">
                <span class="font-display text-xl tracking-wide text-tcg-text">TOTAL</span>
                <span class="font-display text-xl text-tcg-gold">{{ cart.total().toFixed(2) }}€</span>
              </div>
            </div>

            <button class="btn-gold w-full text-sm" (click)="goToCheckout()">
              Hacer pedido →
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
  protected readonly NOTES_MAX = NOTES_MAX;

  itemKey(item: CartItem): string {
    return `${item.productId}|${item.variant ?? ''}|${item.color ?? ''}`;
  }

  goToCheckout() {
    this.cart.closeDrawer();
    this.router.navigate(['/checkout']);
  }
}
