import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from './core/services/cart.service';

const cartNotEmpty = () => {
  const hasItems = inject(CartService).cartItems().length > 0;
  return hasItems ? true : inject(Router).createUrlTree(['/catalog']);
};

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'catalog',
    loadComponent: () =>
      import('./features/catalog/catalog.component').then(m => m.CatalogComponent),
  },
  {
    path: 'product/:id',
    loadComponent: () =>
      import('./features/catalog/product-detail.component').then(m => m.ProductDetailComponent),
  },
  {
    path: 'checkout',
    canActivate: [cartNotEmpty],
    loadComponent: () =>
      import('./features/checkout/checkout.component').then(m => m.CheckoutComponent),
  },
  {
    path: 'seguimiento',
    loadComponent: () =>
      import('./features/tracking/tracking.component').then(m => m.TrackingComponent),
  },
  {
    path: 'legal',
    loadComponent: () =>
      import('./features/legal/legal.component').then(m => m.LegalComponent),
  },
  {
    path: 'privacidad',
    loadComponent: () =>
      import('./features/legal/legal.component').then(m => m.LegalComponent),
  },
  {
    path: '404',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
  { path: '**', redirectTo: '404' },
];
