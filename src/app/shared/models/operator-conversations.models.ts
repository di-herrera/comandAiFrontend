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
  itemCount: number;
  hasItems: boolean;
  hasFulfillmentType: boolean;
  fulfillmentType?: 'Delivery' | 'Pickup' | string | null;
  hasDeliveryAddress: boolean;
  hasPaymentMethod: boolean;
  missingFields: string[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export interface EnableConversationHandoffRequest {
  reason?: string | null;
}

export interface CloseOperatorConversationRequest {
  reason?: string | null;
}
