import { Routes } from '@angular/router';

import { authGuard } from '@core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.page').then((m) => m.LoginPage)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage)
  },
  {
    path: 'empresas',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tenants/tenants.page').then((m) => m.TenantsPage)
  },
  {
    path: 'unidades',
    canActivate: [authGuard],
    loadComponent: () => import('./features/business-units/business-units.page').then((m) => m.BusinessUnitsPage)
  },
  {
    path: 'usuarios',
    canActivate: [authGuard],
    loadComponent: () => import('./features/users/users.page').then((m) => m.UsersPage)
  },
  {
    path: 'produtos',
    canActivate: [authGuard],
    loadComponent: () => import('./features/products/products.page').then((m) => m.ProductsPage)
  },
  {
    path: 'categorias',
    canActivate: [authGuard],
    loadComponent: () => import('./features/product-categories/product-categories.page').then((m) => m.ProductCategoriesPage)
  },
  {
    path: 'ingredientes',
    canActivate: [authGuard],
    loadComponent: () => import('./features/ingredients/ingredients.page').then((m) => m.IngredientsPage)
  },
  {
    path: 'opcoes',
    canActivate: [authGuard],
    loadComponent: () => import('./features/options/options.page').then((m) => m.OptionsPage)
  },
  {
    path: 'composicao-produto',
    canActivate: [authGuard],
    loadComponent: () => import('./features/product-composition/product-composition.page').then((m) => m.ProductCompositionPage)
  },
  {
    path: 'pedidos',
    canActivate: [authGuard],
    loadComponent: () => import('./features/orders/orders.page').then((m) => m.OrdersPage)
  },
  {
    path: 'auditoria-ia',
    canActivate: [authGuard],
    loadComponent: () => import('./features/ai-audit/ai-audit.page').then((m) => m.AiAuditPage)
  },
  {
    path: 'cardapio',
    canActivate: [authGuard],
    loadComponent: () => import('./features/menu-preview/menu-preview.page').then((m) => m.MenuPreviewPage)
  },
  {
    path: 'simulador-chat',
    canActivate: [authGuard],
    loadComponent: () => import('./features/chat-simulator/chat-simulator.page').then((m) => m.ChatSimulatorPage)
  },
  { path: '**', redirectTo: '' }
];
