import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { OficinaCorreos } from '../models/oficina.model';

@Injectable({ providedIn: 'root' })
export class OficinaService {
  private http = inject(HttpClient);

  private oficinas$ = this.http
    .get<OficinaCorreos[]>('assets/data/oficinas.json')
    .pipe(shareReplay(1));

  // Índice por prefijo de CP (2 dígitos) construido una sola vez tras la carga.
  // Reduce búsquedas por CP de O(n) a O(1) lookup + O(k) results.
  private index$ = this.oficinas$.pipe(
    map(oficinas => {
      const idx = new Map<string, OficinaCorreos[]>();
      for (const o of oficinas) {
        const prefix = o.codigoPostal.slice(0, 2);
        const bucket = idx.get(prefix);
        if (bucket) bucket.push(o);
        else idx.set(prefix, [o]);
      }
      return idx;
    }),
    shareReplay(1)
  );

  getOficinas(): Observable<OficinaCorreos[]> {
    return this.oficinas$;
  }

  buscarOficinas(termino: string): Observable<OficinaCorreos[]> {
    const clean = termino.toLowerCase().trim();
    if (!clean) return this.oficinas$.pipe(map(() => []));

    // Si el término parece un CP, usar el índice de prefijos
    if (/^\d/.test(clean)) {
      return this.index$.pipe(
        map(idx => {
          const prefix = clean.slice(0, 2);
          const bucket = idx.get(prefix) ?? [];
          return bucket.filter(o => o.codigoPostal.startsWith(clean));
        })
      );
    }

    // Búsqueda por nombre de localidad (full scan necesario, pero solo para texto)
    return this.oficinas$.pipe(
      map(oficinas => oficinas.filter(o =>
        o.localidad.toLowerCase().includes(clean) ||
        o.nombre.toLowerCase().includes(clean)
      ))
    );
  }
}
