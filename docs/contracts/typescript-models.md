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
  whatsAppWelcomeMessage?: string | null;
  status: EntityStatus;
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
}

export interface ProductCategoryListItem {
  id: string;
  tenantId: string;
  businessUnitId: string;
  name: string;
  description?: string | null;
  displayOrder: number;
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

export interface OperatorConversationSummary {
  conversationId: string;
  tenantId: string;
  businessUnitId: string;
  conversationStatus: string;
  requiresHumanAttention: boolean;
  draftStatus?: string | null;
  operatorStatus: string;
  operatorStatusLabel: string;
  isReadyToConfirm: boolean;
  itemCount: number;
  total: number;
}

export interface AiPrompt {
  key: string;
  content: string;
  version: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  updatedByUserId?: string | null;
}

export interface UpdateAiPromptRequest {
  content: string;
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
```

O arquivo inicial fica em:

```text
src/app/shared/models/catalog.models.ts
```

Modelos de acompanhamento de pedidos ficam em:

```text
src/app/shared/models/orders.models.ts
```

Modelos de auditoria de IA ficam em:

```text
src/app/shared/models/ai-audit.models.ts
```

Modelos de prompts de IA ficam em:

```text
src/app/shared/models/ai-prompts.models.ts
```

Modelos do painel operador ficam em:

```text
src/app/shared/models/operator-conversations.models.ts
```
