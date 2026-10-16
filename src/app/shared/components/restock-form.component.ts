import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

// En un producto agotado: deja tu email y te avisamos una vez cuando vuelva (restock-subscribe.ts).
@Component({
  selector: 'app-restock-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="mt-5 rounded-card border border-lv-cream/10 bg-white/[0.03] p-5" aria-live="polite">
      @if (state() === 'done') {
        <p class="text-[16px] font-semibold text-lv-cream">Te avisaremos</p>
        <p class="mt-1 text-[14px] text-lv-cream/70">Cuando {{ productName() }} vuelva te escribimos a {{ email() }}. Solo esa vez.</p>
      } @else {
        <p id="restock-title" class="text-[16px] font-semibold text-lv-cream">Avísame cuando vuelva</p>
        <p class="mt-1 text-[14px] text-lv-cream/70">Te escribimos una sola vez, cuando se pueda pedir de nuevo.</p>
        <form class="mt-4 flex flex-col sm:flex-row gap-2" (submit)="send($event)" novalidate aria-labelledby="restock-title">
          <label for="restock-email" class="sr-only">Tu email</label>
          <input id="restock-email" type="email" autocomplete="email" inputmode="email" required aria-required="true"
                 [value]="email()" (input)="email.set($any($event.target).value)" placeholder="tu@email.com"
                 [attr.aria-invalid]="state() === 'invalid'"
                 class="w-full sm:flex-1 min-w-0 h-12 rounded-full bg-white/[0.05] border border-lv-cream/15 px-4 text-[16px] text-lv-cream placeholder:text-lv-cream/40 focus:border-lv-gold/60 focus:outline-none" />
          <!-- Honeypot para bots: invisible -->
          <div aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;">
            <input type="text" name="website" tabindex="-1" autocomplete="off" (input)="hp = $any($event.target).value" />
          </div>
          <button type="submit" class="lv-btn lv-btn-primary h-12 flex-shrink-0" [disabled]="state() === 'sending'">
            {{ state() === 'sending' ? 'Guardando…' : 'Avisarme' }}
          </button>
        </form>
        @if (state() === 'invalid') {
          <p class="mt-2 text-[14px] text-red-300" role="alert">Revisa el email, parece que le falta algo.</p>
        } @else if (state() === 'error') {
          <p class="mt-2 text-[14px] text-red-300" role="alert">No hemos podido guardarlo. Vuelve a intentarlo en un momento.</p>
        }
      }
    </div>
  `,
})
export class RestockFormComponent {
  readonly productId = input.required<string>();
  readonly productName = input.required<string>();
  readonly email = signal('');
  readonly state = signal<'idle' | 'sending' | 'done' | 'invalid' | 'error'>('idle');
  hp = '';

  async send(event: Event): Promise<void> {
    event.preventDefault();
    const email = this.email().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { this.state.set('invalid'); document.getElementById('restock-email')?.focus(); return; }
    this.state.set('sending');
    try {
      const res = await fetch('/api/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: this.productId(), email, website: this.hp }),
      });
      if (res.status === 400) { this.state.set('invalid'); return; }
      if (!res.ok && res.status !== 409) throw new Error();
      this.state.set('done');
    } catch {
      this.state.set('error');
    }
  }
}
