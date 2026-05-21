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
  categoryId: string;
  categoryName: string;
  code: string;
  name: string;
  description?: string | null;
  price: number;
  isAvailable: boolean;
  status: EntityStatus;
  variants: ProductVariant[];
}

export interface ProductCreateRequest {
  categoryId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  price: number;
  isAvailable: boolean;
  status: EntityStatus;
  variants: ProductVariantRequest[];
}

export interface ProductUpdateRequest extends ProductCreateRequest {}

export interface ProductCategoryListItem {
  id: string;
  tenantId: string;
  businessUnitId: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  status: EntityStatus;
}

export interface ProductCategoryCreateRequest {
  name: string;
  description?: string | null;
  displayOrder: number;
  status: EntityStatus;
}

export interface ProductCategoryUpdateRequest extends ProductCategoryCreateRequest {}

export interface ProductVariant {
  id: string;
  /** Codigo da variante global reutilizada pela unidade, como G, M, P ou COCA. */
  code: string;
  /** Nome da variante global. */
  name: string;
  /** Preco do vinculo produto-variante. */
  price: number;
  /** Disponibilidade do vinculo produto-variante. */
  isAvailable: boolean;
  displayOrder: number;
}

export interface ProductVariantRequest {
  /** Codigo da variante global. Se ja existir na unidade, o backend reutiliza. */
  code: string;
  name: string;
  /** Preco da variante neste produto. */
  price: number;
  isAvailable: boolean;
  displayOrder: number;
}

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
  isAvailable: boolean;
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
