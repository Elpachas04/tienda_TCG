import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { OficinaService } from '../../core/services/oficina.service';
import { OficinaCorreos } from '../../core/models/oficina.model';
import { NOTES_MAX, CONTACT_EMAIL } from '../../shared/constants';

const NAME_MAX  = 100;
const EMAIL_MAX = 100;
const PHONE_MAX = 20;
const INPUT = 'w-full bg-white/[0.03] border rounded-xl px-4 py-3 font-body text-base text-lv-cream placeholder-lv-cream/20 focus:outline-none transition-colors';

function isSpanishPhone(v: string): boolean {
  return /^[6789]\d{8}$/.test(v.replace(/[\s\-\.\(\)]/g, ''));
}
function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

// Solo Península — no enviamos a islas, Ceuta ni Melilla
const NO_SHIP_PREFIXES = new Set(['07', '35', '38', '51', '52']);

function shippingZoneFor(cp: string): { zone: string; price: number } | null {
  if (NO_SHIP_PREFIXES.has(cp.slice(0, 2))) return null;
  return { zone: 'Península', price: 5.92 };
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  host: { class: 'block animate-fade-up' },
  template: `
    <div class="bg-lv-black bg-grid-premium min-h-screen relative overflow-x-hidden">
      <div class="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-[250px] h-[250px] sm:w-[500px] sm:h-[500px] bg-[#C9A84C]/[0.04] rounded-full blur-[80px] sm:blur-[120px] animate-aurora pointer-events-none" style="z-index:0"></div>

      <div class="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 relative" style="z-index:1">

        @if (!orderConfirmed()) {

          <div class="mb-8 sm:mb-10">
            <a routerLink="/catalog"
               class="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-lv-cream/40 hover:text-lv-gold transition-colors duration-200 mb-6 sm:mb-8">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              Volver al catálogo
            </a>
            <p class="font-mono text-xs uppercase tracking-[0.35em] text-lv-gold/60 mb-4">— Confirmación de pedido</p>
            <h1 class="font-display uppercase leading-none">
              <span class="block text-lv-cream" style="font-size:clamp(1rem,4.5vw,3rem)">CONFIGURACIÓN INSTANTÁNEA</span>
              <span class="block text-lv-gold"  style="font-size:clamp(1rem,4.5vw,3rem)">LÍNEA DIRECTA CON EL TALLER</span>
            </h1>
            <p class="font-mono text-xs text-lv-cream/30 mt-4 leading-relaxed max-w-lg">
              Rellena los datos y pulsa confirmar. Recibirás un email de confirmación con tu número de pedido.
            </p>
          </div>

          @if (errorMsg()) {
            <div class="liquid-glass border border-red-500/40 rounded-[16px] px-5 py-4 mb-5 font-body text-sm text-red-300 flex items-start gap-3">
              <span class="text-red-400 flex-shrink-0 mt-0.5">⚠</span>
              <div class="flex-1">
                <span>{{ errorMsg() }}</span>
                @if (fallbackUrl()) {
                  <a [href]="fallbackUrl()" target="_blank" rel="noopener noreferrer"
                     class="block mt-2 font-mono text-[10px] uppercase tracking-wider text-lv-gold hover:underline">
                    Enviar pedido por email →
                  </a>
                }
              </div>
            </div>
          }

          <!-- Resumen desplegable -->
          <div class="liquid-glass rounded-[20px] border border-white/[0.05] mb-4">
            <button type="button"
              class="w-full flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-white/[0.02] transition-colors"
              (click)="summaryOpen.set(!summaryOpen())">
              <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                <span class="font-display text-base sm:text-xl text-lv-cream uppercase tracking-wide truncate">Resumen del pedido</span>
                <span class="bg-lv-gold text-black font-mono text-xs font-bold px-2 py-0.5 rounded-full leading-none">
                  {{ cartService.itemCount() }}
                </span>
              </div>
              <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <span class="font-display text-base sm:text-xl text-lv-gold whitespace-nowrap">{{ grandTotal().toFixed(2) }}€</span>
                <svg class="w-4 h-4 text-lv-cream/40 transition-transform duration-200"
                     [class.rotate-180]="summaryOpen()"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </button>

            @if (summaryOpen()) {
              <div class="px-4 sm:px-6 pb-4 sm:pb-5 border-t border-white/[0.07]">
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

          <div class="space-y-3 sm:space-y-4">

            <div class="liquid-glass rounded-[20px] p-4 sm:p-6 border border-white/[0.05] space-y-4 sm:space-y-5">
              <h2 class="font-display text-xl sm:text-2xl text-lv-cream tracking-wide uppercase">Tus datos</h2>

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
                <label class="block font-mono text-[10px] uppercase tracking-widest text-lv-cream/40 mb-2">Email *</label>
                <input type="email"
                  [class]="inputClass(touched.email && !isEmailValid())"
                  placeholder="tu@email.com"
                  [attr.maxlength]="EMAIL_MAX"
                  autocomplete="email"
                  [(ngModel)]="form.customerEmail"
                  (blur)="touched.email = true" />
                @if (touched.email && !isEmailValid()) {
                  <p class="text-red-400/80 font-mono text-[10px] uppercase tracking-wider mt-1.5">
                    {{ form.customerEmail.trim() ? 'Email no válido' : 'Obligatorio' }}
                  </p>
                }
              </div>

              <div>
                <label class="block font-mono text-[10px] uppercase tracking-widest text-lv-cream/40 mb-2">
                  Teléfono *
                </label>
                <input type="tel"
                  [class]="inputClass(touched.phone && !isPhoneValid())"
                  placeholder="612 345 678"
                  [attr.maxlength]="PHONE_MAX"
                  autocomplete="tel"
                  [(ngModel)]="form.customerPhone"
                  (blur)="touched.phone = true" />
                @if (touched.phone && !isPhoneValid()) {
                  <p class="text-red-400/80 font-mono text-[10px] uppercase tracking-wider mt-1.5">
                    {{ form.customerPhone.trim() ? 'Teléfono español no válido (ej: 612 345 678)' : 'Obligatorio' }}
                  </p>
                }
              </div>

              <div>
                <label class="block font-mono text-[10px] uppercase tracking-widest text-lv-cream/40 mb-3">Método de entrega *</label>
                <div class="grid grid-cols-2 gap-2 sm:gap-3">
                  <button type="button"
                    class="p-3 sm:p-4 rounded-[16px] border-2 transition-all duration-200 text-left"
                    [class]="form.deliveryMethod === 'pickup' ? 'border-lv-gold bg-lv-gold/[0.08]' : 'border-white/[0.06] hover:border-lv-gold/30 bg-white/[0.02]'"
                    (click)="selectPickup()">
                    <div class="mb-1.5 sm:mb-2 text-lv-gold/70"><svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg></div>
                    <div class="font-display text-sm sm:text-base text-lv-cream tracking-wide">EN MANO</div>
                    <div class="font-mono text-[9px] sm:text-[10px] text-lv-cream/30 uppercase tracking-wider mt-0.5">Sin coste</div>
                  </button>
                  <button type="button"
                    class="p-3 sm:p-4 rounded-[16px] border-2 transition-all duration-200 text-left"
                    [class]="form.deliveryMethod === 'shipping' ? 'border-lv-gold bg-lv-gold/[0.08]' : 'border-white/[0.06] hover:border-lv-gold/30 bg-white/[0.02]'"
                    (click)="form.deliveryMethod = 'shipping'">
                    <div class="mb-1.5 sm:mb-2 text-lv-gold/70"><svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/></svg></div>
                    <div class="font-display text-sm sm:text-base text-lv-cream tracking-wide">ENVÍO</div>
                    <div class="font-mono text-[9px] sm:text-[10px] text-lv-cream/30 uppercase tracking-wider mt-0.5">Correos · Península</div>
                  </button>
                </div>
              </div>

              @if (form.deliveryMethod === 'shipping') {
                <div>
                  <label class="block font-mono text-[10px] uppercase tracking-widest text-lv-cream/40 mb-2">País</label>
                  <input type="text" readonly
                    class="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 font-body text-sm text-lv-cream/40 cursor-not-allowed select-none"
                    value="España" />
                </div>
                <div>
                  <label class="block font-mono text-[10px] uppercase tracking-widest text-lv-cream/40 mb-2">Código postal *</label>
                  <input type="text" inputmode="numeric"
                    [class]="inputClass(touched.cp && form.postalCode.length > 0 && !isPostalCodeValid())"
                    placeholder="28001"
                    maxlength="5"
                    [value]="form.postalCode"
                    (input)="onCpInput($event)"
                    (blur)="touched.cp = true" />

                  @if (shippingBlocked()) {
                    <div class="mt-3 flex items-start gap-3 px-4 py-3 rounded-xl border border-red-500/40 bg-red-500/[0.06]">
                      <span class="text-red-400 flex-shrink-0 mt-0.5">✕</span>
                      <div>
                        <p class="font-mono text-[11px] uppercase tracking-wider text-red-400">Zona no disponible</p>
                        <p class="font-mono text-[10px] text-lv-cream/30 mt-0.5 leading-relaxed">De momento solo enviamos a Península. Escríbenos a hola@layervault.es si necesitas otro destino.</p>
                      </div>
                    </div>
                  } @else if (shippingInfo()) {
                    <div class="mt-3 flex items-center justify-between px-3 sm:px-4 py-3 rounded-xl border border-lv-gold/30 bg-lv-gold/[0.07]">
                      <div>
                        <p class="font-display text-lv-gold text-xl sm:text-2xl leading-none">{{ shippingInfo()!.price.toFixed(2) }}€</p>
                        <p class="font-mono text-[10px] uppercase tracking-wider text-lv-cream/40 mt-0.5">Correos · {{ shippingInfo()!.zone }}</p>
                      </div>
                      <svg class="w-6 h-6 text-lv-gold/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                    </div>
                  }

                  @if (oficinas().length > 0) {
                    <div class="mt-4">
                      <label class="block font-mono text-[10px] uppercase tracking-widest text-lv-cream/40 mb-2">
                        Oficina de Correos
                        @if (!oficinasExactas()) {
                          <span class="normal-case opacity-50 ml-1">— zona aproximada</span>
                        }
                      </label>
                      <div id="oficinas-list" class="space-y-2 max-h-40 sm:max-h-56 overflow-y-auto pr-0.5">
                        @for (o of oficinas(); track o.codigo) {
                          <button type="button"
                            class="w-full px-4 py-3 rounded-[14px] border-2 transition-all duration-200 text-left"
                            [class]="selectedOficina()?.codigo === o.codigo
                              ? 'border-lv-gold bg-lv-gold/[0.08]'
                              : 'border-white/[0.06] hover:border-lv-gold/30 bg-white/[0.02]'"
                            (click)="onOficinaClick(o)">
                            <p class="font-display text-sm text-lv-cream tracking-wide leading-tight">{{ o.nombre }}</p>
                            <p class="font-mono text-[10px] text-lv-cream/40 mt-0.5 leading-snug">{{ o.direccion }} · {{ o.telefono }}</p>
                          </button>
                        }
                      </div>
                      @if (touched.oficina && oficinas().length > 0 && !selectedOficina()) {
                        <p class="text-red-400/80 font-mono text-[10px] uppercase tracking-wider mt-2">Selecciona una Oficina de Correos</p>
                      }
                      @if (selectedOficina() && oficinas().length > 1) {
                        <button type="button"
                          class="mt-2 font-mono text-[9px] uppercase tracking-wider text-lv-cream/30 hover:text-lv-cream/60 transition-colors"
                          (click)="selectedOficina.set(null)">
                          × Quitar selección
                        </button>
                      }
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
                  rows="2"
                  [attr.maxlength]="NOTES_MAX"
                  placeholder="Colores, detalles especiales, preferencias..."
                  [(ngModel)]="form.notes">
                </textarea>
                <p class="text-right font-mono text-[10px] text-lv-cream/20 mt-1">{{ form.notes.length }}/{{ NOTES_MAX }}</p>
              </div>
            </div>

            <!-- Info email -->
            <div class="liquid-glass rounded-[16px] p-4 border border-lv-gold/10 flex items-start gap-3">
              <svg class="w-5 h-5 text-lv-gold/50 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
              </svg>
              <p class="font-mono text-[10px] uppercase tracking-wider text-lv-cream/30 leading-relaxed">
                Al confirmar, recibirás un email con tu número de pedido. Te contactamos en menos de 24 horas para coordinar el pago.
              </p>
            </div>

            <button
              type="button"
              class="w-full font-mono text-xs uppercase tracking-widest font-semibold rounded-full py-3.5 sm:py-4 transition-all duration-200 flex items-center justify-center gap-2"
              [class]="isFormValid() && !submitting()
                ? 'bg-lv-gold hover:brightness-110 text-black'
                : submitting() ? 'bg-white/[0.05] text-lv-cream/20 cursor-not-allowed' : 'bg-white/[0.05] text-lv-cream/40 hover:bg-white/[0.08] cursor-pointer'"
              [disabled]="submitting()"
              (click)="submitOrder()">
              @if (submitting()) {
                <span class="w-3.5 h-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin"></span>
                <span>Enviando...</span>
              } @else {
                <span>Confirmar pedido →</span>
              }
            </button>

          </div>

        } @else {
          <div class="text-center py-12 sm:py-20 space-y-6 sm:space-y-8">
            <div class="text-6xl">🏴‍☠️</div>
            <div>
              <h1 class="font-display uppercase leading-none mb-3" style="font-size:clamp(2rem,7vw,5rem)">
                <span class="block text-lv-cream">PEDIDO</span>
                <span class="block text-lv-gold">ENVIADO</span>
              </h1>
              <p class="font-mono text-xs uppercase tracking-wider text-lv-cream/30">Te respondemos en menos de 1 hora</p>
            </div>

            @if (orderId()) {
              <div class="liquid-glass rounded-[20px] p-6 border border-lv-gold/20 max-w-sm mx-auto">
                <p class="font-mono text-[10px] uppercase tracking-widest text-lv-gold/60 mb-2">Tu número de pedido</p>
                <p class="font-display text-xl sm:text-3xl text-lv-gold tracking-wide sm:tracking-widest break-all">{{ orderId() }}</p>
                <p class="font-mono text-[10px] text-lv-cream/30 mt-2 leading-relaxed">
                  Guárdalo para consultar el estado en cualquier momento.
                </p>
                <a routerLink="/seguimiento" [queryParams]="{id: orderId()}"
                   class="inline-flex items-center gap-1.5 mt-3 font-mono text-[10px] uppercase tracking-wider text-lv-gold hover:underline">
                  Ver estado del pedido →
                </a>
              </div>
            }

            <div class="liquid-glass rounded-[20px] p-6 border border-white/[0.05] text-left max-w-sm mx-auto space-y-3">
              <p class="font-mono text-[10px] uppercase tracking-widest text-lv-gold mb-3">Próximos pasos</p>
              @for (step of steps; track step.n) {
                <div class="flex items-start gap-3">
                  <span class="font-display text-lv-gold/40 text-lg leading-none flex-shrink-0">{{ step.n }}</span>
                  <p class="font-body text-xs text-lv-cream/50 leading-relaxed">{{ step.text }}</p>
                </div>
              }
            </div>
            <button type="button"
               class="inline-block bg-lv-gold hover:brightness-110 text-black font-mono text-xs uppercase tracking-widest font-semibold rounded-full px-8 py-4 transition-all duration-200"
               (click)="finishOrder()">
              Seguir explorando
            </button>
          </div>
        }

      </div>
    </div>
  `
})
export class CheckoutComponent implements OnInit {
  protected readonly NAME_MAX  = NAME_MAX;
  protected readonly EMAIL_MAX = EMAIL_MAX;
  protected readonly PHONE_MAX = PHONE_MAX;
  protected readonly NOTES_MAX = NOTES_MAX;

