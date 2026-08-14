import { Injectable } from '@angular/core';
import { Product, ProductCatalog, CategoryItem, Color, ShopSettings, ProductAddon } from '../models/product.model';
import seedData from '../../../assets/data/products.json';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  // Seed local — se sustituye por el catálogo del blob al llamar a load()
  private catalog: ProductCatalog = seedData as unknown as ProductCatalog;

  products:   readonly Product[]      = this.catalog.products.filter(p => !p.hidden);
  categories: readonly CategoryItem[] = this.catalog.categories;
  colors:     readonly Color[]        = this.catalog.colors;
  addons:     readonly ProductAddon[] = this.catalog.addons ?? [];
  settings:   Readonly<ShopSettings>  = this.catalog.settings;

  /** Se llama desde el APP_INITIALIZER — si falla, se mantiene el seed local */
  async load(): Promise<void> {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) return;
      const data = await res.json() as ProductCatalog;
      this.catalog    = data;
      this.products   = data.products.filter(p => !p.hidden);
      this.categories = data.categories;
      this.colors     = data.colors;
      this.addons     = data.addons ?? [];
      this.settings   = data.settings;
    } catch {
      // sin conexión con /api/products — se mantiene el seed local
    }
  }

  getProductById(id: string): Product | undefined {
    return this.catalog.products.find(p => p.id === id);
  }
}
