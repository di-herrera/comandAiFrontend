import { Component, ElementRef, OnDestroy, ViewChild, effect, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { OperatorConversationsApiService } from '@core/api/operator-conversations-api.service';
import { OperatorConversationsRealtimeService } from '@core/api/operator-conversations-realtime.service';
import { CatalogContextService } from '@core/context/catalog-context.service';
import { CatalogContextSelectorComponent } from '@shared/components/catalog-context-selector/catalog-context-selector.component';
import { ApiFailure } from '@shared/models/common.models';
import { OperatorConversationDetail, OperatorConversationSummary } from '@shared/models/operator-conversations.models';

@Component({
  selector: 'app-operator-panel',
  standalone: true,
  imports: [CatalogContextSelectorComponent, ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Operacao em tempo real</p>
          <h1 class="page-title">Painel operador</h1>
          <p class="page-description">Acompanhe conversas em andamento antes de virarem comandas prontas.</p>
        </div>
        <button class="btn" type="button" (click)="reload()" [disabled]="loading || !canUseContext">
          {{ loading ? 'Atualizando...' : 'Atualizar' }}
        </button>
      </header>

      <app-catalog-context-selector />

      @if (errorMessage) {
        <p class="feedback error">{{ errorMessage }}</p>
      }

      @if (!realtimeConnected && canUseContext) {
        <p class="feedback warning">Atualizacao em tempo real indisponivel. Use Atualizar para recarregar.</p>
      }

      <section class="operator-summary">
        <article class="card metric-card">
          <span>Conversas</span>
          <strong>{{ conversations.length }}</strong>
        </article>
        <article class="card metric-card attention">
          <span>Handoff</span>
          <strong>{{ handoffCount }}</strong>
        </article>
        <article class="card metric-card ready">
          <span>Prontas para confirmar</span>
          <strong>{{ readyToConfirmCount }}</strong>
        </article>
      </section>

      @if (!canUseContext) {
        <section class="card">
          <p class="muted">Selecione empresa e unidade para acompanhar as conversas.</p>
        </section>
      } @else if (loading && conversations.length === 0) {
        <section class="card">
          <p class="muted">Carregando conversas...</p>
        </section>
      } @else if (conversations.length === 0) {
        <section class="card">
          <p class="muted">Nenhuma conversa em andamento nesta unidade.</p>
        </section>
      } @else {
        <section class="operator-grid" aria-label="Conversas em andamento">
          @for (conversation of conversations; track conversation.conversationId) {
            <article class="operator-card" [class]="cardClass(conversation)">
              <header class="operator-card-header">
                <div>
                  <strong>{{ conversation.customer.name || 'Cliente sem nome' }}</strong>
                  <span>{{ conversation.customer.phoneNumber }}</span>
                </div>
                <span class="idle-pill">{{ idleLabel(conversation) }}</span>
              </header>

              <div class="operator-card-facts">
                <span>{{ channelLabel(conversation) }}</span>
                <span>Inicio {{ formatDate(conversation.startedAtUtc) }}</span>
              </div>

              @if (conversation.requiresHumanAttention) {
                <p class="feedback warning compact-feedback">
                  Handoff: {{ conversation.humanHandoffReason || 'atendimento humano ativo.' }}
                </p>
              }

              <div class="operator-chip-row">
                <span class="status-pill" [class.ok]="conversation.hasItems" [class.pending]="!conversation.hasItems">
                  {{ conversation.hasItems ? conversation.itemCount + ' item(ns)' : 'Sem itens' }}
                </span>
                @if (conversation.fulfillmentType) {
                  <span class="status-pill ok">{{ fulfillmentLabel(conversation.fulfillmentType) }}</span>
                } @else {
                  <span class="status-pill pending">Entrega/retirada pendente</span>
                }
                @if (conversation.fulfillmentType === 'Delivery' && !conversation.hasDeliveryAddress) {
                  <span class="status-pill pending">Endereco pendente</span>
                }
                <span class="status-pill" [class.ok]="conversation.hasPaymentMethod" [class.pending]="!conversation.hasPaymentMethod">
                  {{ conversation.hasPaymentMethod ? 'Pagamento informado' : 'Pagamento pendente' }}
                </span>
                @if (isReadyToConfirm(conversation)) {
                  <span class="status-pill ready">Pronto para confirmar</span>
                }
                @if (conversation.requiresHumanAttention) {
                  <span class="status-pill attention">Handoff</span>
                }
              </div>

              <dl class="operator-values">
                <div>
                  <dt>Rascunho</dt>
                  <dd>{{ draftStatusLabel(conversation.draftStatus) }}</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>{{ formatCurrency(conversation.total) }}</dd>
                </div>
              </dl>

              <div class="button-row operator-actions">
                <button class="btn btn-small" type="button" (click)="openDetail(conversation)" [disabled]="isActionLoading(conversation)">
                  Detalhe
                </button>
                @if (conversation.requiresHumanAttention) {
                  <button class="btn btn-small" type="button" (click)="disableHandoff(conversation)" [disabled]="isActionLoading(conversation)">
                    Devolver para IA
                  </button>
                } @else {
                  <button class="btn btn-small" type="button" (click)="enableHandoff(conversation)" [disabled]="isActionLoading(conversation)">
                    Assumir atendimento
                  </button>
                }
                <button class="btn btn-small btn-danger" type="button" (click)="closeConversation(conversation)" [disabled]="isActionLoading(conversation)">
                  Reiniciar interacao
                </button>
              </div>
            </article>
          }
        </section>
      }

      @if (selectedDetail) {
        <div class="operator-modal-backdrop" role="presentation">
          <section class="operator-modal" role="dialog" aria-modal="true" aria-label="Detalhe da conversa" (click)="$event.stopPropagation()">
            <header class="operator-modal-header">
              <div>
                <p class="eyebrow">Conversa</p>
                <h2>{{ selectedDetail.summary.customer.name || 'Cliente sem nome' }}</h2>
                <p>{{ selectedDetail.summary.customer.phoneNumber }} - {{ idleLabel(selectedDetail.summary) }}</p>
              </div>
              <button class="btn editor-close" type="button" (click)="closeDetail()" aria-label="Fechar detalhe">x</button>
            </header>

            @if (detailLoading) {
              <p class="muted">Atualizando conversa...</p>
            }

            <div class="operator-modal-layout">
              <section class="conversation-panel">
                <label class="auto-scroll-toggle">
                  <input type="checkbox" [checked]="autoScrollConversation" (change)="toggleAutoScroll($event)" />
                  Rolar automaticamente ao receber mensagem
                </label>

                <div #conversationStream class="conversation-stream">
                  @if (selectedDetail.messages.length === 0) {
                    <p class="muted">Nenhuma mensagem de texto registrada.</p>
                  } @else {
                    @for (message of selectedDetail.messages; track message.messageId) {
                      <article class="conversation-message" [class.customer]="message.direction === 'Customer'" [class.store]="message.direction !== 'Customer'">
                        <strong>{{ message.direction === 'Customer' ? 'Cliente' : 'Loja' }}</strong>
                        <p>{{ message.text }}</p>
                        <span>{{ formatDate(message.createdAtUtc) }}</span>
                      </article>
                    }
                  }
                </div>

                <form class="reply-panel" (submit)="sendOperatorMessage($event)">
                  @if (!selectedDetail.summary.requiresHumanAttention) {
                    <p class="feedback warning compact-feedback">Assuma o atendimento para responder manualmente.</p>
                  }
                  @if (detailErrorMessage) {
                    <p class="feedback error compact-feedback">{{ detailErrorMessage }}</p>
                  }
                  <textarea
                    [formControl]="messageControl"
                    rows="3"
                    placeholder="Digite a resposta para o cliente"
                    [disabled]="!selectedDetail.summary.requiresHumanAttention || sendingMessage"
                  ></textarea>
                  <div class="button-row operator-actions">
                    @if (!selectedDetail.summary.requiresHumanAttention) {
                      <button class="btn btn-small" type="button" (click)="enableHandoff(selectedDetail.summary)" [disabled]="isActionLoading(selectedDetail.summary)">
                        Assumir atendimento
                      </button>
                    }
                    <button class="btn btn-primary btn-small" type="submit" [disabled]="!canSendOperatorMessage">
                      {{ sendingMessage ? 'Enviando...' : 'Enviar' }}
                    </button>
                  </div>
                </form>
              </section>

              <aside class="draft-panel">
                <h3>Resumo do pedido</h3>
                @if (!selectedDetail.draft) {
                  <p class="muted">Ainda nao existe rascunho de pedido para esta conversa.</p>
                } @else {
                  <dl class="detail-grid">
                    <div>
                      <dt>Status</dt>
                      <dd>{{ draftStatusLabel(selectedDetail.draft.status) }}</dd>
                    </div>
                    <div>
                      <dt>Entrega</dt>
                      <dd>{{ selectedDetail.draft.fulfillmentType ? fulfillmentLabel(selectedDetail.draft.fulfillmentType) : 'Pendente' }}</dd>
                    </div>
                    <div>
                      <dt>Pagamento</dt>
                      <dd>{{ selectedDetail.draft.paymentMethod || 'Pendente' }}</dd>
                    </div>
                    <div>
                      <dt>Total</dt>
                      <dd>{{ formatCurrency(selectedDetail.draft.total) }}</dd>
                    </div>
                  </dl>

                  @if (selectedDetail.draft.deliveryAddress) {
                    <section class="draft-section">
                      <h4>Endereco</h4>
                      <p>{{ selectedDetail.draft.deliveryAddress }}</p>
                    </section>
                  }

                  @if (selectedDetail.draft.missingFields.length > 0) {
                    <div class="operator-chip-row">
                      @for (field of selectedDetail.draft.missingFields; track field) {
                        <span class="status-pill pending">{{ missingFieldLabel(field) }}</span>
                      }
                    </div>
                  }

                  <section class="draft-section">
                    <h4>Itens</h4>
                    @if (selectedDetail.draft.items.length === 0) {
                      <p class="muted">Nenhum item no rascunho.</p>
                    } @else {
                      <div class="draft-items">
                        @for (item of selectedDetail.draft.items; track item.draftItemId) {
                          <article class="draft-item">
                            <div>
                              <strong>{{ item.quantity }}x {{ item.productName }}</strong>
                              <span>{{ item.variantName }}</span>
                            </div>
                            <strong>{{ formatCurrency(item.subtotal) }}</strong>
                            @if (item.notes) {
                              <p class="muted">Obs.: {{ item.notes }}</p>
                            }
                          </article>
                        }
                      </div>
                    }
                  </section>
                }
              </aside>
            </div>
          </section>
        </div>
      }
    </section>
  `,
  styles: [`
    .operator-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(180px, 100%), 1fr));
      gap: 1rem;
    }

    .metric-card {
      display: grid;
      gap: .35rem;
      border-left: 4px solid var(--border);
    }

    .metric-card span {
      color: var(--muted);
      font-size: .85rem;
      font-weight: 700;
    }

    .metric-card strong {
      font-size: 1.5rem;
    }

    .metric-card.attention { border-left-color: #b45309; }
    .metric-card.ready { border-left-color: var(--success); }

    .operator-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1rem;
    }

    .operator-card {
      display: grid;
      gap: .85rem;
      min-width: 0;
      border: 1px solid var(--border);
      border-left: 4px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface);
      padding: 1rem;
    }

    .operator-card.handoff { border-left-color: #b45309; }
    .operator-card.pending { border-left-color: #d97706; }
    .operator-card.ready { border-left-color: var(--success); }
    .operator-card.initial { border-left-color: #64748b; }

    .operator-card-header,
    .operator-card-facts {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: .75rem;
      min-width: 0;
    }

    .operator-card-header div {
      display: grid;
      gap: .15rem;
      min-width: 0;
    }

    .operator-card-header span,
    .operator-card-facts span {
      color: var(--muted);
      overflow-wrap: anywhere;
    }

    .idle-pill {
      flex: 0 0 auto;
      border-radius: 999px;
      background: var(--primary-soft);
      color: var(--text) !important;
      padding: .25rem .6rem;
      font-size: .82rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .compact-feedback {
      padding: .65rem .75rem;
    }

    .operator-chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: .35rem;
    }

    .status-pill.ok {
      color: var(--success);
      background: #ecfdf3;
    }

    .status-pill.pending {
      color: #93370d;
      background: #fffaeb;
    }

    .status-pill.ready {
      color: var(--success);
      background: #dcfae6;
    }

    .status-pill.attention {
      color: #93370d;
      background: #fffaeb;
    }

    .operator-values {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: .5rem;
      margin: 0;
    }

    .operator-values div {
      min-width: 0;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface-soft);
      padding: .7rem;
    }

    .operator-values dt {
      color: var(--muted);
      font-size: .76rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .operator-values dd {
      margin: .2rem 0 0;
      font-weight: 700;
      overflow-wrap: anywhere;
    }

    .operator-actions {
      justify-content: flex-end;
    }

    @media (max-width: 1180px) {
      .operator-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 980px) {
      .operator-modal-layout {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .operator-grid {
        grid-template-columns: 1fr;
      }

      .operator-card-header,
      .operator-card-facts,
      .operator-actions {
        display: grid;
        justify-content: stretch;
      }

      .idle-pill {
        justify-self: start;
      }

      .operator-values {
        grid-template-columns: 1fr;
      }

    }
  `]
})
export class OperatorPanelPage implements OnDestroy {
  @ViewChild('conversationStream') private conversationStream?: ElementRef<HTMLElement>;

  protected readonly messageControl = new FormControl('', { nonNullable: true });
  protected conversations: OperatorConversationSummary[] = [];
  protected selectedDetail: OperatorConversationDetail | null = null;
  protected loading = false;
  protected detailLoading = false;
  protected sendingMessage = false;
  protected realtimeConnected = false;
  protected errorMessage = '';
  protected detailErrorMessage = '';
  protected autoScrollConversation = true;

  private readonly actionLoadingIds = new Set<string>();
  private readonly now = signal(Date.now());
  private readonly clock = window.setInterval(() => this.now.set(Date.now()), 30000);

  constructor(
    protected readonly catalogContext: CatalogContextService,
    private readonly api: OperatorConversationsApiService,
    private readonly realtime: OperatorConversationsRealtimeService
  ) {
    effect(() => {
      this.catalogContext.selectedTenantId();
      this.catalogContext.selectedBusinessUnitId();
      this.reset();
      this.reload();
      void this.connectRealtime();
    });
  }

  ngOnDestroy(): void {
    window.clearInterval(this.clock);
    void this.realtime.disconnect();
  }

  protected get canUseContext(): boolean {
    return this.catalogContext.hasCatalogContext();
  }

  protected get handoffCount(): number {
    return this.conversations.filter((conversation) => conversation.requiresHumanAttention).length;
  }

  protected get readyToConfirmCount(): number {
    return this.conversations.filter((conversation) => this.isReadyToConfirm(conversation)).length;
  }

  protected get canSendOperatorMessage(): boolean {
    return Boolean(
      this.selectedDetail?.summary.requiresHumanAttention &&
      this.messageControl.value.trim() &&
      !this.sendingMessage);
  }

  protected reload(): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();

    if (!tenantId || !businessUnitId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.api.list(tenantId, businessUnitId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          this.conversations = this.sort(result.items);
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
  }

  protected enableHandoff(conversation: OperatorConversationSummary): void {
    this.runConversationAction(conversation, () =>
      this.api.enableHandoff(conversation.tenantId, conversation.businessUnitId, conversation.conversationId, {
        reason: 'Operador assumiu o atendimento.'
      }).pipe(finalize(() => this.clearAction(conversation))).subscribe({
        next: (updated) => this.applySummaryUpdate(updated),
        error: (failure: ApiFailure) => this.errorMessage = failure.error.message
      }));
  }

  protected disableHandoff(conversation: OperatorConversationSummary): void {
    this.runConversationAction(conversation, () =>
      this.api.disableHandoff(conversation.tenantId, conversation.businessUnitId, conversation.conversationId)
        .pipe(finalize(() => this.clearAction(conversation)))
        .subscribe({
        next: (updated) => this.applySummaryUpdate(updated),
        error: (failure: ApiFailure) => this.errorMessage = failure.error.message
      }));
  }

  protected closeConversation(conversation: OperatorConversationSummary): void {
    this.runConversationAction(conversation, () =>
      this.api.close(conversation.tenantId, conversation.businessUnitId, conversation.conversationId, {
        reason: 'Operador reiniciou a interacao.'
      }).pipe(finalize(() => this.clearAction(conversation))).subscribe({
        next: () => this.remove(conversation.conversationId),
        error: (failure: ApiFailure) => this.errorMessage = failure.error.message
      }));
  }

  protected openDetail(conversation: OperatorConversationSummary): void {
    this.selectedDetail = null;
    this.detailErrorMessage = '';
    this.messageControl.setValue('');
    this.loadDetail(conversation);
  }

  protected closeDetail(): void {
    this.selectedDetail = null;
    this.detailErrorMessage = '';
    this.messageControl.setValue('');
  }

  protected sendOperatorMessage(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    const detail = this.selectedDetail;
    const text = this.messageControl.value.trim();
    if (!detail || !text || !detail.summary.requiresHumanAttention || this.sendingMessage) {
      return;
    }

    this.sendingMessage = true;
    this.errorMessage = '';
    this.detailErrorMessage = '';

    this.api.sendMessage(
      detail.summary.tenantId,
      detail.summary.businessUnitId,
      detail.summary.conversationId,
      { text })
      .pipe(finalize(() => (this.sendingMessage = false)))
      .subscribe({
        next: (updated) => {
          const shouldScroll = this.hasNewMessages(this.selectedDetail, updated);
          this.selectedDetail = updated;
          this.applySummaryUpdate(updated.summary);
          this.messageControl.setValue('');
          this.scrollConversationToBottomIfNeeded(shouldScroll);
        },
        error: (failure: ApiFailure) => this.detailErrorMessage = failure.error.message
      });
  }

  protected toggleAutoScroll(event: Event): void {
    this.autoScrollConversation = (event.target as HTMLInputElement).checked;

    if (this.autoScrollConversation) {
      this.scrollConversationToBottom();
    }
  }

  protected isActionLoading(conversation: OperatorConversationSummary): boolean {
    return this.actionLoadingIds.has(conversation.conversationId);
  }

  protected isReadyToConfirm(conversation: OperatorConversationSummary): boolean {
    return conversation.hasItems &&
      conversation.hasFulfillmentType &&
      (conversation.fulfillmentType !== 'Delivery' || conversation.hasDeliveryAddress) &&
      conversation.hasPaymentMethod &&
      !conversation.requiresHumanAttention;
  }

  protected cardClass(conversation: OperatorConversationSummary): string {
    if (conversation.requiresHumanAttention) {
      return 'operator-card handoff';
    }

    if (this.isReadyToConfirm(conversation)) {
      return 'operator-card ready';
    }

    if (!conversation.hasItems) {
      return 'operator-card initial';
    }

    return 'operator-card pending';
  }

  protected idleLabel(conversation: OperatorConversationSummary): string {
    this.now();
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(conversation.lastInteractionAtUtc).getTime()) / 1000));

    if (seconds < 60) {
      return `${seconds}s sem interacao`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}min sem interacao`;
    }

    const hours = Math.floor(minutes / 60);
    return `${hours}h sem interacao`;
  }

  protected channelLabel(conversation: OperatorConversationSummary): string {
    return `${conversation.channel.channelType || 'Canal'} / ${conversation.channel.channelProvider || 'provedor'}`;
  }

  protected fulfillmentLabel(value: string): string {
    return value === 'Delivery' ? 'Entrega' : 'Retirada';
  }

  protected draftStatusLabel(value: string | null | undefined): string {
    const labels: Record<string, string> = {
      Open: 'Em montagem',
      WaitingCustomerConfirmation: 'Aguardando confirmacao do cliente',
      WaitingCustomerInput: 'Aguardando informacoes do cliente',
      WaitingHumanAttention: 'Aguardando atendimento humano',
      ReadyForConfirmation: 'Pronto para confirmar',
      Confirmed: 'Confirmado',
      Cancelled: 'Cancelado',
      Abandoned: 'Abandonado'
    };

    return value ? labels[value] ?? value : 'Sem rascunho';
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  protected missingFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      items: 'Itens pendentes',
      fulfillment_type: 'Entrega/retirada pendente',
      delivery_address: 'Endereco pendente',
      payment_method: 'Pagamento pendente',
      item_variant: 'Variacao pendente'
    };

    return labels[field] ?? field;
  }

  private async connectRealtime(): Promise<void> {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();

    await this.realtime.disconnect();
    this.realtimeConnected = false;

    if (!tenantId || !businessUnitId) {
      return;
    }

    try {
      await this.realtime.connect(tenantId, businessUnitId, {
        changed: (conversation) => this.applySummaryUpdate(conversation),
        detailChanged: (conversation) => this.applyDetailUpdate(conversation),
        removed: (conversationId) => this.remove(conversationId),
        reconnected: () => this.reload(),
        statusChanged: (connected) => this.realtimeConnected = connected
      });
    } catch {
      this.realtimeConnected = false;
    }
  }

  private runConversationAction(conversation: OperatorConversationSummary, action: () => void): void {
    this.errorMessage = '';
    this.actionLoadingIds.add(conversation.conversationId);
    action();
  }

  private clearAction(conversation: OperatorConversationSummary): void {
    this.actionLoadingIds.delete(conversation.conversationId);
  }

  private upsert(conversation: OperatorConversationSummary): void {
    this.conversations = this.sort([
      ...this.conversations.filter((item) => item.conversationId !== conversation.conversationId),
      conversation
    ]);
  }

  private applySummaryUpdate(conversation: OperatorConversationSummary): void {
    this.upsert(conversation);

    if (this.selectedDetail?.summary.conversationId === conversation.conversationId) {
      this.selectedDetail = {
        ...this.selectedDetail,
        summary: conversation
      };
    }
  }

  private applyDetailUpdate(detail: OperatorConversationDetail): void {
    this.applySummaryUpdate(detail.summary);

    if (this.selectedDetail?.summary.conversationId === detail.summary.conversationId) {
      const shouldScroll = this.hasNewMessages(this.selectedDetail, detail);
      this.selectedDetail = detail;
      this.scrollConversationToBottomIfNeeded(shouldScroll);
    }
  }

  private remove(conversationId: string): void {
    this.conversations = this.conversations.filter((conversation) => conversation.conversationId !== conversationId);
    if (this.selectedDetail?.summary.conversationId === conversationId) {
      this.closeDetail();
    }
  }

  private loadDetail(conversation: OperatorConversationSummary): void {
    this.detailLoading = true;
    this.errorMessage = '';
    this.detailErrorMessage = '';

    this.api.detail(conversation.tenantId, conversation.businessUnitId, conversation.conversationId)
      .pipe(finalize(() => (this.detailLoading = false)))
      .subscribe({
        next: (detail) => {
          this.selectedDetail = detail;
          this.applySummaryUpdate(detail.summary);
          this.scrollConversationToBottomIfNeeded(detail.messages.length > 0);
        },
        error: (failure: ApiFailure) => this.errorMessage = failure.error.message
      });
  }

  private hasNewMessages(current: OperatorConversationDetail | null, next: OperatorConversationDetail): boolean {
    if (!current) {
      return next.messages.length > 0;
    }

    const currentLastMessage = current.messages.at(-1);
    const nextLastMessage = next.messages.at(-1);

    return current.messages.length !== next.messages.length ||
      currentLastMessage?.messageId !== nextLastMessage?.messageId;
  }

  private scrollConversationToBottomIfNeeded(shouldScroll: boolean): void {
    if (!shouldScroll || !this.autoScrollConversation) {
      return;
    }

    this.scrollConversationToBottom();
  }

  private scrollConversationToBottom(): void {
    window.setTimeout(() => {
      const element = this.conversationStream?.nativeElement;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    });
  }

  private sort(items: OperatorConversationSummary[]): OperatorConversationSummary[] {
    return [...items].sort((first, second) =>
      new Date(first.startedAtUtc).getTime() - new Date(second.startedAtUtc).getTime());
  }

  private reset(): void {
    this.conversations = [];
    this.selectedDetail = null;
    this.errorMessage = '';
  }
}
