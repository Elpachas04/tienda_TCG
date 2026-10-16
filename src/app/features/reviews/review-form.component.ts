import { ChangeDetectionStrategy, Component, computed, inject, signal, afterNextRender } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WHATSAPP_URL } from '../../shared/constants';
import { maskName } from '../../shared/utils/mask-name';
import { resizeImage } from '../../shared/utils/resize-image';

const CLOUDINARY = 'https://res.cloudinary.com/dew1whfdu/image/upload/f_auto,q_auto,c_fill,w_240,h_240/';

type View = 'loading' | 'form' | 'sending' | 'done' | 'invalid' | 'notDelivered' | 'unavailable';

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

        @case ('notDelivered') {
          <h1 class="lv-h1 text-lv-cream">Aún no puedes valorarlo</h1>
          <p class="lv-lede mt-5">Podrás hacerlo cuando el pedido <span class="whitespace-nowrap">{{ orderId }}</span> conste como entregado. Te llegará un email con el enlace.</p>
          <a routerLink="/seguimiento" [queryParams]="{ id: orderId }" class="lv-btn lv-btn-ghost mt-8">Ver el estado del pedido</a>
        }

        @case ('unavailable') {
          <h1 class="lv-h1 text-lv-cream">No podemos cargar tu pedido ahora</h1>
          <p class="lv-lede mt-5">Es algo temporal. Vuelve a abrir el enlace en unos minutos.</p>
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
              <p id="rv-photos-label" class="text-[15px] font-semibold text-lv-cream mb-1">Fotos <span class="font-normal text-lv-cream/50">(opcional, hasta 3)</span></p>
              <p class="text-[13px] text-lv-cream/50 mb-3">La pieza en tu mesa, en la estantería o en partida. Mejor sin caras ni datos personales.</p>
              <ul class="flex flex-wrap gap-3" aria-labelledby="rv-photos-label">
                @for (p of photos(); track p.id) {
                  <li class="relative w-24 h-24 rounded-card overflow-hidden border border-lv-cream/15 bg-white/[0.04]">
                    <img [src]="p.preview" alt="Tu foto" class="w-full h-full object-cover" [class.opacity-40]="p.uploading" />
                    @if (p.uploading) {
                      <span class="absolute inset-0 grid place-items-center text-[12px] text-lv-cream">Subiendo…</span>
                    } @else {
                      <button type="button" (click)="removePhoto(p.id)" aria-label="Quitar esta foto"
                              class="absolute top-1 right-1 w-8 h-8 grid place-items-center rounded-full bg-black/70 text-lv-cream text-[14px] hover:bg-black">✕</button>
                    }
                  </li>
                }
                @if (photos().length < maxPhotos) {
                  <li>
                    <label class="w-24 h-24 rounded-card border border-dashed border-lv-cream/25 grid place-items-center text-center cursor-pointer
                                  text-[13px] leading-tight text-lv-cream/70 hover:border-lv-gold/60 hover:text-lv-foil transition-colors focus-within:border-lv-gold">
                      <span><span class="block text-[22px] leading-none mb-1" aria-hidden="true">+</span>Añadir foto</span>
                      <input type="file" accept="image/*" multiple class="sr-only" (change)="addPhotos($event)" />
                    </label>
                  </li>
                }
              </ul>
            </div>

            <div>
              <p class="text-[15px] font-semibold text-lv-cream mb-3">Cómo aparecerá tu nombre</p>
              <div class="rounded-card border border-lv-cream/12 bg-white/[0.03] divide-y divide-lv-cream/10">
                <div class="flex items-center justify-between gap-4 px-4 py-3">
                  <span class="text-[14px] text-lv-cream/60">Tu nombre</span>
                  <span class="text-[16px] text-lv-cream text-right">{{ fullName() }}</span>
                </div>
                <div class="flex items-center justify-between gap-4 px-4 py-3">
                  <span class="text-[14px] text-lv-cream/60">En la web</span>
                  <span class="text-[17px] font-semibold tracking-[1px] text-lv-foil text-right">{{ masked() }}</span>
                </div>
              </div>
              <p class="mt-2 text-[13px] text-lv-cream/50">Por privacidad solo se ven las primeras y últimas letras. Revisamos cada valoración y sus fotos antes de publicarla.</p>
            </div>

            @if (error()) {
              <p class="text-[15px] text-red-300" role="alert">{{ error() }}</p>
            }

            <button type="submit" class="lv-btn lv-btn-primary self-start" [disabled]="view() === 'sending' || uploading()">
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
  readonly fullName = signal('');
  readonly firstName = signal('');
  readonly products = signal<string[]>([]);
  readonly edit = signal(false);
  readonly error = signal('');

  readonly whatsappUrl = WHATSAPP_URL;
  readonly maxPhotos = 3;
  readonly photos = signal<{ id: string; preview: string; publicId?: string; uploading: boolean }[]>([]);
  readonly uploading = computed(() => this.photos().some(p => p.uploading));
  readonly masked = computed(() => maskName(this.fullName()));
  readonly label = computed(() => ['Toca una estrella para puntuar', 'Mal', 'Regular', 'Bien', 'Muy bien', 'Me encanta'][this.hover() || this.rating()]);

  constructor() {
    afterNextRender(() => this.load());
  }

  private async load(): Promise<void> {
    if (!this.orderId || !this.token) { this.view.set('invalid'); return; }
    try {
      const res = await fetch(`/api/review?id=${encodeURIComponent(this.orderId)}&t=${encodeURIComponent(this.token)}`);
      if (this.blocked(res.status)) return;
      if (!res.ok) throw new Error();
      const d = await res.json() as { firstName: string; fullName: string; products: string[]; review: { name: string; rating: number; text: string; photos?: string[] } | null };
      this.firstName.set(d.firstName);
      this.products.set(d.products);
      this.fullName.set(d.fullName || d.firstName);
      if (d.review) {
        this.rating.set(d.review.rating);
        this.text.set(d.review.text);
        this.photos.set((d.review.photos ?? []).map(id => ({ id, publicId: id, preview: CLOUDINARY + id, uploading: false })));
        this.edit.set(true);
      }
      this.view.set('form');
    } catch {
      this.view.set('unavailable');
    }
  }

  /** El servidor solo acepta pedidos que existen en Notion y están entregados */
  private blocked(status: number): boolean {
    const view: View | null = status === 403 || status === 404 ? 'invalid' : status === 409 ? 'notDelivered' : status === 503 ? 'unavailable' : null;
    if (view) this.view.set(view);
    return !!view;
  }

  async addPhotos(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).slice(0, this.maxPhotos - this.photos().length);
    input.value = '';
    this.error.set('');
    for (const file of files) {
      const id = Math.random().toString(36).slice(2);
      try {
        const dataBase64 = await resizeImage(file);
        this.photos.update(list => [...list, { id, preview: dataBase64, uploading: true }]);
        const res = await fetch('/api/review/photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: this.orderId, token: this.token, dataBase64 }),
        });
        if (!res.ok) throw new Error();
        const { publicId } = await res.json() as { publicId: string };
        this.photos.update(list => list.map(p => (p.id === id ? { ...p, publicId, uploading: false } : p)));
      } catch {
        this.photos.update(list => list.filter(p => p.id !== id));
        this.error.set('No hemos podido subir una de las fotos. Prueba con otra o vuelve a intentarlo.');
      }
    }
  }

  removePhoto(id: string): void {
    this.photos.update(list => list.filter(p => p.id !== id));
  }

  async send(event: Event): Promise<void> {
    event.preventDefault();
    this.error.set('');
    if (!this.rating()) { this.error.set('Toca las estrellas para puntuar.'); return; }
    this.view.set('sending');
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: this.orderId, token: this.token, rating: this.rating(), text: this.text(),
          photos: this.photos().map(p => p.publicId).filter(Boolean),
        }),
      });
      if (this.blocked(res.status)) return;
      if (!res.ok) throw new Error();
      this.view.set('done');
    } catch {
      this.view.set('form');
      this.error.set('No hemos podido enviar tu valoración. Revisa la conexión y vuelve a intentarlo.');
    }
  }
}
