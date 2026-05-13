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

export interface BusinessUnitCreateRequest {
  name: string;
  phone?: string | null;
  address?: string | null;
  fixedDeliveryFee: number;
  status: EntityStatus;
}

export interface BusinessUnitUpdateRequest extends BusinessUnitCreateRequest {}

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

export interface ProductCreateRequest {
  code: string;
  name: string;
  description?: string | null;
  price: number;
  isAvailable: boolean;
  status: EntityStatus;
}

export interface ProductUpdateRequest extends ProductCreateRequest {}

export interface IngredientListItem {
  id: string;
  tenantId: string;
  businessUnitId: string;
  code: string;
  name: string;
  status: EntityStatus;
}

export interface IngredientCreateRequest {
  code: string;
  name: string;
  status: EntityStatus;
}

export interface IngredientUpdateRequest extends IngredientCreateRequest {}

export interface ProductOptionListItem {
  id: string;
  tenantId: string;
  businessUnitId: string;
  code: string;
  name: string;
  additionalPrice: number;
  status: EntityStatus;
}

export interface ProductOptionCreateRequest {
  code: string;
  name: string;
  additionalPrice: number;
  status: EntityStatus;
}

export interface ProductOptionUpdateRequest extends ProductOptionCreateRequest {}

export interface ProductCompositionIngredient {
  ingredientId: string;
  ingredientCode: string;
  ingredientName: string;
  isDefault: boolean;
  canBeRemoved: boolean;
}

export interface ProductCompositionOption {
  optionId: string;
  optionCode: string;
  optionName: string;
  additionalPrice: number;
  isAvailable: boolean;
}

export interface ProductComposition {
  productId: string;
  ingredients: ProductCompositionIngredient[];
  options: ProductCompositionOption[];
}

export interface ProductCompositionUpdateIngredient {
  ingredientId: string;
  isDefault: boolean;
  canBeRemoved: boolean;
}

export interface ProductCompositionUpdateRequest {
  ingredients: ProductCompositionUpdateIngredient[];
  optionIds: string[];
}
