import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { CartItem } from '../../core/models/cart-item.model';
import { NOTES_MAX } from '../../shared/constants';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-10">
      <h1 class="font-display text-5xl text-tcg-gold tracking-wider mb-8">TU CESTA</h1>

      @if (cartService.cartItems().length === 0) {
        <div class="text-center py-20 space-y-5">
          <div class="text-7xl">🛒</div>
          <p class="text-tcg-muted font-body text-lg">Tu cesta está vacía</p>
          <a routerLink="/catalog" class="btn-gold inline-block">Ver catálogo</a>
        </div>
      } @else {
        <div class="space-y-3 mb-8">
          @for (item of cartService.cartItems(); track itemKey(item)) {
            <div class="card p-4">
              <div class="flex gap-4 items-start">
                <div class="flex-1 min-w-0">
                  <h3 class="font-display text-lg text-tcg-text tracking-wide leading-tight">{{ item.productName }}</h3>
                  @if (item.variant) {
                    <p class="text-xs text-tcg-muted font-body mt-0.5">Variante: {{ item.variant }}</p>
                  }
                  @if (item.color) {
                    <p class="text-xs text-tcg-muted font-body">Color: {{ item.color }}</p>
                  }
                  <p class="text-tcg-gold font-body font-semibold mt-1">{{ item.unitPrice }}€/ud</p>
                </div>

                <div class="flex flex-col items-end gap-2 flex-shrink-0">
                  <div class="flex items-center gap-1 border border-tcg-border rounded-lg overflow-hidden">
                    <button
                      class="w-8 h-8 flex items-center justify-center text-tcg-muted hover:text-tcg-gold hover:bg-tcg-border transition-colors font-bold"
                      aria-label="Reducir cantidad"
                      (click)="cartService.updateQuantity(item, item.quantity - 1)">
                      −
                    </button>
                    <span class="w-8 text-center font-body font-semibold text-tcg-text text-sm">{{ item.quantity }}</span>
                    <button
                      class="w-8 h-8 flex items-center justify-center text-tcg-muted hover:text-tcg-gold hover:bg-tcg-border transition-colors font-bold"
                      aria-label="Aumentar cantidad"
                      (click)="cartService.updateQuantity(item, item.quantity + 1)">
                      +
                    </button>
                  </div>
                  <span class="font-display text-xl text-tcg-text">{{ (item.unitPrice * item.quantity).toFixed(2) }}€</span>
                  <button
                    class="text-xs text-tcg-muted hover:text-red-400 font-body transition-colors"
                    aria-label="Eliminar artículo"
                    (click)="cartService.removeItem(item)">
                    Eliminar
                  </button>
                </div>
              </div>

              <div class="mt-3 pt-3 border-t border-tcg-border">
                <textarea
                  class="input-field text-sm resize-none"
                  rows="2"
                  placeholder="Notas para este artículo (acabado, detalles...)"
                  [attr.maxlength]="NOTES_MAX"
                  [ngModel]="item.notes"
                  (ngModelChange)="cartService.updateNotes(item, $event)">
                </textarea>
              </div>
            </div>
          }
        </div>

        <div class="card p-5 space-y-5">
          <div class="border border-tcg-gold/30 bg-tcg-gold/5 rounded-card p-4 text-sm font-body">
            <p class="font-semibold text-tcg-gold mb-2">⚠️ Se requiere el 50% de depósito para confirmar</p>
            <ul class="space-y-1 text-tcg-muted text-xs">
              <li>• Pago por Bizum o Transferencia bancaria</li>
              <li>• El resto se abona en la entrega</li>
              <li>• Plazo de fabricación: 3-7 días laborables</li>
            </ul>
          </div>

          <div class="space-y-2 font-body">
            <div class="flex justify-between text-tcg-muted text-sm">
              <span>{{ cartService.itemCount() }} {{ cartService.itemCount() === 1 ? 'artículo' : 'artículos' }}</span>
              <span>{{ cartService.total().toFixed(2) }}€</span>
            </div>
            <div class="flex justify-between text-tcg-gold font-semibold">
              <span>Depósito 50%</span>
              <span>{{ cartService.deposit().toFixed(2) }}€</span>
            </div>
            <div class="flex justify-between text-tcg-text pt-2 border-t border-tcg-border">
              <span class="font-display text-2xl tracking-wide">TOTAL</span>
              <span class="font-display text-2xl text-tcg-gold">{{ cartService.total().toFixed(2) }}€</span>
            </div>
          </div>

          <div class="flex gap-3">
            <a routerLink="/catalog" class="btn-outline flex-1 text-center text-sm">← Seguir comprando</a>
            <a routerLink="/checkout" class="btn-gold flex-1 text-center text-sm">Hacer pedido →</a>
          </div>
        </div>
      }
    </div>
  `
})
export class CartComponent {
  cartService = inject(CartService);
  protected readonly NOTES_MAX = NOTES_MAX;

  itemKey(item: CartItem): string {
    return `${item.productId}|${item.variant ?? ''}|${item.color ?? ''}`;
  }
}
