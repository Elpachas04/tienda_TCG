import { ChangeDetectionStrategy, Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { AdminCatalogService } from '../../core/services/admin-catalog.service';
import { REFERRAL } from '../../shared/constants/shop-policy';

interface ReferralStats {
  inviteCodes: number;
  invitesUsed: number;
  pendingRewards: number;
  rewardsIssued: number;
  rewardsUsed: number;
}

// Invitaciones "invita a un nakama": interruptor y cifras. Las reglas e importes están en shop-policy.ts → REFERRAL.
@Component({
  selector: 'app-admin-referrals',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <h1 class="font-display text-3xl text-lv-cream">Invitaciones</h1>
      <button type="button" role="switch" [attr.aria-checked]="enabled()"
              class="flex items-center gap-3 rounded-xl border border-lv-border px-4 py-2.5 hover:bg-white/[0.03] disabled:opacity-50"
              [disabled]="saving() || !catalogReady()" (click)="toggle()">
        <span class="font-body text-sm text-lv-cream/80">Activadas</span>
        <span class="relative w-10 h-6 rounded-full transition-colors flex-shrink-0" [class]="enabled() ? 'bg-emerald-500/80' : 'bg-white/15'">
          <span class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform" [class.translate-x-4]="enabled()"></span>
        </span>
      </button>
    </div>

    @if (error()) {
      <p class="font-body text-sm text-red-400 mb-4">{{ error() }}</p>
    }

    <div class="font-body text-sm text-lv-muted space-y-2 max-w-2xl mb-8">
      @if (enabled()) {
        <p>Están activas. Cada cliente recibe su código personal en el email de «Entregado» y el checkout muestra el campo «Código de descuento».</p>
      } @else {
        <p>Están apagadas: no se reparten códigos y el checkout no enseña el campo. Los vales que ya se hayan prometido se siguen mandando.</p>
      }
      <ul class="list-disc pl-5 space-y-1">
        <li>El amigo tiene {{ rules.friendDiscount }} € de descuento en su primer pedido desde {{ rules.minSubtotal }} € (una vez por email; no vale el propio código).</li>
        <li>Cuando ese pedido pasa a «Entregado», quien invitó recibe un vale de {{ rules.referrerReward }} € de un solo uso, válido {{ rules.rewardValidDays }} días.</li>
        <li>No se suma a ₿erry: se aplica el descuento mayor. Sí es compatible con el envío gratis.</li>
      </ul>
    </div>

    @if (stats(); as s) {
      <dl class="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
        @for (item of [
          { label: 'Códigos repartidos', value: s.inviteCodes },
          { label: 'Amigos que lo usaron', value: s.invitesUsed },
          { label: 'Vales pendientes de entrega', value: s.pendingRewards },
          { label: 'Vales usados / dados', value: s.rewardsUsed + ' / ' + s.rewardsIssued },
        ]; track item.label) {
          <div class="rounded-xl border border-lv-border px-4 py-3">
            <dt class="font-body text-xs text-lv-muted">{{ item.label }}</dt>
            <dd class="font-display text-2xl text-lv-cream mt-1">{{ item.value }}</dd>
          </div>
        }
      </dl>
    }
  `,
})
export class AdminReferralsComponent {
  private readonly admin = inject(AdminCatalogService);

  readonly rules = REFERRAL;
  readonly saving = signal(false);
  readonly error = signal('');
  readonly stats = signal<ReferralStats | null>(null);
  readonly catalogReady = computed(() => !!this.admin.catalog());
  readonly enabled = computed(() => !!this.admin.catalog()?.settings?.referralsEnabled);

  constructor() {
    afterNextRender(() => {
      if (!this.admin.catalog()) this.admin.load().catch(() => {});
      this.loadStats();
    });
  }

  async loadStats(): Promise<void> {
    try {
      const res = await fetch('/api/admin/referrals');
      if (res.ok) this.stats.set(await res.json());
    } catch { /* las cifras son orientativas */ }
  }

  async toggle(): Promise<void> {
    const settings = this.admin.catalog()?.settings;
    if (!settings) return;
    this.saving.set(true);
    this.error.set('');
    const ok = await this.admin.saveCatalogSections({ settings: { ...settings, referralsEnabled: !settings.referralsEnabled } }).catch(() => false);
    if (!ok) this.error.set('No se ha podido cambiar. Prueba otra vez.');
    this.saving.set(false);
  }
}
