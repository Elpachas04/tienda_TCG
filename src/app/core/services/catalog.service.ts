import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { Product, ProductCatalog, CategoryItem } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);

  private catalog$ = this.http
    .get<ProductCatalog>('assets/data/products.json')
    .pipe(shareReplay(1));

  getProducts(): Observable<Product[]> {
    return this.catalog$.pipe(map(c => c.products));
  }

  getCategories(): Observable<CategoryItem[]> {
    return this.catalog$.pipe(map(c => c.categories));
  }

  getSettings() {
    return this.catalog$.pipe(map(c => c.settings));
  }

  getProductById(id: string): Observable<Product | undefined> {
    return this.getProducts().pipe(
      map(products => products.find(p => p.id === id))
    );
  }
}
