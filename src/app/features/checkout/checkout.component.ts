import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.model';
import { NOTES_MAX } from '../../shared/constants';

const NAME_MAX    = 100;
const CONTACT_MAX = 200;

function isValidContact(v: string): boolean {
  // Accept email or phone (min 5 chars)
  return v.length >= 5;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [FormsModule, RouterLink],
  host: { class: 'block animate-fade-up' },
  template: `
    <div class="max-w-2xl mx-auto px-4 py-10">
      @if (!orderConfirmed()) {
        <h1 class="font-display text-5xl text-tcg-gold tracking-wider mb-1">HACER PEDIDO</h1>
        <p class="text-tcg-muted font-body mb-8">Te contactamos en menos de 1 hora para confirmar.</p>

        <form name="pedido" data-netlify="true" class="space-y-5" (ngSubmit)="submitOrder()">
          <input type="hidden" name="form-name" value="pedido" />

          <div class="card p-5 space-y-4">
            <h2 class="font-display text-xl text-tcg-text tracking-wide">TUS DATOS</h2>

            <div>
              <label class="block text-xs font-body text-tcg-muted mb-1 uppercase tracking-wider">
                Nombre *
              </label>
              <input
                name="nombre"
                type="text"
                class="input-field"
                [class.border-red-500]="touched.name && !form.customerName.trim()"
                placeholder="Tu nombre completo"
                maxlength="{{ NAME_MAX }}"
                autocomplete="name"
                [(ngModel)]="form.customerName"
                (blur)="touched.name = true"
                required
              />
              @if (touched.name && !form.customerName.trim()) {
                <p class="text-red-400 text-xs font-body mt-1">El nombre es obligatorio</p>
              }
            </div>

            <div>
              <label class="block text-xs font-body text-tcg-muted mb-1 uppercase tracking-wider">
                Email o teléfono *
              </label>
              <input
                name="contacto"
                type="text"
                class="input-field"
                [class.border-red-500]="touched.contact && !isContactValid()"
                placeholder="tu@email.com o 6XX XXX XXX"
                maxlength="{{ CONTACT_MAX }}"
                autocomplete="email"
                [(ngModel)]="form.customerContact"
                (blur)="touched.contact = true"
                required
              />
              @if (touched.contact && !isContactValid()) {
                <p class="text-red-400 text-xs font-body mt-1">Introduce un email o teléfono válido</p>
              }
            </div>

            <div>
              <label class="block text-xs font-body text-tcg-muted mb-2 uppercase tracking-wider">
                Método de entrega *
              </label>
              <div class="grid grid-cols-2 gap-3">
                <button type="button"
                  class="p-4 rounded-card border-2 transition-colors text-left"
                  [class]="form.deliveryMethod === 'pickup'
                    ? 'border-tcg-gold bg-tcg-gold/10'
                    : 'border-tcg-border hover:border-tcg-gold/40'"
                  (click)="form.deliveryMethod = 'pickup'">
                  <div class="text-2xl mb-1">🤝</div>
                  <div class="font-body font-semibold text-tcg-text text-sm">En mano</div>
                  <div class="text-xs text-tcg-muted font-body">Sin coste · Barcelona</div>
                </button>
                <button type="button"
                  class="p-4 rounded-card border-2 transition-colors text-left"
                  [class]="form.deliveryMethod === 'shipping'
                    ? 'border-tcg-gold bg-tcg-gold/10'
                    : 'border-tcg-border hover:border-tcg-gold/40'"
                  (click)="form.deliveryMethod = 'shipping'">
                  <div class="text-2xl mb-1">📦</div>
                  <div class="font-body font-semibold text-tcg-text text-sm">Envío</div>
                  <div class="text-xs text-tcg-muted font-body">A acordar</div>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-body text-tcg-muted mb-1 uppercase tracking-wider">
                Notas <span class="normal-case">(opcional)</span>
              </label>
              <textarea
                name="notas"
                class="input-field resize-none"
                rows="3"
                maxlength="{{ NOTES_MAX }}"
                placeholder="Colores, detalles especiales, preferencias..."
                [(ngModel)]="form.notes">
              </textarea>
              <p class="text-right text-xs text-tcg-muted/50 font-body mt-0.5">
                {{ form.notes.length }}/{{ NOTES_MAX }}
              </p>
            </div>
          </div>

          <!-- Resumen del pedido -->
          <div class="card p-5 space-y-3">
            <h2 class="font-display text-xl text-tcg-text tracking-wide">RESUMEN</h2>
            @for (item of cartService.cartItems(); track item.productId + '|' + (item.variant ?? '') + '|' + (item.color ?? '')) {
              <div class="flex justify-between text-sm font-body text-tcg-muted">
                <span class="flex-1 pr-2">
                  {{ item.quantity }}x {{ item.productName }}
                  @if (item.variant) { <span>({{ item.variant }})</span> }
                  @if (item.color) { <span class="text-tcg-gold/70"> · {{ item.color }}</span> }
                </span>
                <span class="text-tcg-text flex-shrink-0">{{ (item.unitPrice * item.quantity).toFixed(2) }}€</span>
              </div>
            }
            <div class="pt-3 border-t border-tcg-border space-y-2">
              <div class="flex justify-between text-tcg-gold font-body font-semibold">
                <span>💳 Depósito ahora (50%)</span>
                <span>{{ cartService.deposit().toFixed(2) }}€</span>
              </div>
              <div class="flex justify-between">
                <span class="font-display text-xl text-tcg-text tracking-wide">TOTAL</span>
                <span class="font-display text-xl text-tcg-gold">{{ cartService.total().toFixed(2) }}€</span>
              </div>
            </div>
          </div>

          <!-- Política de pago -->
          <div class="border border-tcg-gold/30 bg-tcg-gold/5 rounded-card p-4 font-body text-sm">
            <p class="font-semibold text-tcg-gold mb-1">⚠️ Política de pago</p>
            <p class="text-tcg-muted text-xs">
              Tras confirmar, abona <strong class="text-tcg-text">{{ cartService.deposit().toFixed(2) }}€</strong>
              por Bizum o transferencia. El resto en la entrega. Plazo: 3-7 días laborables.
            </p>
          </div>

          @if (errorMsg()) {
            <div class="border border-red-500/50 bg-red-500/10 text-red-400 px-4 py-3 rounded-card font-body text-sm flex items-start gap-2">
              <span class="flex-shrink-0 mt-0.5">⚠️</span>
              {{ errorMsg() }}
            </div>
          }

          <button
            type="submit"
            class="btn-gold w-full py-4 text-base font-display tracking-widest"
            [disabled]="submitting() || !isFormValid()">
            @if (submitting()) {
              <span class="flex items-center justify-center gap-2">
                <span class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                ENVIANDO...
              </span>
            } @else {
              CONFIRMAR PEDIDO
            }
          </button>
        </form>

      } @else {
        <!-- Confirmación -->
        <div class="text-center py-16 space-y-6">
          <div class="text-7xl">🏴‍☠️</div>
          <h1 class="font-display text-5xl text-tcg-gold tracking-wider">¡PEDIDO RECIBIDO!</h1>
          <div class="card p-6 text-left space-y-4 max-w-md mx-auto">
            <p class="text-tcg-muted font-body text-sm">Te contactaremos en menos de 1 hora para confirmar.</p>
            <div class="border border-tcg-gold/30 bg-tcg-gold/5 rounded-card p-4 font-body text-sm space-y-2">
              <p class="font-semibold text-tcg-gold">📋 Próximos pasos:</p>
              <p class="text-tcg-muted">1. Te contactamos para confirmar detalles</p>
              <p class="text-tcg-muted">2. Abonas <strong class="text-tcg-gold">{{ confirmedDeposit().toFixed(2) }}€</strong> por Bizum/transferencia</p>
              <p class="text-tcg-muted">3. Fabricamos en 3-7 días laborables</p>
              <p class="text-tcg-muted">4. Entrega o recogida acordada</p>
            </div>
          </div>
          <a routerLink="/catalog" class="btn-gold inline-block">Seguir comprando</a>
        </div>
      }
    </div>
  `
})
export class CheckoutComponent implements OnInit {
  protected readonly NAME_MAX    = NAME_MAX;
  protected readonly CONTACT_MAX = CONTACT_MAX;
  protected readonly NOTES_MAX   = NOTES_MAX;

