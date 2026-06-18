export interface OperatorConversationCustomer {
  customerId: string;
  name?: string | null;
  phoneNumber: string;
}

export interface OperatorConversationChannel {
  channelId?: string | null;
  channelType?: string | null;
  channelProvider?: string | null;
  channelIdentifier?: string | null;
}

export interface OperatorConversationSummary {
  conversationId: string;
  tenantId: string;
  businessUnitId: string;
  customer: OperatorConversationCustomer;
  channel: OperatorConversationChannel;
  conversationStatus: string;
  requiresHumanAttention: boolean;
  humanHandoffReason?: string | null;
  startedAtUtc: string;
  lastInteractionAtUtc: string;
  idleSeconds: number;
  draftId?: string | null;
  draftStatus?: string | null;
  operatorStatus: string;
  operatorStatusLabel: string;
  itemCount: number;
  hasItems: boolean;
  hasFulfillmentType: boolean;
  fulfillmentType?: 'Delivery' | 'Pickup' | string | null;
  hasDeliveryAddress: boolean;
  hasPaymentMethod: boolean;
  isReadyToConfirm: boolean;
  missingFields: string[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export interface OperatorConversationDetail {
  summary: OperatorConversationSummary;
  messages: OperatorConversationMessage[];
  draft?: OperatorOrderDraftSummary | null;
}

export interface OperatorConversationMessage {
  messageId: string;
  direction: 'Customer' | 'Store' | string;
  text: string;
  createdAtUtc: string;
}

export interface OperatorOrderDraftSummary {
  draftId: string;
  status: string;
  fulfillmentType?: 'Delivery' | 'Pickup' | string | null;
  deliveryAddress?: string | null;
  paymentMethod?: string | null;
  missingFields: string[];
  items: OperatorOrderDraftItemSummary[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export interface OperatorOrderDraftItemSummary {
  draftItemId: string;
  quantity: number;
  productName: string;
  variantName: string;
  notes?: string | null;
  subtotal: number;
}

export interface EnableConversationHandoffRequest {
  reason?: string | null;
}

export interface CloseOperatorConversationRequest {
  reason?: string | null;
}

export interface SendOperatorConversationMessageRequest {
  text: string;
}
