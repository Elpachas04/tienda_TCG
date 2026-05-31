import { Injectable, signal, computed } from '@angular/core';
import { CartItem } from '../models/cart-item.model';
import { NOTES_MAX } from '../../shared/constants';

const CART_STORAGE_KEY = 'tcg3d_cart';
const MAX_QUANTITY = 99;

function itemKey(i: Pick<CartItem, 'productId' | 'variant' | 'color'>): string {
  return `${i.productId}|${i.variant ?? ''}|${i.color ?? ''}`;
}

function isValidCartItem(item: unknown): item is CartItem {
  if (!item || typeof item !== 'object') return false;
  const i = item as Record<string, unknown>;
  return (
    typeof i['productId'] === 'string' && i['productId'].length > 0 && i['productId'].length <= 100 &&
    typeof i['productName'] === 'string' && i['productName'].length > 0 && i['productName'].length <= 200 &&
    typeof i['quantity'] === 'number' && Number.isInteger(i['quantity']) &&
    i['quantity'] > 0 && i['quantity'] <= MAX_QUANTITY &&
    typeof i['unitPrice'] === 'number' && i['unitPrice'] > 0 && i['unitPrice'] < 100_000 &&
    (i['variant'] === undefined || (typeof i['variant'] === 'string' && i['variant'].length <= 100)) &&
    (i['color'] === undefined || (typeof i['color'] === 'string' && i['color'].length <= 100)) &&
    (i['notes'] === undefined || (typeof i['notes'] === 'string' && i['notes'].length <= 500))
  );
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private items = signal<CartItem[]>(this.loadFromStorage());

  readonly cartItems = this.items.asReadonly();
  readonly drawerOpen = signal(false);

  openDrawer()  { this.drawerOpen.set(true);  }
  closeDrawer() { this.drawerOpen.set(false); }

  readonly itemCount = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0)
  );

  readonly total = computed(() =>
    this.items().reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  );

  readonly deposit = computed(() => Math.ceil(this.total() * 0.5 * 100) / 100);

  addItem(item: CartItem): void {
    const key = itemKey(item);
    this.items.update(current => {
      const existingIndex = current.findIndex(i => itemKey(i) === key);
      let updated: CartItem[];
      if (existingIndex >= 0) {
        updated = current.map((i, idx) =>
          idx === existingIndex
            ? { ...i, quantity: Math.min(i.quantity + item.quantity, MAX_QUANTITY) }
            : i
        );
      } else {
        updated = [...current, { ...item, quantity: Math.min(item.quantity, MAX_QUANTITY) }];
      }
      this.saveToStorage(updated);
      return updated;
    });
  }

  updateQuantity(item: CartItem, quantity: number): void {
    const key = itemKey(item);
    this.items.update(current => {
      let updated: CartItem[];
      if (quantity <= 0) {
        updated = current.filter(i => itemKey(i) !== key);
      } else {
        updated = current.map(i =>
          itemKey(i) === key ? { ...i, quantity: Math.min(quantity, MAX_QUANTITY) } : i
        );
      }
      this.saveToStorage(updated);
      return updated;
    });
  }

  updateNotes(item: CartItem, notes: string): void {
    const key = itemKey(item);
    const sanitized = notes.slice(0, NOTES_MAX);
    this.items.update(current => {
      const updated = current.map(i =>
        itemKey(i) === key ? { ...i, notes: sanitized } : i
      );
      this.saveToStorage(updated);
      return updated;
    });
  }

  removeItem(item: CartItem): void {
    this.updateQuantity(item, 0);
  }

  clearCart(): void {
    this.items.set([]);
    try { localStorage.removeItem(CART_STORAGE_KEY); } catch { /* storage unavailable */ }
  }

  private loadFromStorage(): CartItem[] {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (!stored) return [];
      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isValidCartItem);
    } catch {
      return [];
    }
  }

  private saveToStorage(items: CartItem[]): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch { /* storage full or unavailable */ }
  }
}
