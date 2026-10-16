import { ChangeDetectionStrategy, Component, computed, inject, signal, afterNextRender } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WHATSAPP_URL } from '../../shared/constants';

type View = 'loading' | 'form' | 'sending' | 'done' | 'invalid' | 'error';

// Página a la que lleva el email de "Entregado". El enlace lleva el nº de pedido y una firma,
// así que solo puede valorar quien ha recibido el pedido. Se puede volver a entrar y cambiarla.
@Component({
  selector: 'app-review-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  host: { class: 'block animate-fade-up' },
  template: `
    <div class="max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      @switch (view()) {
        @case ('loading') {
          <p class="text-lv-cream/60" aria-live="polite">Cargando…</p>
        }

        @case ('invalid') {
          <h1 class="lv-h1 text-lv-cream">No encontramos este enlace</h1>
          <p class="lv-lede mt-5">Puede que se haya cortado al copiarlo. Ábrelo directamente desde el email de tu pedido o escríbenos y te mandamos otro.</p>
          <div class="mt-8 flex flex-wrap gap-3">
            <a [href]="whatsappUrl" target="_blank" rel="noopener noreferrer" class="lv-btn lv-btn-primary">Escribir por WhatsApp</a>
            <a routerLink="/" class="lv-btn lv-btn-ghost">Ir a la tienda</a>
          </div>
        }

        @case ('done') {
          <h1 class="lv-h1 text-lv-cream">Gracias{{ firstName() ? ', ' + firstName() : '' }}</h1>
          <p class="lv-lede mt-5">Hemos recibido tu valoración. La revisamos y la publicamos en unos días. Si quieres cambiarla, vuelve a abrir el enlace del email.</p>
          <p class="mt-8 text-[16px] leading-relaxed text-lv-cream/80">
            ¿Tienes una foto de la pieza en uso? Nos encanta verlas:
            <a [href]="photoUrl()" target="_blank" rel="noopener noreferrer" class="lv-link">mándanosla por WhatsApp</a>.
          </p>
          <a routerLink="/catalog" class="lv-btn lv-btn-ghost mt-8">Ver el catálogo</a>
        }

        @default {
          <p class="text-[15px] text-lv-cream/60">Pedido {{ orderId }}</p>
          <h1 class="lv-h1 text-lv-cream mt-2">¿Qué te ha parecido?</h1>
          @if (products().length) {
            <p class="lv-lede mt-4">{{ products().join(', ') }}</p>
          }

          <form class="mt-10 flex flex-col gap-8" (submit)="send($event)" novalidate>
            <fieldset>
              <legend class="text-[15px] font-semibold text-lv-cream mb-3">Tu valoración</legend>
              <div class="flex gap-1" role="radiogroup" aria-label="Estrellas">
                @for (n of [1, 2, 3, 4, 5]; track n) {
                  <button type="button" role="radio" [attr.aria-checked]="rating() === n" [attr.aria-label]="n + (n === 1 ? ' estrella' : ' estrellas')"
                          (click)="rating.set(n)" (mouseenter)="hover.set(n)" (mouseleave)="hover.set(0)"
                          class="w-12 h-12 grid place-items-center text-[30px] leading-none transition-colors"
                          [class]="n <= (hover() || rating()) ? 'text-lv-gold' : 'text-lv-cream/40'">
                    ★
                  </button>
                }
              </div>
              <p class="mt-2 min-h-[22px] text-[14px] text-lv-cream/60" aria-live="polite">{{ label() }}</p>
            </fieldset>

            <div>
              <label for="rv-text" class="block text-[15px] font-semibold text-lv-cream mb-2">Cuéntanos qué tal <span class="font-normal text-lv-cream/50">(opcional)</span></label>
              <textarea id="rv-text" rows="5" maxlength="1000" [value]="text()" (input)="text.set($any($event.target).value)"
                        placeholder="El ajuste, el acabado, el color…"
                        class="w-full rounded-card bg-white/[0.04] border border-lv-cream/15 px-4 py-3 text-[16px] text-lv-cream placeholder:text-lv-cream/35 focus:border-lv-gold/60 focus:outline-none"></textarea>
            </div>

            <div>
              <label for="rv-name" class="block text-[15px] font-semibold text-lv-cream mb-2">Nombre que se mostrará</label>
              <input id="rv-name" type="text" maxlength="40" autocomplete="given-name" [value]="name()" (input)="name.set($any($event.target).value)"
                     class="w-full h-12 rounded-card bg-white/[0.04] border border-lv-cream/15 px-4 text-[16px] text-lv-cream focus:border-lv-gold/60 focus:outline-none" />
              <p class="mt-2 text-[13px] text-lv-cream/50">Puedes poner solo tu nombre o un apodo. Revisamos cada valoración antes de publicarla.</p>
            </div>

            @if (error()) {
              <p class="text-[15px] text-red-300" role="alert">{{ error() }}</p>
            }

            <button type="submit" class="lv-btn lv-btn-primary self-start" [disabled]="view() === 'sending'">
              {{ view() === 'sending' ? 'Enviando…' : (edit() ? 'Guardar cambios' : 'Enviar valoración') }}
            </button>
          </form>
        }
      }
    </div>
  `,
})
export class ReviewFormComponent {
  private readonly route = inject(ActivatedRoute);

