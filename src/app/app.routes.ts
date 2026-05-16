import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage)
  },
  {
    path: 'empresas',
    loadComponent: () => import('./features/tenants/tenants.page').then((m) => m.TenantsPage)
  },
  {
    path: 'unidades',
    loadComponent: () => import('./features/business-units/business-units.page').then((m) => m.BusinessUnitsPage)
  },
  {
    path: 'produtos',
    loadComponent: () => import('./features/products/products.page').then((m) => m.ProductsPage)
  },
  {
    path: 'ingredientes',
    loadComponent: () => import('./features/ingredients/ingredients.page').then((m) => m.IngredientsPage)
  },
  {
    path: 'opcoes',
    loadComponent: () => import('./features/options/options.page').then((m) => m.OptionsPage)
  },
  {
    path: 'composicao-produto',
    loadComponent: () => import('./features/product-composition/product-composition.page').then((m) => m.ProductCompositionPage)
  },
  {
    path: 'pedidos',
    loadComponent: () => import('./features/orders/orders.page').then((m) => m.OrdersPage)
  },
  {
    path: 'cardapio',
    loadComponent: () => import('./features/menu-preview/menu-preview.page').then((m) => m.MenuPreviewPage)
  },
  {
    path: 'simulador-chat',
    loadComponent: () => import('./features/chat-simulator/chat-simulator.page').then((m) => m.ChatSimulatorPage)
  },
  { path: '**', redirectTo: '' }
];
