import { Injectable } from '@angular/core';
import { Product, ProductCatalog, CategoryItem, Color, ShopSettings } from '../models/product.model';
import productsData from '../../../assets/data/products.json';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly catalog = productsData as unknown as ProductCatalog;

  // Datos leídos una sola vez del JSON bundleado — no hay suscripciones ni recálculo
  readonly products:   readonly Product[]        = this.catalog.products;
  readonly categories: readonly CategoryItem[]   = this.catalog.categories;
  readonly colors:     readonly Color[]          = this.catalog.colors;
  readonly settings:   Readonly<ShopSettings>    = this.catalog.settings;

  getProductById(id: string): Product | undefined {
    return this.catalog.products.find(p => p.id === id);
  }
}
