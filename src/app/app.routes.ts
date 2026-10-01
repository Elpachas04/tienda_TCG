import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from './core/services/cart.service';
import { adminGuard } from './core/guards/admin.guard';

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
  {
    path: 'admin/login',
    title: 'Admin — LayerVault',
    loadComponent: () =>
      import('./features/admin/admin-login.component').then(m => m.AdminLoginComponent),
  },
  {
    path: 'admin',
    title: 'Admin — LayerVault',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: 'productos',
        loadComponent: () =>
          import('./features/admin/admin-products.component').then(m => m.AdminProductsComponent),
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./features/admin/admin-orders.component').then(m => m.AdminOrdersComponent),
      },
      { path: '', redirectTo: 'productos', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '404' },
];
