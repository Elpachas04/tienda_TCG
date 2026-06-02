import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { CartItem } from '../models/cart-item.model';

const item = (overrides: Partial<CartItem> = {}): CartItem => ({
  productId:   'p1',
  productName: 'DeckBox',
  quantity:    1,
  unitPrice:   20,
  ...overrides,
});

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  it('starts empty when localStorage is clear', () => {
    expect(service.cartItems()).toEqual([]);
    expect(service.itemCount()).toBe(0);
    expect(service.total()).toBe(0);
  });

  // ── addItem ────────────────────────────────────────────────────────────────

  it('adds a new item', () => {
    service.addItem(item());
    expect(service.cartItems().length).toBe(1);
    expect(service.cartItems()[0].productName).toBe('DeckBox');
  });

  it('merges duplicate (same productId + variant + color)', () => {
    service.addItem(item({ variant: 'A', color: 'Rojo', quantity: 1 }));
    service.addItem(item({ variant: 'A', color: 'Rojo', quantity: 2 }));
    expect(service.cartItems().length).toBe(1);
    expect(service.cartItems()[0].quantity).toBe(3);
  });

  it('keeps separate lines for different colors of the same product', () => {
    service.addItem(item({ color: 'Rojo' }));
    service.addItem(item({ color: 'Azul' }));
    expect(service.cartItems().length).toBe(2);
  });

  it('keeps separate lines for different variants', () => {
    service.addItem(item({ variant: 'Pequeña', unitPrice: 10 }));
    service.addItem(item({ variant: 'Grande',  unitPrice: 15 }));
    expect(service.cartItems().length).toBe(2);
  });

  it('caps quantity at 99 when adding', () => {
    service.addItem(item({ quantity: 50 }));
    service.addItem(item({ quantity: 60 }));
    expect(service.cartItems()[0].quantity).toBe(99);
  });

  // ── totals ─────────────────────────────────────────────────────────────────

  it('calculates total correctly', () => {
    service.addItem(item({ unitPrice: 20, quantity: 2 }));
    service.addItem(item({ productId: 'p2', productName: 'Aplastador', unitPrice: 25, quantity: 1 }));
    expect(service.total()).toBe(65);
  });

  it('calculates itemCount as sum of quantities', () => {
    service.addItem(item({ quantity: 3 }));
    service.addItem(item({ productId: 'p2', productName: 'X', quantity: 2, unitPrice: 5 }));
    expect(service.itemCount()).toBe(5);
  });

  // ── updateQuantity ─────────────────────────────────────────────────────────

  it('updates quantity', () => {
    service.addItem(item());
    service.updateQuantity(service.cartItems()[0], 5);
    expect(service.cartItems()[0].quantity).toBe(5);
  });

  it('removes item when quantity set to 0', () => {
    service.addItem(item());
    service.updateQuantity(service.cartItems()[0], 0);
    expect(service.cartItems()).toEqual([]);
  });

  it('caps updateQuantity at 99', () => {
    service.addItem(item());
    service.updateQuantity(service.cartItems()[0], 200);
    expect(service.cartItems()[0].quantity).toBe(99);
  });

  // ── updateNotes ────────────────────────────────────────────────────────────

  it('updates notes for correct item', () => {
    service.addItem(item());
    service.updateNotes(service.cartItems()[0], 'acabado mate');
    expect(service.cartItems()[0].notes).toBe('acabado mate');
  });

  it('truncates notes at 500 chars', () => {
    service.addItem(item());
    service.updateNotes(service.cartItems()[0], 'x'.repeat(600));
    expect(service.cartItems()[0].notes!.length).toBe(500);
  });

  // ── removeItem ─────────────────────────────────────────────────────────────

  it('removes the correct item leaving others intact', () => {
    service.addItem(item({ productId: 'p1', color: 'Rojo' }));
    service.addItem(item({ productId: 'p1', color: 'Azul' }));
    service.removeItem(service.cartItems()[0]);
    expect(service.cartItems().length).toBe(1);
    expect(service.cartItems()[0].color).toBe('Azul');
  });

  // ── clearCart ──────────────────────────────────────────────────────────────

  it('clears all items and localStorage', () => {
    service.addItem(item());
    service.clearCart();
    expect(service.cartItems()).toEqual([]);
    expect(localStorage.getItem('tcg3d_cart')).toBeNull();
  });

  // ── localStorage persistence ───────────────────────────────────────────────

  it('persists items to localStorage', () => {
    service.addItem(item());
    const stored = JSON.parse(localStorage.getItem('tcg3d_cart')!);
    expect(stored.length).toBe(1);
    expect(stored[0].productName).toBe('DeckBox');
  });

  it('loads valid items from localStorage on init', () => {
    const saved: CartItem[] = [item({ quantity: 3 })];
    localStorage.setItem('tcg3d_cart', JSON.stringify(saved));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const fresh = TestBed.inject(CartService);
    expect(fresh.cartItems().length).toBe(1);
    expect(fresh.cartItems()[0].quantity).toBe(3);
  });

  it('ignores malformed localStorage data', () => {
    localStorage.setItem('tcg3d_cart', 'not-json{{{{');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const fresh = TestBed.inject(CartService);
    expect(fresh.cartItems()).toEqual([]);
  });

  it('ignores items with invalid structure from localStorage', () => {
    const bad = [{ productId: '', productName: 'X', quantity: 1, unitPrice: 5 }];
    localStorage.setItem('tcg3d_cart', JSON.stringify(bad));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const fresh = TestBed.inject(CartService);
    expect(fresh.cartItems()).toEqual([]);
  });

  it('ignores items with negative price from localStorage', () => {
    const bad = [{ productId: 'p1', productName: 'X', quantity: 1, unitPrice: -5 }];
    localStorage.setItem('tcg3d_cart', JSON.stringify(bad));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const fresh = TestBed.inject(CartService);
    expect(fresh.cartItems()).toEqual([]);
  });
});
