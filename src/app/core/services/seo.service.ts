import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

const BASE_URL = 'https://layervault.es';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly doc = inject(DOCUMENT);
  private readonly router = inject(Router);

  init(): void {
    this.setCanonical(this.router.url);
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => this.setCanonical(e.urlAfterRedirects));
  }

  private setCanonical(path: string): void {
    const cleanPath = path.split('?')[0].split('#')[0];
    const href = cleanPath === '/' || cleanPath === '' ? BASE_URL : `${BASE_URL}${cleanPath}`;

    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
}
