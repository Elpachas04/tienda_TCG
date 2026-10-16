import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PublicReview } from '../models/review.model';
import { CatalogService } from './catalog.service';

// Valoraciones publicadas. Solo se piden si "Mostrar valoraciones" está activado en el admin,
// así que mientras esté apagado la web no hace ninguna llamada de más.
@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly catalog = inject(CatalogService);
  private loading: Promise<void> | null = null;

  readonly reviews = signal<PublicReview[]>([]);

  get enabled(): boolean {
    return !!this.catalog.settings?.reviewsVisible;
  }

  load(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.enabled) return Promise.resolve();
    return this.loading ??= fetch('/api/reviews')
      .then(r => (r.ok ? r.json() : { reviews: [] }))
      .then((d: { reviews?: PublicReview[] }) => this.reviews.set(d.reviews ?? []))
      .catch(() => { this.loading = null; });
  }
}