  readonly orderId = this.route.snapshot.queryParamMap.get('id') ?? '';
  private readonly token = this.route.snapshot.queryParamMap.get('t') ?? '';

  readonly view = signal<View>('loading');
  readonly rating = signal(0);
  readonly hover = signal(0);
  readonly text = signal('');
  readonly name = signal('');
  readonly firstName = signal('');
  readonly products = signal<string[]>([]);
  readonly edit = signal(false);
  readonly error = signal('');

  readonly whatsappUrl = WHATSAPP_URL;
  readonly photoUrl = computed(() => `${WHATSAPP_URL}?text=${encodeURIComponent(`Hola, os mando una foto de mi pedido ${this.orderId}`)}`);
  readonly label = computed(() => ['Toca una estrella para puntuar', 'Mal', 'Regular', 'Bien', 'Muy bien', 'Me encanta'][this.hover() || this.rating()]);

  constructor() {
    afterNextRender(() => this.load());
  }

  private async load(): Promise<void> {
    if (!this.orderId || !this.token) { this.view.set('invalid'); return; }
    try {
      const res = await fetch(`/api/review?id=${encodeURIComponent(this.orderId)}&t=${encodeURIComponent(this.token)}`);
      if (res.status === 403) { this.view.set('invalid'); return; }
      if (!res.ok) throw new Error();
      const d = await res.json() as { firstName: string; products: string[]; review: { name: string; rating: number; text: string } | null };
      this.firstName.set(d.firstName);
      this.products.set(d.products);
      this.name.set(d.review?.name ?? d.firstName);
      if (d.review) {
        this.rating.set(d.review.rating);
        this.text.set(d.review.text);
        this.edit.set(true);
      }
      this.view.set('form');
    } catch {
      // Sin datos del pedido se puede valorar igual
      this.view.set('form');
    }
  }

  async send(event: Event): Promise<void> {
    event.preventDefault();
    this.error.set('');
    if (!this.rating()) { this.error.set('Toca las estrellas para puntuar.'); return; }
    if (!this.name().trim()) { this.error.set('Pon un nombre, aunque sea solo el de pila.'); document.getElementById('rv-name')?.focus(); return; }
    this.view.set('sending');
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: this.orderId, token: this.token, rating: this.rating(), text: this.text(), name: this.name() }),
      });
      if (res.status === 403) { this.view.set('invalid'); return; }
      if (!res.ok) throw new Error();
      this.view.set('done');
    } catch {
      this.view.set('form');
      this.error.set('No hemos podido enviar tu valoración. Revisa la conexión y vuelve a intentarlo.');
    }
  }
}
