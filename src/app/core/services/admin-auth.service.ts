import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  // Optimista: se confirma/corrige con checkSession() al entrar en /admin
  readonly authenticated = signal(false);

  async login(password: string): Promise<boolean> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const ok = res.ok;
    this.authenticated.set(ok);
    return ok;
  }

  async logout(): Promise<void> {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    this.authenticated.set(false);
  }

  async checkSession(): Promise<boolean> {
    try {
      const res = await fetch('/api/admin/session');
      const ok = res.ok;
      this.authenticated.set(ok);
      return ok;
    } catch {
      this.authenticated.set(false);
      return false;
    }
  }
}
