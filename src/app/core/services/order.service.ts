import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, timeout, throwError, catchError } from 'rxjs';
import { Order } from '../models/order.model';

const ORDER_TIMEOUT_MS = 15_000;

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);

  submitOrder(order: Order): Observable<unknown> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http
      .post('/api/order', order, { headers })
      .pipe(
        timeout({
          each: ORDER_TIMEOUT_MS,
          with: () => throwError(() => new Error('El servidor tardó demasiado. Inténtalo de nuevo.')),
        }),
        catchError(err => throwError(() => err instanceof Error ? err : new Error('Error de red')))
      );
  }
}
