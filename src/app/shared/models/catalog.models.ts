import { EntityStatus } from './common.models';

export type WhatsAppReturnMessageCadence = 'Daily' | 'Weekly' | 'Monthly';
export type StorefrontTheme = 'indigo' | 'rubi' | 'ambar' | 'esmeralda' | 'oceano' | 'violeta' | 'rosa';

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
  whatsAppWelcomeMessage?: string | null;
  whatsAppReturnMessage?: string | null;
  whatsAppReturnMessageCadence: WhatsAppReturnMessageCadence;
  publicSlug?: string | null;
  storefrontTheme: StorefrontTheme;
  status: EntityStatus;
}

export interface BusinessUnitCreateRequest {
  name: string;
  phone?: string | null;
  address?: string | null;
  fixedDeliveryFee: number;
  whatsAppWelcomeMessage?: string | null;
  whatsAppReturnMessage?: string | null;
  whatsAppReturnMessageCadence: WhatsAppReturnMessageCadence;
  publicSlug?: string | null;
  storefrontTheme?: StorefrontTheme | null;
  status: EntityStatus;
}

export interface BusinessUnitUpdateRequest extends BusinessUnitCreateRequest {}

export interface BusinessUnitWhatsAppChannel {
  channelId?: string | null;
  tenantId: string;
  businessUnitId: string;
  provider: string;
  instanceId: string;
  channelStatus: string;
  connectionStatus: string;
  qrCode?: string | null;
  pairingCode?: string | null;
}

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

export interface OptionGroup {
  id: string;
  tenantId: string;
  businessUnitId: string;
  name: string;
  minSelected: number;
  maxSelected: number;
  isRequired: boolean;
  linkSource: 'None' | 'Product' | 'Category' | 'ProductAndCategory';
  options: OptionGroupOption[];
}

export interface OptionGroupOption {
  id: string;
  optionId: string;
  code: string;
  name: string;
  additionalPrice: number;
  isAvailable: boolean;
  displayOrder: number;
}

export interface OptionGroupRequest {
  name: string;
  minSelected: number;
  maxSelected: number;
  isRequired: boolean;
  options: OptionGroupOptionRequest[];
}

export interface OptionGroupOptionRequest {
  optionId: string;
  isAvailable: boolean;
  displayOrder: number;
}

export interface CompositionGroup {
  id: string;
  tenantId: string;
  businessUnitId: string;
  code: string;
  name: string;
  status: EntityStatus;
  productIds: string[];
  variantRules: CompositionGroupVariantRule[];
}

export interface CompositionGroupVariantRule {
  variantId: string;
  variantCode: string;
  variantName: string;
  minParts: number;
  maxParts: number;
}

export interface CompositionGroupRequest {
  code: string;
  name: string;
  status: EntityStatus;
  productIds: string[];
  variantRules: CompositionGroupVariantRuleRequest[];
}

export interface CompositionGroupVariantRuleRequest {
  variantCode: string;
  minParts: number;
  maxParts: number;
}
