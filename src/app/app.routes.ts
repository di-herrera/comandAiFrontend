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
    data: { roles: ['SystemAdmin', 'CompanyAdmin'] },
    loadComponent: () => import('./features/tenants/tenants.page').then((m) => m.TenantsPage)
  },
  {
    path: 'unidades',
    canActivate: [authGuard],
    data: { roles: ['SystemAdmin', 'CompanyAdmin', 'UnitAdmin'] },
    loadComponent: () => import('./features/business-units/business-units.page').then((m) => m.BusinessUnitsPage)
  },
  {
    path: 'usuarios',
    canActivate: [authGuard],
    data: { roles: ['SystemAdmin', 'CompanyAdmin'] },
    loadComponent: () => import('./features/users/users.page').then((m) => m.UsersPage)
  },
  {
    path: 'produtos',
    canActivate: [authGuard],
    data: { requiresCatalogContext: true },
    loadComponent: () => import('./features/products/products.page').then((m) => m.ProductsPage)
  },
  {
    path: 'categorias',
    canActivate: [authGuard],
    data: { requiresCatalogContext: true },
    loadComponent: () => import('./features/product-categories/product-categories.page').then((m) => m.ProductCategoriesPage)
  },
  {
    path: 'ingredientes',
    canActivate: [authGuard],
    data: { requiresCatalogContext: true },
    loadComponent: () => import('./features/ingredients/ingredients.page').then((m) => m.IngredientsPage)
  },
  {
    path: 'opcoes',
    canActivate: [authGuard],
    data: { requiresCatalogContext: true },
    loadComponent: () => import('./features/options/options.page').then((m) => m.OptionsPage)
  },
  {
    path: 'grupos',
    canActivate: [authGuard],
    data: { requiresCatalogContext: true },
    loadComponent: () => import('./features/option-groups/option-groups.page').then((m) => m.OptionGroupsPage)
  },
  {
    path: 'composicao-produto',
    canActivate: [authGuard],
    data: { requiresCatalogContext: true },
    loadComponent: () => import('./features/product-composition/product-composition.page').then((m) => m.ProductCompositionPage)
  },
  {
    path: 'pedidos',
    canActivate: [authGuard],
    data: { requiresCatalogContext: true },
    loadComponent: () => import('./features/orders/orders.page').then((m) => m.OrdersPage)
  },
  {
    path: 'painel-operador',
    canActivate: [authGuard],
    data: { requiresCatalogContext: true },
    loadComponent: () => import('./features/operator-panel/operator-panel.page').then((m) => m.OperatorPanelPage)
  },
  {
    path: 'auditoria-ia',
    canActivate: [authGuard],
    data: { requiresCatalogContext: true },
    loadComponent: () => import('./features/ai-audit/ai-audit.page').then((m) => m.AiAuditPage)
  },
  {
    path: 'prompts-ia',
    canActivate: [authGuard],
    data: { roles: ['SystemAdmin'] },
    loadComponent: () => import('./features/ai-prompts/ai-prompts.page').then((m) => m.AiPromptsPage)
  },
  {
    path: 'cardapio',
    canActivate: [authGuard],
    data: { requiresCatalogContext: true },
    loadComponent: () => import('./features/menu-preview/menu-preview.page').then((m) => m.MenuPreviewPage)
  },
  {
    path: 'simulador-chat',
    canActivate: [authGuard],
    data: { roles: ['SystemAdmin'] },
    loadComponent: () => import('./features/chat-simulator/chat-simulator.page').then((m) => m.ChatSimulatorPage)
  },
  { path: '**', redirectTo: '' }
];
