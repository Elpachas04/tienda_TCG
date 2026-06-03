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

  getOficinas(): Observable<OficinaCorreos[]> {
    return this.oficinas$;
  }

  buscarOficinas(termino: string): Observable<OficinaCorreos[]> {
    const cleanTerm = termino.toLowerCase().trim();
    return this.oficinas$.pipe(
      map(oficinas => oficinas.filter(o =>
        o.codigoPostal.startsWith(cleanTerm) ||
        o.localidad.toLowerCase().includes(cleanTerm) ||
        o.nombre.toLowerCase().includes(cleanTerm)
      ))
    );
  }
}
