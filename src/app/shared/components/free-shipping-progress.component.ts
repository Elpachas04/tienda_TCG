import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EurPipe } from '../pipes/eur.pipe';
import { SHIPPING, shippingCostFor } from '../constants/shop-policy';

// Cuánto falta para el envío gratis. El umbral sale de shop-policy.ts, el mismo que aplican el checkout y el servidor.
@Component({
  selector: 'app-free-shipping-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EurPipe],
  template: `
    <div class="space-y-2">
      <p class="font-body text-[13px] leading-snug" aria-live="polite"
         [class]="reached() ? 'text-lv-gold' : 'text-lv-cream/70'">
        @if (reached()) {
          Tu envío a Península es gratis
        } @else {
          Te faltan <span class="font-semibold text-lv-cream">{{ remaining() | eur }}</span> para el envío gratis
        }
      </p>
      <div class="h-1.5 rounded-full bg-white/[0.06] overflow-hidden"
           role="progressbar" aria-label="Progreso hacia el envío gratis"
           aria-valuemin="0" [attr.aria-valuemax]="threshold" [attr.aria-valuenow]="clamped()">
        <div class="h-full rounded-full bg-lv-gold transition-[width] duration-500 ease-out motion-reduce:transition-none"
             [style.width.%]="percent()"></div>
      </div>
    </div>
  `,
})
export class FreeShippingProgressComponent {
  readonly subtotal = input.required<number>();

  protected readonly threshold = SHIPPING.freeFrom;
  protected readonly reached   = computed(() => shippingCostFor(this.subtotal()) === 0);
  protected readonly clamped   = computed(() => Math.min(this.subtotal(), this.threshold));
  protected readonly remaining = computed(() => Math.max(0, this.threshold - this.subtotal()));
  protected readonly percent   = computed(() => (this.clamped() / this.threshold) * 100);
}
