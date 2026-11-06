import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogService } from './catalog.service';
import { Product, ProductCatalog } from '../models/product.model';

const product = (overrides: Partial<Product>): Product => ({
  id: 'p',
  name: 'P',
  tagline: '',
  category: 'tools',
  badge: null,
  badgeStyle: null,
  description: '',
  features: [],
  images: [],
  price: 20,
  colorPickerEnabled: false,
  available: true,
  ...overrides,
});

const mockCatalog: ProductCatalog = {
  products: [
    product({ id: 'deckbox-ventana', name: 'DeckBox', category: 'deckbox', colorPickerEnabled: true }),
    product({ id: 'aplastador-60', name: 'Aplastador 60 cartas' }),
    product({ id: 'oculto', name: 'Oculto', hidden: true }),
  ],
  categories: [
    { id: 'all',     label: 'Todo',         emoji: '🏴‍☠️' },
    { id: 'deckbox', label: 'Deckboxes',    emoji: '🃏' },
    { id: 'tools',   label: 'Herramientas', emoji: '🔨' },
  ],
  colors: [
    { id: 'negro', name: 'Negro', hex: '#1A1A1A', type: 'PLA Basic', stock: 'alto', quantity: 2, popular: true },
  ],
  addons: [],
  settings: {
    shopName: 'LayerVault',
    city: '',
    whatsappPhone: 'test',
    paymentMethods: ['Bizum'],
    deliveryDays: '3-7 días',
  },
};

describe('CatalogService', () => {
  let service: CatalogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CatalogService);
  });

  afterEach(() => vi.unstubAllGlobals());

  describe('apply()', () => {
    beforeEach(() => service.apply(mockCatalog));

    it('expone los productos visibles y deja fuera los ocultos', () => {
      expect(service.products.map(p => p.id)).toEqual(['deckbox-ventana', 'aplastador-60']);
    });

    it('expone categorías, colores y ajustes', () => {
      expect(service.categories.length).toBe(3);
      expect(service.categories[0].id).toBe('all');
      expect(service.colors[0].name).toBe('Negro');
      expect(service.settings.shopName).toBe('LayerVault');
      expect(service.settings.paymentMethods).toContain('Bizum');
    });

    it('usa una lista vacía de extras si el catálogo no los trae', () => {
      service.apply({ ...mockCatalog, addons: undefined as unknown as ProductCatalog['addons'] });
      expect(service.addons).toEqual([]);
    });

    it('getProductById() encuentra un producto existente', () => {
      expect(service.getProductById('aplastador-60')?.name).toBe('Aplastador 60 cartas');
    });

    it('getProductById() encuentra también un producto oculto (enlace directo)', () => {
      expect(service.getProductById('oculto')).toBeDefined();
    });

    it('getProductById() devuelve undefined si no existe', () => {
      expect(service.getProductById('nonexistent')).toBeUndefined();
    });
  });

  describe('load()', () => {
    it('sustituye el catálogo del seed por el de /api/products', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => mockCatalog });
      vi.stubGlobal('fetch', fetchMock);

      await service.load();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toBe('/api/products');
      expect(service.products.map(p => p.id)).toEqual(['deckbox-ventana', 'aplastador-60']);
    });

    it('mantiene el seed si la API responde con error', async () => {
      const seed = service.products;
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => mockCatalog }));

      await service.load();

      expect(service.products).toBe(seed);
    });

    it('mantiene el seed si no hay conexión', async () => {
      const seed = service.products;
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

      await service.load();

      expect(service.products).toBe(seed);
    });
  });
});
