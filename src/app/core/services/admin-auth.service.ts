import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// La cookie de sesión es HttpOnly y JS no la ve: esta marca solo indica que merece la pena
// preguntar al servidor, para no llamar a /api/admin/session en cada visita de un cliente.
const HINT_KEY = 'lv_admin';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // Optimista: se confirma/corrige con checkSession() al entrar en /admin
  readonly authenticated = signal(false);

  async login(password: string): Promise<boolean> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const ok = res.ok;
    this.setAuthenticated(ok);
    return ok;
  }

  async logout(): Promise<void> {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    this.setAuthenticated(false);
  }

  async checkSession(): Promise<boolean> {
    try {
      const res = await fetch('/api/admin/session');
      const ok = res.ok;
      this.setAuthenticated(ok);
      return ok;
    } catch {
      this.setAuthenticated(false);
      return false;
    }
  }

  /** Recupera la sesión al cargar la web, solo en el navegador de quien ya entró como admin */
  restore(): void {
    if (this.readHint()) void this.checkSession();
  }

  private setAuthenticated(ok: boolean): void {
    this.authenticated.set(ok);
    if (!this.isBrowser) return;
    try {
      if (ok) localStorage.setItem(HINT_KEY, '1');
      else localStorage.removeItem(HINT_KEY);
    } catch { /* almacenamiento bloqueado: la pestaña simplemente no aparece */ }
  }

  private readHint(): boolean {
    if (!this.isBrowser) return false;
    try { return localStorage.getItem(HINT_KEY) === '1'; } catch { return false; }
  }
}
