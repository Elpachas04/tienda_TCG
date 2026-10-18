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
    data: { description: 'Deckboxes, expositores y organizadores para TCG impresos en 3D en Barcelona. Fabricados uno a uno, en el color que elijas. Envío a Península.' },
    loadComponent: () =>
      import('./features/landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'catalog',
    title: 'Catálogo — Deckboxes, Almacenaje y Accesorios | LayerVault',
    data: { description: 'Todo el catálogo de LayerVault: deckboxes, cajas de almacenaje, organizadores y herramientas para TCG impresos en 3D en Barcelona.' },
    loadComponent: () =>
      import('./features/catalog/catalog.component').then(m => m.CatalogComponent),
  },
  {
    path: 'product/:id',
    data: { custom: true },
    loadComponent: () =>
      import('./features/catalog/product-detail.component').then(m => m.ProductDetailComponent),
  },
  {
    path: 'checkout',
    title: 'Confirmar pedido | LayerVault',
    canActivate: [cartNotEmpty],
    data: { noindex: true },
    loadComponent: () =>
      import('./features/checkout/checkout.component').then(m => m.CheckoutComponent),
  },
  {
    path: 'valorar',
    title: 'Valora tu pedido | LayerVault',
    data: { noindex: true },
    loadComponent: () =>
      import('./features/reviews/review-form.component').then(m => m.ReviewFormComponent),
  },
  {
    path: 'seguimiento',
    title: 'Seguimiento de pedido | LayerVault',
    data: { noindex: true },
    loadComponent: () =>
      import('./features/tracking/tracking.component').then(m => m.TrackingComponent),
  },
  {
    path: 'legal',
    title: 'Aviso legal | LayerVault',
    data: { description: 'Aviso legal de LayerVault, tienda de accesorios TCG impresos en 3D en Barcelona.' },
    loadComponent: () =>
      import('./features/legal/legal.component').then(m => m.LegalComponent),
  },
  {
    path: 'privacidad',
    title: 'Política de privacidad | LayerVault',
    data: { description: 'Política de privacidad de LayerVault: qué datos guardamos de tus pedidos y para qué.' },
    loadComponent: () =>
      import('./features/legal/legal.component').then(m => m.LegalComponent),
  },
  {
    path: 'cookies',
    title: 'Política de cookies | LayerVault',
    data: { description: 'Qué guarda LayerVault en tu navegador: solo lo necesario para la cesta. Sin analítica, publicidad ni cookies de terceros.' },
    loadComponent: () =>
      import('./features/legal/legal.component').then(m => m.LegalComponent),
  },
  {
    path: '404',
    title: 'Página no encontrada | LayerVault',
    data: { noindex: true },
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
  {
    path: 'gum-gum-berry',
    data: { noindex: true },
    loadComponent: () =>
      import('./features/berry/gum-gum-berry.component').then(m => m.GumGumBerryComponent),
  },
  {
    path: 'admin/login',
    title: 'Admin — LayerVault',
    data: { noindex: true },
    loadComponent: () =>
      import('./features/admin/admin-login.component').then(m => m.AdminLoginComponent),
  },
  {
    path: 'admin',
    title: 'Admin — LayerVault',
    canActivate: [adminGuard],
    data: { noindex: true },
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
      {
        path: 'valoraciones',
        loadComponent: () =>
          import('./features/admin/admin-reviews.component').then(m => m.AdminReviewsComponent),
      },
      {
        path: 'invitaciones',
        loadComponent: () =>
          import('./features/admin/admin-referrals.component').then(m => m.AdminReferralsComponent),
      },
      { path: '', redirectTo: 'productos', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '404' },
];
