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
    title: 'LayerVault — Accesorios TCG impresos en 3D | Barcelona',
    loadComponent: () =>
      import('./features/landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'catalog',
    title: 'Catálogo — Deckboxes, Almacenaje y Accesorios | LayerVault',
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
    title: 'Confirmar pedido | LayerVault',
    canActivate: [cartNotEmpty],
    loadComponent: () =>
      import('./features/checkout/checkout.component').then(m => m.CheckoutComponent),
  },
  {
    path: 'seguimiento',
    title: 'Seguimiento de pedido | LayerVault',
    loadComponent: () =>
      import('./features/tracking/tracking.component').then(m => m.TrackingComponent),
  },
  {
    path: 'legal',
    title: 'Aviso legal | LayerVault',
    loadComponent: () =>
      import('./features/legal/legal.component').then(m => m.LegalComponent),
  },
  {
    path: 'privacidad',
    title: 'Política de privacidad | LayerVault',
    loadComponent: () =>
      import('./features/legal/legal.component').then(m => m.LegalComponent),
  },
  {
    path: '404',
    title: 'Página no encontrada | LayerVault',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
  {
    path: 'gum-gum-berry',
    loadComponent: () =>
      import('./features/berry/gum-gum-berry.component').then(m => m.GumGumBerryComponent),
  },
  { path: '**', redirectTo: '404' },
];
