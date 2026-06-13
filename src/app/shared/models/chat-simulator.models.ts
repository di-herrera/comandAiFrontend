export interface SimulateMessageRequest {
  tenantId: string | null;
  businessUnitId: string | null;
  channelId: string | null;
  channelIdentifier: string | null;
  phoneNumber: string;
  text: string;
}

export interface ProcessedAiAction {
  type: string;
  productCode: string | null;
  ingredientCode: string | null;
  optionCode: string | null;
}

export interface AppliedMessageAction {
  type: string;
  applied: boolean;
  detail: string | null;
  error: string | null;
}

export interface SimulateMessageResult {
  incomingMessageId: string;
  tenantId: string;
  businessUnitId: string;
  channelId: string;
  customerId: string;
  conversationId: string;
  orderDraftId: string | null;
  orderId: string | null;
  outgoingMessageId: string | null;
  receivedText: string;
  interpretedActions: ProcessedAiAction[];
  appliedActions: AppliedMessageAction[];
  validationErrors: string[];
  customerReply: string;
  requiresHumanAttention: boolean;
  outgoingMessages?: SimulatedOutgoingMessage[];
}

export interface SimulatedOutgoingMessage {
  outgoingMessageId: string;
  text: string;
}
