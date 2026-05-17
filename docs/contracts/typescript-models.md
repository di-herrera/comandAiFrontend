# Modelos TypeScript esperados

Este documento resume os principais modelos TypeScript do frontend.

```ts
export type EntityStatus = 'Active' | 'Inactive';

export interface PagedResult<T> {
  items: T[];
  total: number;
}

export interface TenantListItem {
  id: string;
  name: string;
  tradeName: string;
  document?: string | null;
  status: EntityStatus;
}

export interface BusinessUnitListItem {
  id: string;
  tenantId: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  fixedDeliveryFee: number;
  status: EntityStatus;
}

export interface ProductListItem {
  id: string;
  tenantId: string;
  businessUnitId: string;
  code: string;
  name: string;
  description?: string | null;
  price: number;
  isAvailable: boolean;
  status: EntityStatus;
}

export type OrderStatus =
  | 'ReadyForExecution'
  | 'HumanReviewRequired'
  | 'Completed'
  | 'Cancelled';

export interface OrderListFilters {
  status?: OrderStatus | '';
  createdFromUtc?: string | null;
  createdToUtc?: string | null;
  search?: string | null;
}

export interface OrderSummary {
  orderId: string;
  orderNumber: string;
  tenantId: string;
  businessUnitId: string;
  status: OrderStatus;
  customer: {
    customerId: string;
    name?: string | null;
    phoneNumber: string;
  };
  createdAtUtc: string;
  readyForExecutionAtUtc?: string | null;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  requiresHumanHandoff: boolean;
}
```

O arquivo inicial fica em:

```text
src/app/shared/models/catalog.models.ts
```

Modelos de acompanhamento de pedidos ficam em:

```text
src/app/shared/models/orders.models.ts
```
