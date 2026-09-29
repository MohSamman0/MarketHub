import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth.service';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/catalog/catalog.page').then((m) => m.CatalogPage),
    title: 'MarketHub — Discover',
  },
  {
    path: 'products/:id',
    loadComponent: () => import('./features/catalog/product.page').then((m) => m.ProductPage),
    title: 'MarketHub — Product',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
    title: 'MarketHub — Sign in',
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart.page').then((m) => m.CartPage),
    title: 'MarketHub — Your bag',
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./features/checkout/checkout.page').then((m) => m.CheckoutPage),
    title: 'MarketHub — Checkout',
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () => import('./features/orders/orders.page').then((m) => m.OrdersPage),
    title: 'MarketHub — Orders',
  },
  {
    path: 'orders/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/orders/order.page').then((m) => m.OrderPage),
    title: 'MarketHub — Order details',
  },
  {
    path: 'vendor',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Vendor'] },
    loadComponent: () => import('./features/vendor/vendor.page').then((m) => m.VendorPage),
    title: 'MarketHub — Seller workspace',
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] },
    loadComponent: () => import('./features/admin/admin.page').then((m) => m.AdminPage),
    title: 'MarketHub — Administration',
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found.page').then((m) => m.NotFoundPage),
    title: 'MarketHub — Page not found',
  },
];
