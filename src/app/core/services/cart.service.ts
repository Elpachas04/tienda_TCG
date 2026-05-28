import { Injectable, signal, computed } from '@angular/core';
import { CartItem } from '../models/cart-item.model';

const CART_STORAGE_KEY = 'tcg3d_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private items = signal<CartItem[]>(this.loadFromStorage());

  readonly cartItems = this.items.asReadonly();

  readonly itemCount = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0)
  );

  readonly total = computed(() =>
    this.items().reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  );

  readonly deposit = computed(() => Math.ceil(this.total() * 0.5 * 100) / 100);

  addItem(item: CartItem): void {
    this.items.update(current => {
      const existingIndex = current.findIndex(
        i => i.productId === item.productId && i.variant === item.variant
      );
      let updated: CartItem[];
      if (existingIndex >= 0) {
        updated = current.map((i, idx) =>
          idx === existingIndex ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      } else {
        updated = [...current, item];
      }
      this.saveToStorage(updated);
      return updated;
    });
  }

  updateQuantity(productId: string, variant: string | undefined, quantity: number): void {
    this.items.update(current => {
      let updated: CartItem[];
      if (quantity <= 0) {
        updated = current.filter(
          i => !(i.productId === productId && i.variant === variant)
        );
      } else {
        updated = current.map(i =>
          i.productId === productId && i.variant === variant
            ? { ...i, quantity }
            : i
        );
      }
      this.saveToStorage(updated);
      return updated;
    });
  }

  updateNotes(productId: string, variant: string | undefined, notes: string): void {
    this.items.update(current => {
      const updated = current.map(i =>
        i.productId === productId && i.variant === variant ? { ...i, notes } : i
      );
      this.saveToStorage(updated);
      return updated;
    });
  }

  removeItem(productId: string, variant: string | undefined): void {
    this.updateQuantity(productId, variant, 0);
  }

  clearCart(): void {
    this.items.set([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  }

  private loadFromStorage(): CartItem[] {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(items: CartItem[]): void {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }
}