  cartService  = inject(CartService);
  private orderService = inject(OrderService);
  private router       = inject(Router);

  form = {
    customerName:    '',
    customerContact: '',
    deliveryMethod:  'pickup' as 'pickup' | 'shipping',
    notes:           '',
  };

  touched = { name: false, contact: false };

  submitting      = signal(false);
  orderConfirmed  = signal(false);
  errorMsg        = signal('');
  confirmedDeposit = signal(0);

  ngOnInit() {
    if (this.cartService.cartItems().length === 0) {
      this.router.navigate(['/cart']);
    }
  }

  isContactValid(): boolean {
    return isValidContact(this.form.customerContact.trim());
  }

  isFormValid(): boolean {
    return (
      this.form.customerName.trim().length > 0 &&
      this.isContactValid() &&
      this.cartService.cartItems().length > 0
    );
  }

  submitOrder() {
    this.touched = { name: true, contact: true };
    if (!this.isFormValid() || this.submitting()) return;

    this.submitting.set(true);
    this.errorMsg.set('');

    const order: Order = {
      items:           this.cartService.cartItems(),
      customerName:    this.form.customerName.trim().slice(0, NAME_MAX),
      customerContact: this.form.customerContact.trim().slice(0, CONTACT_MAX),
      deliveryMethod:  this.form.deliveryMethod,
      notes:           this.form.notes.trim().slice(0, NOTES_MAX) || undefined,
      totalAmount:     this.cartService.total(),
      depositAmount:   this.cartService.deposit(),
      timestamp:       new Date().toISOString(),
    };

    this.orderService.submitOrder(order).subscribe({
      next: () => {
        this.confirmedDeposit.set(order.depositAmount);
        this.cartService.clearCart();
        this.orderConfirmed.set(true);
        this.submitting.set(false);
      },
      error: (err: Error) => {
        this.errorMsg.set(err?.message ?? 'Error al enviar. Contacta directamente por Telegram.');
        this.submitting.set(false);
      },
    });
  }
}
