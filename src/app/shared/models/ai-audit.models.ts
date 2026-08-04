export interface AiInteractionFilters {
  conversationId?: string | null;
  incomingMessageId?: string | null;
  parsedSuccessfully?: boolean | null;
  createdFromUtc?: string | null;
  createdToUtc?: string | null;
}

export interface AiInteractionListItem {
  id: string;
  tenantId: string;
  businessUnitId: string;
  conversationId: string;
  incomingMessageId: string;
  provider: string;
  model: string;
  customerMessage: string;
  prompt: string;
  responseText?: string | null;
  parsedResultJson?: string | null;
  parsedSuccessfully: boolean;
  errorMessage?: string | null;
  durationMs: number;
  inputTokens?: number | null;
  cachedInputTokens?: number | null;
  cacheWriteInputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  estimatedCostUsd?: number | null;
  createdAtUtc: string;
}
