import { Injectable, inject, signal } from '@angular/core';
import { Product, ProductCatalog } from '../models/product.model';
import { CatalogService } from './catalog.service';

@Injectable({ providedIn: 'root' })
export class AdminCatalogService {
  private readonly shopCatalog = inject(CatalogService);

  // Catálogo completo sin filtrar (incluye productos ocultos) — solo para el panel
  readonly catalog = signal<ProductCatalog | null>(null);
  readonly loading = signal(false);

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await fetch('/api/products', { cache: 'no-cache' });
      if (!res.ok) throw new Error('fetch_failed');
      this.catalog.set(await res.json() as ProductCatalog);
    } finally {
      this.loading.set(false);
    }
  }

  async saveProducts(products: Product[]): Promise<boolean> {
    const res = await fetch('/api/admin/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products }),
    });
    if (res.ok) {
      const current = this.catalog();
      if (current) this.publish({ ...current, products });
    }
    return res.ok;
  }

  async saveCatalogSections(updates: Partial<Pick<ProductCatalog, 'categories' | 'colors' | 'addons' | 'bulk_boxes' | 'settings'>>): Promise<boolean> {
    const res = await fetch('/api/admin/catalog', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const current = this.catalog();
      if (current) this.publish({ ...current, ...updates });
    }
    return res.ok;
  }

  async uploadImage(productId: string, dataBase64: string, sequence?: string): Promise<string | null> {
    const res = await fetch('/api/admin/image-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, dataBase64, sequence }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { publicId: string };
    return data.publicId;
  }

  private publish(catalog: ProductCatalog): void {
    this.catalog.set(catalog);
    this.shopCatalog.apply(catalog);
  }
}
