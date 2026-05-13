import { EntityStatus } from './common.models';

export interface TenantListItem {
  id: string;
  name: string;
  tradeName: string;
  document?: string | null;
  status: EntityStatus;
}

export interface TenantCreateRequest {
  name: string;
  tradeName: string;
  document?: string | null;
  status: EntityStatus;
}

export interface TenantUpdateRequest extends TenantCreateRequest {}

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

export interface IngredientListItem {
  id: string;
  tenantId: string;
  businessUnitId: string;
  code: string;
  name: string;
  status: EntityStatus;
}

export interface ProductOptionListItem {
  id: string;
  tenantId: string;
  businessUnitId: string;
  code: string;
  name: string;
  additionalPrice: number;
  status: EntityStatus;
}