  protected readonly cartService = inject(CartService);
  private router = inject(Router);
  private oficinaService = inject(OficinaService);
  private platformId = inject(PLATFORM_ID);

  form = {
    customerName:  '',
    customerEmail: '',
    customerPhone: '',
    deliveryMethod: 'pickup' as 'pickup' | 'shipping',
    postalCode:    '',
    notes:         '',
  };

  touched = { name: false, email: false, phone: false, cp: false, oficina: false };

  orderConfirmed   = signal(false);
  orderId          = signal('');
  errorMsg         = signal('');
  submitting       = signal(false);
  fallbackUrl      = signal('');
  summaryOpen      = signal(false);

  shippingInfo     = signal<{ zone: string; price: number } | null>(null);
  shippingBlocked  = signal(false);
  oficinas         = signal<OficinaCorreos[]>([]);
  oficinasExactas  = signal(true);
  selectedOficina  = signal<OficinaCorreos | null>(null);

  readonly grandTotal = computed(() =>
    this.cartService.total() + (this.shippingInfo()?.price ?? 0)
  );

  readonly steps = [
    { n: '01', text: 'Te contactamos por email para confirmar detalles y coordinar el pago' },
    { n: '02', text: 'Abona el total por Bizum' },
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

  isEmailValid():      boolean { return isValidEmail(this.form.customerEmail.trim()); }
  isPhoneValid():      boolean { return isSpanishPhone(this.form.customerPhone.trim()); }
  isPostalCodeValid(): boolean { return /^\d{5}$/.test(this.form.postalCode); }

  selectPickup(): void {
    this.form.deliveryMethod = 'pickup';
    this.form.postalCode = '';
    this.shippingInfo.set(null);
    this.shippingBlocked.set(false);
    this.oficinas.set([]);
    this.oficinasExactas.set(true);
    this.selectedOficina.set(null);
  }

  onCpInput(event: Event): void {
    const digits = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 5);
    (event.target as HTMLInputElement).value = digits;
    this.form.postalCode = digits;
    this.shippingInfo.set(null);
    this.shippingBlocked.set(false);
    this.oficinas.set([]);
    this.oficinasExactas.set(true);
    this.selectedOficina.set(null);
    if (digits.length === 5) {
      this.fetchShipping(digits);
      this.oficinaService.buscarOficinas(digits).subscribe(list => {
        if (list.length > 0) {
          this.oficinas.set(list);
          if (list.length === 1) this.selectedOficina.set(list[0]);
        } else {
          this.oficinasExactas.set(false);
          this.oficinaService.buscarOficinas(digits.slice(0, 4)).subscribe(nearby => {
            this.oficinas.set(nearby);
            if (nearby.length === 1) this.selectedOficina.set(nearby[0]);
          });
        }
      });
    }
  }

