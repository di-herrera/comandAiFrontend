export type OrderStatus = 'ReadyForExecution' | 'HumanReviewRequired' | 'Completed' | 'Cancelled';

export interface OrderListFilters {
  status?: OrderStatus | '';
  createdFromUtc?: string | null;
  createdToUtc?: string | null;
  search?: string | null;
}

export interface OrderCustomerSummary {
  customerId: string;
  name?: string | null;
  phoneNumber: string;
}

export interface OrderConversationSummary {
  conversationId: string;
  channelId?: string | null;
  channelType?: string | null;
  channelProvider?: string | null;
  channelIdentifier?: string | null;
}

export interface OrderSummary {
  orderId: string;
  orderNumber: string;
  tenantId: string;
  businessUnitId: string;
  status: OrderStatus;
  customer: OrderCustomerSummary;
  conversation: OrderConversationSummary;
  createdAtUtc: string;
  readyForExecutionAtUtc?: string | null;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  requiresHumanHandoff: boolean;
  humanHandoffReason?: string | null;
}

export interface OrderCustomerDetail extends OrderCustomerSummary {
  customerAddressId?: string | null;
  deliveryAddress?: string | null;
}

export interface OrderDetail {
  orderId: string;
  orderNumber: string;
  tenantId: string;
  businessUnitId: string;
  status: OrderStatus;
  fulfillmentType: 'Delivery' | 'Pickup';
  customer: OrderCustomerDetail;
  conversation: OrderConversationSummary;
  createdAtUtc: string;
  readyForExecutionAtUtc?: string | null;
  updatedAtUtc: string;
  items: OrderDetailItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod?: string | null;
  requiresHumanHandoff: boolean;
  humanHandoffReason?: string | null;
}

export interface OrderDetailItem {
  orderItemId: string;
  productId: string;
  productCode?: string | null;
  productName: string;
  productVariantId: string;
  productVariantCode?: string | null;
  productVariantName: string;
  quantity: number;
  unitPrice: number;
  optionsTotal: number;
  subtotal: number;
  notes?: string | null;
  options: OrderDetailItemOption[];
  removedIngredients: OrderDetailRemovedIngredient[];
}

export interface OrderDetailItemOption {
  orderItemOptionId: string;
  productOptionId: string;
  optionCode?: string | null;
  optionName: string;
  additionalPrice: number;
  quantity: number;
  total: number;
}

export interface OrderDetailRemovedIngredient {
  orderItemRemovedIngredientId: string;
  ingredientId: string;
  ingredientCode?: string | null;
  ingredientName: string;
}
