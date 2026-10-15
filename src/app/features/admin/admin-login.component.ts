import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  host: { class: 'block animate-fade-up' },
  template: `
    <div class="bg-lv-black min-h-screen flex items-center justify-center px-4">
      <form class="w-full max-w-sm liquid-glass rounded-card border border-lv-border p-8" (submit)="onSubmit($event)">
        <h1 class="font-display text-lv-cream text-3xl mb-1">LayerVault</h1>
        <p class="font-body text-[13px] text-lv-gold mb-6">Panel de administración</p>

        <label class="block font-body text-xs text-lv-muted mb-2">Contraseña</label>
        <input type="password"
          class="w-full bg-white/[0.03] border border-lv-border rounded-xl px-4 py-3 font-body text-base text-lv-cream focus:outline-none focus:border-lv-gold/40 transition-colors"
          [(ngModel)]="password"
          name="password"
          autocomplete="current-password"
          autofocus />

        @if (error()) {
          <p class="text-red-400 font-body text-xs mt-2">{{ error() }}</p>
        }

        <button type="submit"
          class="w-full mt-6 bg-lv-gold hover:brightness-110 text-black font-body text-[13px] font-semibold rounded-full py-3.5 transition-all duration-200 disabled:opacity-50"
          [disabled]="submitting() || !password">
          {{ submitting() ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>
    </div>
  `,
})
export class AdminLoginComponent {
  private readonly authService = inject(AdminAuthService);
  private readonly router = inject(Router);

  password    = '';
  submitting  = signal(false);
  error       = signal('');

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.password) return;
    this.submitting.set(true);
    this.error.set('');
    try {
      const ok = await this.authService.login(this.password);
      if (ok) {
        this.router.navigate(['/admin']);
      } else {
        this.error.set('Contraseña incorrecta');
      }
    } catch {
      this.error.set('Error de conexión');
    } finally {
      this.submitting.set(false);
    }
  }
}
