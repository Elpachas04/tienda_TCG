import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Product, ProductCatalog, CategoryItem, Color, ShopSettings } from '../models/product.model';
import productsData from '../../../assets/data/products.json';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly catalog = productsData as unknown as ProductCatalog;

  getProducts(): Observable<Product[]> {
    return of(this.catalog.products);
  }

  getCategories(): Observable<CategoryItem[]> {
    return of(this.catalog.categories);
  }

  getColors(): Observable<Color[]> {
    return of(this.catalog.colors);
  }

  getSettings(): Observable<ShopSettings> {
    return of(this.catalog.settings);
  }

  getProductById(id: string): Observable<Product | undefined> {
    return of(this.catalog.products.find(p => p.id === id));
  }
}
