import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { NOTES_MAX } from '../../shared/constants';

const TELEGRAM_USERNAME = 'Elpachas_04';

const NAME_MAX    = 100;
const CONTACT_MAX = 200;
const INPUT = 'w-full bg-white/[0.03] border rounded-xl px-4 py-3 font-body text-sm text-lv-cream placeholder-lv-cream/20 focus:outline-none transition-colors';

function isValidContact(v: string): boolean { return v.length >= 5; }

function shippingZoneFor(cp: string): { zone: string; price: number } {
  const p = cp.slice(0, 2);
  if (p === '07')               return { zone: 'Islas Baleares', price: 7.95  };
  if (p === '35' || p === '38') return { zone: 'Islas Canarias', price: 10.95 };
  if (p === '51')               return { zone: 'Ceuta',          price: 8.50  };
  if (p === '52')               return { zone: 'Melilla',        price: 8.50  };
  return                               { zone: 'Península',      price: 4.95  };
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

          <div class="mb-10">
            <a routerLink="/catalog"
               class="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-lv-cream/40 hover:text-lv-gold transition-colors duration-200 mb-8">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              Volver al catálogo
            </a>
            <p class="font-mono text-xs uppercase tracking-[0.35em] text-lv-gold/60 mb-4">— Confirmación de pedido</p>
            <h1 class="font-display uppercase leading-none">
              <span class="block text-lv-cream" style="font-size:clamp(1.8rem,5vw,3rem)">CONFIGURACIÓN INSTANTÁNEA</span>
              <span class="block text-lv-gold"  style="font-size:clamp(1.8rem,5vw,3rem)">LÍNEA DIRECTA CON EL TALLER</span>
            </h1>
            <p class="font-mono text-xs text-lv-cream/30 mt-4 leading-relaxed max-w-lg">
              Rellena los datos y pulsa confirmar. Se abrirá Telegram con tu pedido listo para enviar.
            </p>
          </div>

          @if (errorMsg()) {
            <div class="liquid-glass border border-red-500/40 rounded-[16px] px-5 py-4 mb-5 font-body text-sm text-red-300 flex items-start gap-3">
              <span class="text-red-400 flex-shrink-0">⚠</span>
              <span>{{ errorMsg() }}</span>
            </div>
          }

          <!-- Resumen desplegable -->
          <div class="liquid-glass rounded-[20px] border border-white/[0.05] mb-4">
            <button type="button"
              class="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
              (click)="summaryOpen.set(!summaryOpen())">
              <div class="flex items-center gap-3">
                <span class="font-display text-xl text-lv-cream uppercase tracking-wide">Resumen del pedido</span>
                <span class="bg-lv-gold text-black font-mono text-xs font-bold px-2 py-0.5 rounded-full leading-none">
                  {{ cartService.itemCount() }}
                </span>
              </div>
              <div class="flex items-center gap-3">
                <span class="font-display text-xl text-lv-gold">{{ grandTotal().toFixed(2) }}€</span>
                <svg class="w-4 h-4 text-lv-cream/40 transition-transform duration-200"
                     [class.rotate-180]="summaryOpen()"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </button>

            @if (summaryOpen()) {
              <div class="px-6 pb-5 border-t border-white/[0.07]">
                <div class="pt-4 space-y-2">
                  @for (item of cartService.cartItems(); track item.productId + (item.variant || '') + (item.color || '')) {
                    <div class="flex justify-between items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0">
                      <div class="flex-1 min-w-0">
                        <p class="font-display text-base text-lv-cream leading-tight tracking-wide">
                          <span class="text-lv-gold mr-1">{{ item.quantity }}×</span>{{ item.productName }}
                        </p>
                        <div class="flex gap-1.5 mt-1 flex-wrap">
                          @if (item.variant) {
                            <span class="font-mono text-[9px] uppercase tracking-wider text-lv-cream/50 bg-white/[0.06] rounded-full px-2 py-0.5">{{ item.variant }}</span>
                          }
                          @if (item.color) {
                            <span class="font-mono text-[9px] uppercase tracking-wider text-lv-gold bg-lv-gold/[0.10] rounded-full px-2 py-0.5">{{ item.color }}</span>
                          }
                        </div>
                        @if (item.notes) {
                          <p class="font-body text-[10px] text-lv-cream/40 mt-1 italic leading-snug">{{ item.notes }}</p>
                        }
                      </div>
                      <span class="font-display text-lg text-lv-gold flex-shrink-0">{{ (item.unitPrice * item.quantity).toFixed(2) }}€</span>
                    </div>
                  }
                </div>

                @if (form.deliveryMethod === 'shipping' && shippingInfo()) {
                  <div class="flex justify-between items-center pt-3 border-t border-white/[0.06]">
                    <span class="font-mono text-[10px] uppercase tracking-wider text-lv-cream/50">Envío — {{ shippingInfo()!.zone }}</span>
                    <span class="font-display text-base text-lv-cream/80">{{ shippingInfo()!.price.toFixed(2) }}€</span>
                  </div>
                }

              </div>
            }
          </div>

          <div class="space-y-4">

            <div class="liquid-glass rounded-[20px] p-6 border border-white/[0.05] space-y-5">
              <h2 class="font-display text-2xl text-lv-cream tracking-wide uppercase">Tus datos</h2>

              <div>
                <label class="block font-mono text-[10px] uppercase tracking-widest text-lv-cream/40 mb-2">Nombre *</label>
                <input type="text"
                  [class]="inputClass(touched.name && !form.customerName.trim())"
                  placeholder="Tu nombre completo"
                  [attr.maxlength]="NAME_MAX"
                  autocomplete="name"
                  [(ngModel)]="form.customerName"
                  (blur)="touched.name = true" />
                @if (touched.name && !form.customerName.trim()) {
                  <p class="text-red-400/80 font-mono text-[10px] uppercase tracking-wider mt-1.5">Obligatorio</p>
                }
              </div>

              <div>
                <label class="block font-mono text-[10px] uppercase tracking-widest text-lv-cream/40 mb-2">Email o teléfono *</label>
                <input type="text"
                  [class]="inputClass(touched.contact && !isContactValid())"
                  placeholder="tu@email.com o 6XX XXX XXX"
                  [attr.maxlength]="CONTACT_MAX"
                  autocomplete="email"
                  [(ngModel)]="form.customerContact"
                  (blur)="touched.contact = true" />
                @if (touched.contact && !isContactValid()) {
                  <p class="text-red-400/80 font-mono text-[10px] uppercase tracking-wider mt-1.5">Mínimo 5 caracteres</p>
                }
              </div>

              <div>
                <label class="block font-mono text-[10px] uppercase tracking-widest text-lv-cream/40 mb-3">Método de entrega *</label>
                <div class="grid grid-cols-2 gap-3">
                  <button type="button"
                    class="p-4 rounded-[16px] border-2 transition-all duration-200 text-left"
                    [class]="form.deliveryMethod === 'pickup' ? 'border-lv-gold bg-lv-gold/[0.08]' : 'border-white/[0.06] hover:border-lv-gold/30 bg-white/[0.02]'"
                    (click)="selectPickup()">
                    <div class="text-2xl mb-2">🤝</div>
                    <div class="font-display text-base text-lv-cream tracking-wide">EN MANO</div>
                    <div class="font-mono text-[10px] text-lv-cream/30 uppercase tracking-wider mt-0.5">Sin coste · Barcelona</div>
                  </button>
                  <button type="button"
                    class="p-4 rounded-[16px] border-2 transition-all duration-200 text-left"
                    [class]="form.deliveryMethod === 'shipping' ? 'border-lv-gold bg-lv-gold/[0.08]' : 'border-white/[0.06] hover:border-lv-gold/30 bg-white/[0.02]'"
                    (click)="form.deliveryMethod = 'shipping'">
                    <div class="text-2xl mb-2">📦</div>
                    <div class="font-display text-base text-lv-cream tracking-wide">ENVÍO</div>
                    <div class="font-mono text-[10px] text-lv-cream/30 uppercase tracking-wider mt-0.5">Correos · España</div>
                  </button>
                </div>
              </div>

              @if (form.deliveryMethod === 'shipping') {
                <div>
                  <label class="block font-mono text-[10px] uppercase tracking-widest text-lv-cream/40 mb-2">Código postal *</label>
                  <input type="text" inputmode="numeric"
                    [class]="inputClass(touched.cp && form.postalCode.length > 0 && !isPostalCodeValid())"
                    placeholder="28001"
                    maxlength="5"
                    [value]="form.postalCode"
                    (input)="onCpInput($event)"
                    (blur)="touched.cp = true" />

                  @if (shippingInfo()) {
                    <div class="mt-3 flex items-center justify-between px-4 py-3 rounded-xl border border-lv-gold/30 bg-lv-gold/[0.07]">
                      <div>
                        <p class="font-display text-lv-gold text-2xl leading-none">{{ shippingInfo()!.price.toFixed(2) }}€</p>
                        <p class="font-mono text-[10px] uppercase tracking-wider text-lv-cream/40 mt-0.5">Correos · {{ shippingInfo()!.zone }}</p>
                      </div>
                      <svg class="w-6 h-6 text-lv-gold/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                    </div>
                  }
                </div>
              }

              <div>
                <label class="block font-mono text-[10px] uppercase tracking-widest text-lv-cream/40 mb-2">
                  Notas <span class="normal-case opacity-50">(opcional)</span>
                </label>
                <textarea
                  [class]="inputClass(false) + ' resize-none'"
                  rows="3"
                  [attr.maxlength]="NOTES_MAX"
                  placeholder="Colores, detalles especiales, preferencias..."
                  [(ngModel)]="form.notes">
                </textarea>
                <p class="text-right font-mono text-[10px] text-lv-cream/20 mt-1">{{ form.notes.length }}/{{ NOTES_MAX }}</p>
              </div>
            </div>

            <!-- Info Telegram -->
            <div class="liquid-glass rounded-[16px] p-4 border border-lv-gold/10 flex items-start gap-3">
              <svg class="w-5 h-5 text-lv-gold/50 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.04 9.61c-.15.67-.54.835-1.095.52l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.914.599z"/>
              </svg>
              <p class="font-mono text-[10px] uppercase tracking-wider text-lv-cream/30 leading-relaxed">
                Al confirmar se abrirá Telegram con tu pedido. Envíalo y te contactamos para coordinar el pago.
              </p>
            </div>

            <button
              type="button"
              class="w-full bg-lv-gold hover:brightness-110 text-black font-mono text-xs uppercase tracking-widest font-semibold rounded-full py-4 transition-all duration-200 flex items-center justify-center gap-2"
              (click)="submitOrder()">
              <span>Confirmar y enviar por Telegram →</span>
            </button>

          </div>

        } @else {
          <div class="text-center py-20 space-y-8">
            <div class="text-6xl">🏴‍☠️</div>
            <div>
              <h1 class="font-display uppercase leading-none mb-3" style="font-size:clamp(2.5rem,7vw,5rem)">
                <span class="block text-lv-cream">PEDIDO</span>
                <span class="block text-lv-gold">ENVIADO</span>
              </h1>
              <p class="font-mono text-xs uppercase tracking-wider text-lv-cream/30">Te respondemos en menos de 1 hora</p>
            </div>
            <div class="liquid-glass rounded-[20px] p-6 border border-white/[0.05] text-left max-w-sm mx-auto space-y-3">
              <p class="font-mono text-[10px] uppercase tracking-widest text-lv-gold mb-3">Próximos pasos</p>
              @for (step of steps; track step.n) {
                <div class="flex items-start gap-3">
                  <span class="font-display text-lv-gold/40 text-lg leading-none flex-shrink-0">{{ step.n }}</span>
                  <p class="font-body text-xs text-lv-cream/50 leading-relaxed">{{ step.text }}</p>
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

  cartService = inject(CartService);
  private router = inject(Router);

  form = {
    customerName:    '',
    customerContact: '',
    deliveryMethod:  'pickup' as 'pickup' | 'shipping',
    postalCode:      '',
    notes:           '',
  };

  touched = { name: false, contact: false, cp: false };

  orderConfirmed   = signal(false);
  errorMsg         = signal('');
  summaryOpen      = signal(true);

  shippingInfo = signal<{ zone: string; price: number } | null>(null);

  readonly grandTotal = computed(() =>
    this.cartService.total() + (this.shippingInfo()?.price ?? 0)
  );

  readonly steps = [
    { n: '01', text: 'Recibirás respuesta por Telegram para confirmar detalles' },
    { n: '02', text: 'Abona el total por Bizum o transferencia bancaria' },
    { n: '03', text: 'Fabricamos en 3–7 días laborables' },
    { n: '04', text: 'Entrega o recogida acordada contigo' },
  ];

  ngOnInit() {
    if (this.cartService.cartItems().length === 0) {
      this.router.navigate(['/catalog']);
    }
  }

  inputClass(hasError: boolean): string {
    return INPUT + (hasError
      ? ' border-red-500/50 focus:border-red-500/70'
      : ' border-white/[0.07] focus:border-lv-gold/40');
  }

  isContactValid():    boolean { return isValidContact(this.form.customerContact.trim()); }
  isPostalCodeValid(): boolean { return /^\d{5}$/.test(this.form.postalCode); }

  selectPickup(): void {
    this.form.deliveryMethod = 'pickup';
    this.form.postalCode = '';
    this.shippingInfo.set(null);
  }

  onCpInput(event: Event): void {
    const digits = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 5);
    (event.target as HTMLInputElement).value = digits;
    this.form.postalCode = digits;
    this.shippingInfo.set(digits.length === 5 ? shippingZoneFor(digits) : null);
  }

  isFormValid(): boolean {
    if (!this.form.customerName.trim() || !this.isContactValid()) return false;
    if (this.cartService.cartItems().length === 0) return false;
    if (this.form.deliveryMethod === 'shipping' && !this.isPostalCodeValid()) return false;
    return true;
  }

  submitOrder(): void {
    this.touched = { name: true, contact: true, cp: true };
    if (!this.isFormValid()) {
      this.errorMsg.set('Rellena todos los campos obligatorios antes de continuar.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const items = this.cartService.cartItems();
    const info  = this.shippingInfo();

    const itemLines = items.map(i => {
      let line = `• ${i.quantity}× ${i.productName}`;
      if (i.variant) line += ` (${i.variant})`;
      if (i.color)   line += ` — color ${i.color}`;
      line += ` — ${(i.unitPrice * i.quantity).toFixed(2)}€`;
      if (i.notes)   line += `\n   📝 ${i.notes}`;
      return line;
    }).join('\n');

    const deliveryLine = this.form.deliveryMethod === 'pickup'
      ? 'En mano · Barcelona (sin coste)'
      : `Envío Correos a CP ${this.form.postalCode} (${info?.zone}) — ${info?.price.toFixed(2)}€`;

    const lines = [
      '🏴‍☠️ PEDIDO — LayerVault',
      '',
      `👤 ${this.form.customerName}`,
      `📞 ${this.form.customerContact}`,
      `🚚 ${deliveryLine}`,
      '',
      itemLines,
      '',
      `💰 Total: ${this.grandTotal().toFixed(2)}€`,
      ...(this.form.notes.trim() ? [`📝 ${this.form.notes.trim()}`] : []),
    ];

    const url = `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank');

    this.cartService.clearCart();
    this.orderConfirmed.set(true);
  }
}
