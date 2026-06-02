import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.model';
import { NOTES_MAX } from '../../shared/constants';

const NAME_MAX    = 100;
const CONTACT_MAX = 200;

const INPUT_BASE = [
  'w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3',
  'font-body text-sm text-lv-cream placeholder-lv-cream/20',
  'focus:outline-none focus:border-lv-gold/40 transition-colors',
].join(' ');

function isValidContact(v: string): boolean {
  return v.length >= 5;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [FormsModule, RouterLink],
  host: { class: 'block animate-fade-up' },
  template: `
    <div class="bg-grid-premium min-h-screen relative">
      <div class="absolute -top-40 -right-40 w-[500px] h-[500px] bg-[#C9A84C]/[0.04] rounded-full blur-[120px] animate-aurora pointer-events-none"></div>

      <div class="max-w-2xl mx-auto px-6 py-16 relative" style="z-index:1">

        @if (!orderConfirmed()) {

          <!-- Header -->
          <div class="mb-10">
            <p class="font-mono text-xs uppercase tracking-[0.35em] text-lv-gold/60 mb-4">— Confirmación de pedido</p>
            <h1 class="font-display uppercase leading-none">
              <span class="block text-lv-cream" style="font-size:clamp(2rem,6vw,3.5rem)">CONFIGURACIÓN INSTANTÁNEA</span>
              <span class="block text-lv-gold" style="font-size:clamp(2rem,6vw,3.5rem)">LÍNEA DIRECTA CON EL TALLER</span>
            </h1>
            <p class="font-mono text-xs text-lv-cream/30 mt-4 leading-relaxed max-w-lg">
              En cuanto confirmas, compilamos las especificaciones exactas de color y dimensiones
              y las enviamos de forma automatizada a producción. Sin intermediarios, sin retrasos.
            </p>
          </div>

          <form name="pedido" data-netlify="true" class="space-y-4" (ngSubmit)="submitOrder()">
            <input type="hidden" name="form-name" value="pedido" />

            <!-- Datos del cliente -->
            <div class="liquid-glass rounded-[20px] p-6 border border-white/[0.05] space-y-5">
              <h2 class="font-display text-2xl text-lv-cream tracking-wide uppercase">Tus datos</h2>

              <div>
                <label class="block font-mono text-[10px] uppercase tracking-widest text-lv-cream/40 mb-2">
                  Nombre *
                </label>
                <input
                  name="nombre"
                  type="text"
                  [class]="inputClass(touched.name && !form.customerName.trim())"
                  placeholder="Tu nombre completo"
                  maxlength="{{ NAME_MAX }}"
                  autocomplete="name"
                  [(ngModel)]="form.customerName"
                  (blur)="touched.name = true"
                  required
                />
                @if (touched.name && !form.customerName.trim()) {
                  <p class="text-red-400/80 font-mono text-[10px] uppercase tracking-wider mt-1.5">El nombre es obligatorio</p>
                }
              </div>

              <div>
                <label class="block font-mono text-[10px] uppercase tracking-widest text-lv-cream/40 mb-2">
                  Email o teléfono *
                </label>
                <input
                  name="contacto"
                  type="text"
                  [class]="inputClass(touched.contact && !isContactValid())"
                  placeholder="tu@email.com o 6XX XXX XXX"
                  maxlength="{{ CONTACT_MAX }}"
                  autocomplete="email"
                  [(ngModel)]="form.customerContact"
                  (blur)="touched.contact = true"
                  required
                />
                @if (touched.contact && !isContactValid()) {
                  <p class="text-red-400/80 font-mono text-[10px] uppercase tracking-wider mt-1.5">Introduce un email o teléfono válido</p>
                }
              </div>

              <div>
                <label class="block font-mono text-[10px] uppercase tracking-widest text-lv-cream/40 mb-3">
                  Método de entrega *
                </label>
                <div class="grid grid-cols-2 gap-3">
                  <button type="button"
                    class="p-4 rounded-[16px] border-2 transition-all duration-200 text-left"
                    [class]="form.deliveryMethod === 'pickup'
                      ? 'border-lv-gold bg-lv-gold/[0.08]'
                      : 'border-white/[0.06] hover:border-lv-gold/30 bg-white/[0.02]'"
                    (click)="form.deliveryMethod = 'pickup'">
                    <div class="text-2xl mb-2">🤝</div>
                    <div class="font-display text-base text-lv-cream tracking-wide">EN MANO</div>
                    <div class="font-mono text-[10px] text-lv-cream/30 uppercase tracking-wider mt-0.5">Sin coste · Barcelona</div>
                  </button>
                  <button type="button"
                    class="p-4 rounded-[16px] border-2 transition-all duration-200 text-left"
                    [class]="form.deliveryMethod === 'shipping'
                      ? 'border-lv-gold bg-lv-gold/[0.08]'
                      : 'border-white/[0.06] hover:border-lv-gold/30 bg-white/[0.02]'"
                    (click)="form.deliveryMethod = 'shipping'">
                    <div class="text-2xl mb-2">📦</div>
                    <div class="font-display text-base text-lv-cream tracking-wide">ENVÍO</div>
                    <div class="font-mono text-[10px] text-lv-cream/30 uppercase tracking-wider mt-0.5">A acordar</div>
                  </button>
                </div>
              </div>

              <div>
                <label class="block font-mono text-[10px] uppercase tracking-widest text-lv-cream/40 mb-2">
                  Notas <span class="normal-case opacity-50">(opcional)</span>
                </label>
                <textarea
                  name="notas"
                  [class]="inputClass(false) + ' resize-none'"
                  rows="3"
                  maxlength="{{ NOTES_MAX }}"
                  placeholder="Colores, detalles especiales, preferencias..."
                  [(ngModel)]="form.notes">
                </textarea>
                <p class="text-right font-mono text-[10px] text-lv-cream/20 mt-1">
                  {{ form.notes.length }}/{{ NOTES_MAX }}
                </p>
              </div>
            </div>

            <!-- Resumen del pedido -->
            <div class="liquid-glass rounded-[20px] p-6 border border-white/[0.05] space-y-3">
              <h2 class="font-display text-2xl text-lv-cream tracking-wide uppercase">Resumen</h2>
              @for (item of cartService.cartItems(); track item.productId + '|' + (item.variant ?? '') + '|' + (item.color ?? '')) {
                <div class="flex justify-between items-start gap-3">
                  <div class="flex-1 min-w-0">
                    <span class="font-body text-sm text-lv-cream/70 block leading-tight">
                      <span class="font-mono text-lv-gold/60 text-xs">{{ item.quantity }}×</span>
                      {{ item.productName }}
                    </span>
                    <div class="flex gap-2 mt-0.5 flex-wrap">
                      @if (item.variant) {
                        <span class="font-mono text-[9px] uppercase tracking-wider text-lv-cream/30 bg-white/[0.04] rounded-full px-2 py-0.5">{{ item.variant }}</span>
                      }
                      @if (item.color) {
                        <span class="font-mono text-[9px] uppercase tracking-wider text-lv-gold/50 bg-lv-gold/[0.06] rounded-full px-2 py-0.5">{{ item.color }}</span>
                      }
                    </div>
                  </div>
                  <span class="font-display text-base text-lv-gold flex-shrink-0">{{ (item.unitPrice * item.quantity).toFixed(2) }}€</span>
                </div>
              }
              <div class="pt-4 border-t border-white/[0.06] space-y-2">
                <div class="flex justify-between">
                  <span class="font-mono text-xs uppercase tracking-wider text-lv-gold/60">Depósito 50%</span>
                  <span class="font-display text-lg text-lv-gold">{{ cartService.deposit().toFixed(2) }}€</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-display text-2xl text-lv-cream uppercase tracking-wide">Total</span>
                  <span class="font-display text-2xl text-lv-gold">{{ cartService.total().toFixed(2) }}€</span>
                </div>
              </div>
            </div>

            <!-- Política de pago -->
            <div class="liquid-glass rounded-[16px] p-4 border border-lv-gold/20">
              <p class="font-mono text-[10px] uppercase tracking-widest text-lv-gold mb-1.5">⚠️ Política de pago</p>
              <p class="font-body text-xs text-lv-cream/40 leading-relaxed">
                Tras confirmar, abona <strong class="text-lv-gold/80">{{ cartService.deposit().toFixed(2) }}€</strong>
                por Bizum o transferencia. El resto en la entrega. Plazo: 3-7 días laborables.
              </p>
            </div>

            @if (errorMsg()) {
              <div class="liquid-glass border border-red-500/40 rounded-[16px] px-5 py-4 font-mono text-xs uppercase tracking-wider text-red-400/80 flex items-start gap-2">
                <span class="flex-shrink-0">⚠️</span>
                {{ errorMsg() }}
              </div>
            }

            <button
              type="submit"
              class="w-full bg-lv-gold hover:brightness-110 text-black font-mono text-xs uppercase tracking-widest font-semibold rounded-full py-4 transition-all duration-200 disabled:opacity-40"
              [disabled]="submitting() || !isFormValid()">
              @if (submitting()) {
                <span class="flex items-center justify-center gap-2">
                  <span class="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                  Enviando a producción...
                </span>
              } @else {
                🖨️ Enviar especificaciones a producción
              }
            </button>

          </form>

        } @else {
          <!-- Confirmación -->
          <div class="text-center py-20 space-y-8">
            <div class="text-6xl">🏴‍☠️</div>
            <div>
              <h1 class="font-display uppercase leading-none mb-3" style="font-size:clamp(2.5rem,7vw,5rem)">
                <span class="block text-lv-cream">PEDIDO</span>
                <span class="block text-lv-gold">RECIBIDO</span>
              </h1>
              <p class="font-mono text-xs uppercase tracking-wider text-lv-cream/30">Especificaciones enviadas a producción</p>
            </div>

            <div class="liquid-glass rounded-[20px] p-6 border border-white/[0.05] text-left max-w-sm mx-auto space-y-3">
              <p class="font-mono text-[10px] uppercase tracking-widest text-lv-gold mb-3">Próximos pasos</p>
              @for (step of confirmationSteps(); track step.n) {
                <div class="flex items-start gap-3">
                  <span class="font-display text-lv-gold/40 text-lg leading-none flex-shrink-0">{{ step.n }}</span>
                  <p class="font-body text-xs text-lv-cream/50 leading-relaxed" [innerHTML]="step.text"></p>
                </div>
              }
            </div>

            <a routerLink="/catalog"
               class="inline-block bg-lv-gold hover:brightness-110 text-black font-mono text-xs uppercase tracking-widest font-semibold rounded-full px-8 py-4 transition-all duration-200">
              Seguir explorando
            </a>
          </div>
        }
      </div>
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

  submitting       = signal(false);
  orderConfirmed   = signal(false);
  errorMsg         = signal('');
  confirmedDeposit = signal(0);

  ngOnInit() {
    if (this.cartService.cartItems().length === 0) {
      this.router.navigate(['/cart']);
    }
  }

  confirmationSteps() {
    return [
      { n: '01', text: 'Te contactamos para confirmar detalles' },
      { n: '02', text: `Abonas <strong class="text-lv-gold/80">${this.confirmedDeposit().toFixed(2)}€</strong> por Bizum o transferencia` },
      { n: '03', text: 'Fabricamos en 3-7 días laborables' },
      { n: '04', text: 'Entrega o recogida acordada contigo' },
    ];
  }

  inputClass(hasError: boolean): string {
    return INPUT_BASE + (hasError ? ' border-red-500/50' : '');
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
