import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Product, ProductCatalog, CategoryItem, Color, ShopSettings, ProductAddon } from '../models/product.model';
import seedData from '../../../assets/data/products.json';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly platformId = inject(PLATFORM_ID);
  // Seed local — se sustituye por el catálogo del blob al llamar a load()
  private catalog: ProductCatalog = seedData as unknown as ProductCatalog;

  products:   readonly Product[]      = this.catalog.products.filter(p => !p.hidden);
  categories: readonly CategoryItem[] = this.catalog.categories;
  colors:     readonly Color[]        = this.catalog.colors;
  addons:     readonly ProductAddon[] = this.catalog.addons ?? [];
  settings:   Readonly<ShopSettings>  = this.catalog.settings;

  /** Se llama desde el APP_INITIALIZER — si falla, se mantiene el seed local */
  async load(): Promise<void> {
    // Al prerenderizar no hay servidor de API: se usa el catálogo del build (ver scripts/prebuild.mjs)
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      // no-cache: revalida siempre, para que un cambio hecho en el admin se vea al recargar
      const res = await fetch('/api/products', { cache: 'no-cache' });
      if (!res.ok) return;
      this.apply(await res.json() as ProductCatalog);
    } catch {
      // sin conexión con /api/products — se mantiene el seed local
    }
  }

  /** También lo usa el admin al guardar, para que la tienda refleje el cambio sin recargar */
  apply(data: ProductCatalog): void {
    this.catalog    = data;
    this.products   = data.products.filter(p => !p.hidden);
    this.categories = data.categories;
    this.colors     = data.colors;
    this.addons     = data.addons ?? [];
    this.settings   = data.settings;
  }

  getProductById(id: string): Product | undefined {
    return this.catalog.products.find(p => p.id === id);
  }
}
