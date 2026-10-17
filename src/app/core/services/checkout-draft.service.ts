import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CartItem } from '../models/cart-item.model';

export interface DraftState {
  consent: boolean;
  email: string;
  name: string;
  items: CartItem[];
}

export interface RestoredDraft {
  email: string;
  name?: string;
  items: CartItem[];
}

const SAVE_DELAY_MS = 1500;

// Cesta guardada para el recordatorio de checkout abandonado (netlify/functions/checkout-draft.ts).
// Solo se envía algo al servidor si el cliente ha marcado la casilla; al desmarcarla se borra.
// Los fallos son silenciosos: el recordatorio es un extra y nunca debe molestar al hacer el pedido.
@Injectable({ providedIn: 'root' })
export class CheckoutDraftService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private timer: ReturnType<typeof setTimeout> | null = null;
  private savedFor: string | null = null;
  private lastSent = '';

  /** Llamar cada vez que cambie algo relevante; agrupa los cambios y manda una sola petición */
  sync(state: DraftState, emailValid: boolean): void {
    if (!this.browser) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(state, emailValid), SAVE_DELAY_MS);
  }

  /** El pedido se ha enviado: el servidor ya borra la cesta guardada, aquí solo se olvida el estado */
  reset(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.savedFor = null;
    this.lastSent = '';
  }

  async restore(ref: string): Promise<RestoredDraft | null> {
    if (!this.browser) return null;
    try {
      const res = await fetch(`/api/checkout-draft?recuperar=${encodeURIComponent(ref)}`);
      return res.ok ? await res.json() as RestoredDraft : null;
    } catch {
      return null;
    }
  }

  private flush(state: DraftState, emailValid: boolean): void {
    const email = state.email.trim().toLowerCase();
    const keep = state.consent && emailValid && state.items.length > 0;

    // Si cambia el email o se desmarca la casilla, se borra lo guardado con el email anterior
    if (this.savedFor && (!keep || this.savedFor !== email)) {
      this.send('DELETE', { email: this.savedFor });
      this.savedFor = null;
      this.lastSent = '';
    }
    if (!keep) return;

    const body = {
      email,
      name: state.name.trim(),
      items: state.items.map(({ productId, productName, variant, color, leader, quantity, unitPrice }) =>
        ({ productId, productName, variant, color, leader, quantity, unitPrice })),
    };
    const serialized = JSON.stringify(body);
    if (serialized === this.lastSent) return;
    this.lastSent = serialized;
    this.savedFor = email;
    this.send('POST', body);
  }

  private send(method: 'POST' | 'DELETE', body: object): void {
    fetch('/api/checkout-draft', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => { /* el recordatorio es opcional */ });
  }
}