  private async fetchShipping(cp: string): Promise<void> {
    try {
      const res  = await fetch(`/.netlify/functions/shipping-price?cp=${cp}`);
      if (res.status === 422) { this.shippingBlocked.set(true); return; }
      const data = await res.json() as { zone: string; price: number };
      this.shippingInfo.set(data);
    } catch {
      const result = shippingZoneFor(cp);
      if (result) { this.shippingInfo.set(result); } else { this.shippingBlocked.set(true); }
    }
  }

  isFormValid(): boolean {
    if (!this.form.customerName.trim() || !this.isEmailValid()) return false;
    if (!this.isPhoneValid()) return false;
    if (this.cartService.cartItems().length === 0) return false;
    if (this.form.deliveryMethod === 'shipping') {
      if (!this.isPostalCodeValid() || this.shippingBlocked() || !this.shippingInfo()) return false;
      if (this.oficinas().length > 0 && !this.selectedOficina()) return false;
    }
    return true;
  }

  onOficinaClick(o: OficinaCorreos): void {
    // Single office is auto-selected and cannot be deselected
    if (this.oficinas().length === 1) return;
    this.selectedOficina.set(this.selectedOficina()?.codigo === o.codigo ? null : o);
  }

  finishOrder(): void {
    this.cartService.clearCart();
    this.router.navigate(['/catalog']);
  }

