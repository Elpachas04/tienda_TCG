import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CatalogService } from './catalog.service';
import { ProductCatalog } from '../models/product.model';

const mockCatalog: ProductCatalog = {
  products: [
    {
      id: 'deckbox-ventana',
      name: 'DeckBox',
      category: 'deckbox',
      badge: 'Más vendida',
      badgeStyle: 'gold',
      description: 'Muestra tu carta líder.',
      features: ['60 cartas enfundadas'],
      images: [],
      price: 20,
      colorPickerEnabled: true,
      available: true,
    },
    {
      id: 'aplastador-60',
      name: 'Aplastador 60 cartas',
      category: 'tools',
      badge: null,
      badgeStyle: null,
      description: 'Aplana tu mazo.',
      features: ['Sin hardware'],
      images: [],
      price: 20,
      colorPickerEnabled: false,
      available: true,
    },
  ],
  categories: [
    { id: 'all',    label: 'Todo',       emoji: '🏴‍☠️' },
    { id: 'deckbox', label: 'Deckboxes', emoji: '🃏' },
    { id: 'tools',   label: 'Herramientas', emoji: '🔨' },
  ],
  colors: [
    { id: 'negro', name: 'Negro', hex: '#1A1A1A', type: 'PLA Basic', stock: 'alto', quantity: 2, popular: true },
  ],
  settings: {
    shopName: 'LayerVault',
    city: 'Barcelona',
    telegramUsername: 'test',
    depositPercent: 50,
    paymentMethods: ['Bizum'],
    deliveryDays: '3-7 días',
  },
};

describe('CatalogService', () => {
  let service: CatalogService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service  = TestBed.inject(CatalogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getProducts() returns the products array', () => {
    service.getProducts().subscribe(products => {
      expect(products.length).toBe(2);
      expect(products[0].id).toBe('deckbox-ventana');
    });
    httpMock.expectOne('assets/data/products.json').flush(mockCatalog);
  });

  it('getCategories() returns the categories array', () => {
    service.getCategories().subscribe(cats => {
      expect(cats.length).toBe(3);
      expect(cats[0].id).toBe('all');
    });
    httpMock.expectOne('assets/data/products.json').flush(mockCatalog);
  });

  it('getColors() returns the colors array', () => {
    service.getColors().subscribe(colors => {
      expect(colors.length).toBe(1);
      expect(colors[0].name).toBe('Negro');
    });
    httpMock.expectOne('assets/data/products.json').flush(mockCatalog);
  });

  it('getSettings() returns settings', () => {
    service.getSettings().subscribe(settings => {
      expect(settings.shopName).toBe('LayerVault');
      expect(settings.depositPercent).toBe(50);
    });
    httpMock.expectOne('assets/data/products.json').flush(mockCatalog);
  });

  it('getProductById() finds existing product', () => {
    service.getProductById('aplastador-60').subscribe(p => {
      expect(p).toBeDefined();
      expect(p!.name).toBe('Aplastador 60 cartas');
    });
    httpMock.expectOne('assets/data/products.json').flush(mockCatalog);
  });

  it('getProductById() returns undefined for unknown id', () => {
    service.getProductById('nonexistent').subscribe(p => {
      expect(p).toBeUndefined();
    });
    httpMock.expectOne('assets/data/products.json').flush(mockCatalog);
  });

  it('makes only ONE HTTP request even when called multiple times (shareReplay)', () => {
    service.getProducts().subscribe();
    service.getCategories().subscribe();
    service.getColors().subscribe();

    // All three subscriptions share the single underlying HTTP request
    const requests = httpMock.match('assets/data/products.json');
    expect(requests.length).toBe(1);
    requests[0].flush(mockCatalog);
  });
});
