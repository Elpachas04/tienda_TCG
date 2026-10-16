import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { Answer, FaqItem, Knowledge, answer, generalFaq, productFaq } from '../../core/assistant/shop-knowledge';
import { AssistantService } from '../../core/assistant/assistant.service';

interface Message { from: 'user' | 'bot'; text: string; link?: Answer['link'] }

// Asistente de preguntas sin IA ni coste: responde con los datos del catálogo (shop-knowledge.ts)
// y, cuando no sabe algo, lleva a WhatsApp con la pregunta ya escrita. En cada ficha la conversación empieza
// de cero con las preguntas frecuentes de ese producto.
@Component({
  selector: 'app-shop-assistant',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  host: { class: 'block' },
  template: `
    @if (visible()) {
      @if (!open()) {
        <!-- En la ficha no: allí hay un enlace junto al precio y el botón tapaba "Añadir a la cesta" -->
        @if (!product()) {
        <button type="button" (click)="openPanel()"
                class="fixed z-50 right-4 bottom-4 sm:right-6 sm:bottom-6 flex items-center gap-2 h-12 pl-4 pr-5 rounded-full
                       bg-lv-surface border border-lv-gold/40 text-lv-cream font-semibold text-[15px] shadow-[0_12px_30px_-10px_rgba(0,0,0,.8)]
                       hover:border-lv-gold hover:text-lv-foil transition-colors"
                aria-haspopup="dialog">
          <svg class="w-5 h-5 text-lv-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9.75h7.5M8.25 13.5h4.5M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.555-.337A5.97 5.97 0 015.41 20.97a5.97 5.97 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
          </svg>
          ¿Dudas?
        </button>
        }
      } @else {
        <div role="dialog" aria-modal="false" aria-labelledby="assistant-title" (keydown.escape)="close()"
             class="fixed z-50 inset-x-3 bottom-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[380px] max-h-[min(640px,80svh)] flex flex-col
                    rounded-card border border-lv-gold/30 bg-[#161513] shadow-[0_30px_80px_-20px_rgba(0,0,0,.9)]">
          <header class="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-lv-cream/10">
            <div>
              <h2 id="assistant-title" class="text-[17px] font-semibold text-lv-cream">
                {{ product() ? 'Dudas sobre ' + product()!.name : 'Preguntas rápidas' }}
              </h2>
              <p class="text-[13px] text-lv-cream/60 mt-0.5">Respuestas al momento con los datos de la tienda.</p>
            </div>
            <button type="button" (click)="close()" aria-label="Cerrar"
                    class="w-9 h-9 -mr-1 grid place-items-center rounded-full text-lv-cream/60 hover:text-lv-cream hover:bg-white/[0.06]">✕</button>
          </header>

          <div #log class="flex-1 overflow-y-auto px-4 py-4 space-y-3" aria-live="polite" data-lenis-prevent>
            @for (m of messages(); track $index) {
              <div [class]="m.from === 'user' ? 'flex justify-end' : 'flex'">
                <div class="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-snug"
                     [class]="m.from === 'user' ? 'bg-lv-cream text-lv-black rounded-br-md' : 'bg-white/[0.06] text-lv-cream rounded-bl-md'">
                  <p>{{ m.text }}</p>
                  @if (m.link; as link) {
                    @if (link.external) {
                      <a [href]="link.url" target="_blank" rel="noopener noreferrer" class="lv-link inline-block mt-1.5 text-sm">{{ link.label }}</a>
                    } @else {
                      <a [routerLink]="link.url" (click)="close()" class="lv-link inline-block mt-1.5 text-sm">{{ link.label }}</a>
                    }
                  }
                </div>
              </div>
            }

            @if (!started()) {
              <ul class="pt-1 space-y-1.5" aria-label="Preguntas frecuentes">
                @for (item of faq(); track item.q) {
                  <li>
                    <button type="button" (click)="askFaq(item)"
                            class="w-full text-left px-3.5 py-2.5 rounded-xl border border-lv-cream/10 text-[15px] text-lv-cream/90
                                   hover:border-lv-gold/70 hover:text-lv-foil transition-colors">
                      {{ item.q }}
                    </button>
                  </li>
                }
              </ul>
            }
          </div>

          @if (started() && more().length) {
            <div class="px-4 pb-2 flex flex-wrap gap-1.5" aria-label="Más preguntas">
              @for (item of more(); track item.q) {
                <button type="button" (click)="askFaq(item)"
                        class="h-8 px-3 rounded-full border border-lv-cream/15 text-[13px] text-lv-cream/80 hover:border-lv-gold hover:text-lv-foil">
                  {{ item.q }}
                </button>
              }
            </div>
          }

          <form class="flex gap-2 p-3 border-t border-lv-cream/10" (submit)="send($event)">
            <label for="assistant-input" class="sr-only">Tu pregunta</label>
            <input #input id="assistant-input" type="text" autocomplete="off" maxlength="200"
                   [placeholder]="product() ? 'Pregunta sobre ' + product()!.name + '…' : 'Escribe tu pregunta…'"
                   class="flex-1 min-w-0 h-11 rounded-full bg-white/[0.05] border border-lv-cream/15 px-4 text-[15px] text-lv-cream placeholder:text-lv-cream/45 focus:border-lv-gold/60 focus:outline-none" />
            <button type="submit" class="h-11 px-4 rounded-full bg-lv-cream text-lv-black font-semibold text-[15px] hover:bg-white">Enviar</button>
          </form>
        </div>
      }
    }
  `,
})
export class ShopAssistantComponent {
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogService);
  private readonly assistant = inject(AssistantService);
  private readonly input = viewChild<ElementRef<HTMLInputElement>>('input');
  private readonly log = viewChild<ElementRef<HTMLElement>>('log');

  readonly open = this.assistant.open;
  readonly messages = signal<Message[]>([]);
  private readonly asked = signal<ReadonlySet<string>>(new Set());

  private readonly url = toSignal(
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), map(() => this.router.url), startWith(this.router.url)),
    { initialValue: this.router.url },
  );

  // Fuera del flujo de compra y del panel: ahí estorba
  readonly visible = computed(() => !/^\/(checkout|admin|valorar)/.test(this.url()));

  readonly product = computed(() => {
    const id = this.url().match(/^\/product\/([^/?#]+)/)?.[1];
    return id ? this.catalog.getProductById(decodeURIComponent(id)) ?? null : null;
  });

  readonly faq = computed((): FaqItem[] => {
    const p = this.product();
    return p ? productFaq(p, this.knowledge()) : generalFaq(this.knowledge());
  });

  readonly started = computed(() => this.messages().some(m => m.from === 'user'));
  readonly more = computed(() => this.faq().filter(f => !this.asked().has(f.q)).slice(0, 3));

  constructor() {
    // Cada producto tiene su conversación: al cambiar de ficha se empieza de cero
    effect(() => {
      this.product()?.id;
      untracked(() => {
        this.asked.set(new Set());
        this.messages.set(this.open() ? [this.greeting()] : []);
      });
    });
    effect(() => {
      if (!this.open()) return;
      untracked(() => {
        if (!this.messages().length) this.messages.set([this.greeting()]);
        setTimeout(() => this.input()?.nativeElement.focus(), 30);
      });
    });
  }

  private knowledge(): Knowledge {
    return { products: this.catalog.products, colors: this.catalog.colors, addons: this.catalog.addons, settings: this.catalog.settings };
  }

  private greeting(): Message {
    const p = this.product();
    return { from: 'bot', text: p
      ? `Hola. Estas son las dudas más habituales sobre ${p.name}. Toca una o escribe la tuya.`
      : 'Hola. Estas son las dudas más habituales. Toca una o escribe la tuya.' };
  }

  openPanel(): void { this.assistant.show(); }
  close(): void { this.assistant.hide(); }

  send(event: Event): void {
    event.preventDefault();
    const el = this.input()?.nativeElement;
    const q = el?.value.trim() ?? '';
    if (!q) return;
    el!.value = '';
    this.push(q, answer(q, this.knowledge(), this.product()));
  }

  askFaq(item: FaqItem): void {
    this.asked.update(set => new Set(set).add(item.q));
    this.push(item.q, item.a);
  }

  private push(question: string, a: Answer): void {
    this.messages.update(list => [...list, { from: 'user', text: question }, { from: 'bot', text: a.text, link: a.link }]);
    setTimeout(() => { const log = this.log()?.nativeElement; if (log) log.scrollTop = log.scrollHeight; }, 30);
  }
}