  private sendConfirmationEmail(
    items:   ReturnType<typeof this.cartService.cartItems>,
    info:    { zone: string; price: number } | null,
    oficina: OficinaCorreos | null,
    orderId: string
  ): void {
    const email = this.form.customerEmail.trim();
    if (!email) return;

    const deliveryLine = this.form.deliveryMethod === 'pickup'
      ? 'En mano (sin coste)'
      : `Correos · CP ${this.form.postalCode} — ${info?.price.toFixed(2) ?? '?'} €`;

    fetch('/api/confirmation', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        customerName:   this.form.customerName,
        customerEmail:  email,
        deliveryLine,
        deliveryMethod: this.form.deliveryMethod,
        oficina: oficina ? {
          nombre:       oficina.nombre,
          direccion:    oficina.direccion,
          codigoPostal: oficina.codigoPostal,
          localidad:    oficina.localidad,
        } : undefined,
        orderId,
        total: this.grandTotal(),
        items: items.map(i => ({
          name:    i.productName,
          qty:     i.quantity,
          variant: i.variant,
          color:   i.color,
          price:   i.unitPrice,
        })),
      }),
    }).catch(() => { /* silencioso — el pedido ya está enviado */ });
  }

  async submitOrder(): Promise<void> {
    this.touched = { name: true, email: true, phone: true, cp: true, oficina: true };
    if (!this.isFormValid()) {
      if (this.form.deliveryMethod === 'shipping' && this.oficinas().length > 1 && !this.selectedOficina()) {
        if (isPlatformBrowser(this.platformId)) {
          document.getElementById('oficinas-list')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (isPlatformBrowser(this.platformId)) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    this.submitting.set(true);
    this.errorMsg.set('');
    this.fallbackUrl.set('');

    const items   = this.cartService.cartItems();
    const info    = this.shippingInfo();
    const oficina = this.selectedOficina();

    const payload = {
      customerName:  this.form.customerName,
      customerEmail: this.form.customerEmail,
      customerPhone: this.form.customerPhone.trim(),
      deliveryMethod: this.form.deliveryMethod,
      postalCode:      this.form.deliveryMethod === 'shipping' ? this.form.postalCode : undefined,
      shippingZone:    info?.zone,
      shippingCost:    info?.price,
      oficina:         oficina ? {
        nombre:       oficina.nombre,
        direccion:    oficina.direccion,
        codigoPostal: oficina.codigoPostal,
        localidad:    oficina.localidad,
        telefono:     oficina.telefono,
      } : undefined,
      notes:       this.form.notes.trim() || undefined,
      totalAmount: this.grandTotal(),
      items: items.map(i => ({
        productId:   i.productId,
        productSku:  i.productSku,
        productName: i.productName,
        variant:     i.variant,
        color:       i.color,
        quantity:    i.quantity,
        unitPrice:   i.unitPrice,
        notes:       i.notes,
      })),
    };

    try {
      const res = await fetch('/api/order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `Error ${res.status}`);
      }

      const data = await res.json() as { success: boolean; orderId?: string };
      const orderId = data.orderId ?? '';
      this.orderId.set(orderId);
      this.orderConfirmed.set(true);
      this.cartService.clearCart();
      this.sendConfirmationEmail(items, info, oficina, orderId);
    } catch {
      this.fallbackUrl.set(this.buildEmailFallbackUrl());
      this.errorMsg.set('No se pudo enviar el pedido. Inténtalo de nuevo o usa el enlace de abajo.');
      if (isPlatformBrowser(this.platformId)) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      this.submitting.set(false);
    }
  }

  private buildEmailFallbackUrl(): string {
    const items   = this.cartService.cartItems();
    const info    = this.shippingInfo();
    const oficina = this.selectedOficina();

    const itemLines = items.map(i => {
      let line = `• ${i.quantity}× ${i.productName}`;
      if (i.variant) line += ` (${i.variant})`;
      if (i.color)   line += ` — color ${i.color}`;
      line += ` — ${(i.unitPrice * i.quantity).toFixed(2)}€`;
      if (i.notes)   line += `\n   Nota: ${i.notes}`;
      return line;
    }).join('\n');

    const deliveryLine = this.form.deliveryMethod === 'pickup'
      ? 'En mano (sin coste)'
      : `Envío Correos a CP ${this.form.postalCode} (${info?.zone}) — ${info?.price.toFixed(2)}€`;

    const oficinaLines = oficina ? [
      `Oficina: ${oficina.nombre}`,
      `  ${oficina.direccion}, ${oficina.codigoPostal} ${oficina.localidad}`,
    ] : [];

    const lines = [
      'PEDIDO — LayerVault',
      '',
      `Nombre: ${this.form.customerName}`,
      `Email: ${this.form.customerEmail}`,
      ...(this.form.customerPhone.trim() ? [`Teléfono: ${this.form.customerPhone.trim()}`] : []),
      `Entrega: ${deliveryLine}`,
      ...oficinaLines,
      '',
      itemLines,
      '',
      `Total: ${this.grandTotal().toFixed(2)}€`,
      ...(this.form.notes.trim() ? [`Notas: ${this.form.notes.trim()}`] : []),
    ];

    const subject = `Pedido LayerVault — ${this.form.customerName}`;
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  }
}
