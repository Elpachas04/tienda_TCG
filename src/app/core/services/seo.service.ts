import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { CloudinaryService } from './cloudinary.service';
import { buildProductSchema, RatingSummary } from '../seo/product-schema';
import reviewSummary from '../../../assets/data/review-summary.json';

const BASE_URL = 'https://layervault.es';
const SITE = 'LayerVault';
const DEFAULT_DESCRIPTION = 'Deckboxes, expositores y organizadores para TCG impresos en 3D en Barcelona. Fabricados uno a uno, en el color que elijas. Envío a Península.';
const DEFAULT_IMAGE = `${BASE_URL}/assets/og-image.jpg`;

/** Datos SEO que puede llevar una ruta en `data` */
export interface RouteSeo {
  description?: string;
  noindex?: boolean;
  /** La página pone sus propias etiquetas (p. ej. la ficha de producto) */
  custom?: boolean;
}

interface PageSeo {
  path: string;
  title?: string;
  description?: string;
  image?: string;
  noindex?: boolean;
  jsonLd?: object | null;
}

// Las etiquetas se escriben también al prerenderizar, así que Google y las vistas previas de enlaces
// las ven en el HTML sin ejecutar JavaScript
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly doc = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly cloudinary = inject(CloudinaryService);

  init(): void {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => {
      const data = this.deepestData(this.router.routerState.snapshot.root);
      if (data.custom) return;
      this.apply({ path: e.urlAfterRedirects, description: data.description, noindex: data.noindex, jsonLd: null });
    });
  }

  /** Ficha de producto: título, descripción, imagen y datos estructurados de Product */
  setProduct(product: Product | null, path: string): void {
    if (!product) {
      this.apply({ path, title: `Producto no encontrado | ${SITE}`, noindex: true, jsonLd: null });
      return;
    }
    const url = `${BASE_URL}/product/${product.id}`;
    const image = product.images[0] ? this.cloudinary.detail(product.images[0]) : DEFAULT_IMAGE;
    const description = trimTo(product.tagline ? `${product.tagline} ${product.description ?? ''}` : (product.description ?? DEFAULT_DESCRIPTION), 158);
    const images = product.images.slice(0, 5).map(id => this.cloudinary.detail(id));
    const rating = (reviewSummary as Record<string, RatingSummary>)[product.id] ?? null;

    this.apply({
      path: `/product/${product.id}`,
      title: `${product.name} | ${SITE}`,
      description,
      image,
      noindex: !!product.hidden,
      jsonLd: product.hidden ? null : buildProductSchema({ product, url, description, images, brand: SITE, rating }),
    });
  }

  private apply(page: PageSeo): void {
    const clean = page.path.split('?')[0].split('#')[0];
    const url = clean === '/' || clean === '' ? BASE_URL : `${BASE_URL}${clean}`;
    if (page.title) this.title.setTitle(page.title);
    const title = this.title.getTitle();
    const description = page.description ?? DEFAULT_DESCRIPTION;
    const image = page.image ?? DEFAULT_IMAGE;

    this.setCanonical(url);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: page.noindex ? 'noindex, follow' : 'index, follow' });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:type', content: page.jsonLd ? 'product' : 'website' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
    this.setJsonLd(page.jsonLd ?? null);
  }

  private setCanonical(href: string): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private setJsonLd(data: object | null): void {
    this.doc.head.querySelector('script#ld-page')?.remove();
    if (!data) return;
    const script = this.doc.createElement('script');
    script.id = 'ld-page';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    this.doc.head.appendChild(script);
  }

  private deepestData(route: ActivatedRouteSnapshot): RouteSeo {
    let r = route;
    while (r.firstChild) r = r.firstChild;
    return r.data as RouteSeo;
  }
}

function trimTo(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : t.slice(0, t.lastIndexOf(' ', max - 1)) + '…';
}
