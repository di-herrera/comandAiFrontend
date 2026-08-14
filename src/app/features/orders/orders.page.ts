import { Component, computed, effect, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { OrdersApiService } from '@core/api/orders-api.service';
import { CatalogContextService } from '@core/context/catalog-context.service';
import { ApiFailure } from '@shared/models/common.models';
import { OrderDetail, OrderListFilters, OrderStatus, OrderSummary } from '@shared/models/orders.models';

interface StatusOption {
  value: OrderStatus;
  label: string;
  description: string;
}

interface StatusSection {
  status: OrderStatus;
  label: string;
  orders: OrderSummary[];
}

interface SavedOrderFilters {
  statuses: OrderStatus[];
  createdFrom: string;
  createdTo: string;
  search: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Operacao de pedidos</p>
          <h1 class="page-title">Acompanhamento de pedidos</h1>
          <p class="page-description">Atualize o status da comanda conforme cozinha, retirada e entrega avancam.</p>
        </div>
        <button class="btn" type="button" (click)="loadOrders(selectedOrderId)" [disabled]="loading || !canUseContext">
          {{ loading ? 'Atualizando...' : 'Atualizar' }}
        </button>
      </header>

      @if (errorMessage) {
        <p class="feedback error">{{ errorMessage }}</p>
      }

      <section class="order-summary-grid" aria-label="Resumo por status">
        @for (option of visibleStatusOptions; track option.value) {
          <article [class]="metricClass(option.value)">
            <span>{{ option.label }}</span>
            <strong>{{ statusCount(option.value) }}</strong>
          </article>
        }
      </section>

      <section class="card">
        <form class="form-grid" [formGroup]="filtersForm" (ngSubmit)="applyFilters()">
          <fieldset class="status-filter field-wide">
            <legend>Status</legend>
            <div class="status-filter-grid">
              @for (option of filterStatusOptions; track option.value) {
                <label class="status-filter-option">
                  <input
                    type="checkbox"
                    [checked]="isStatusSelected(option.value)"
                    (change)="toggleStatus(option.value, $event)"
                  />
                  <span>
                    <strong>{{ option.label }}</strong>
                    <small>{{ option.description }}</small>
                  </span>
                </label>
              }
            </div>
          </fieldset>

          <label class="field">
            <span>De</span>
            <input type="date" formControlName="createdFrom" />
          </label>

          <label class="field">
            <span>Ate</span>
            <input type="date" formControlName="createdTo" />
          </label>

          <label class="field">
            <span>Cliente ou telefone</span>
            <input type="search" formControlName="search" placeholder="Maria ou +5517..." />
          </label>

          <div class="button-row form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="loading || !canUseContext">
              {{ loading ? 'Carregando...' : 'Aplicar filtros' }}
            </button>
            <button class="btn" type="button" (click)="saveFilters()" [disabled]="loading">
              Salvar filtros
            </button>
            <button class="btn" type="button" (click)="clearFilters()" [disabled]="loading">
              Limpar filtros
            </button>
          </div>
        </form>

        @if (filtersSavedMessage) {
          <p class="feedback success filter-feedback">{{ filtersSavedMessage }}</p>
        }
      </section>

      <section class="orders-layout">
        <section class="card orders-list-card">
          <div class="section-heading">
            <div>
              <h2>Comandas</h2>
              <p>{{ total }} pedido(s) no contexto selecionado.</p>
            </div>
          </div>

          @if (!canUseContext) {
            <p class="muted">Selecione empresa e unidade para acompanhar pedidos.</p>
          } @else if (loading) {
            <div class="order-skeleton-list" aria-label="Carregando pedidos">
              @for (item of skeletonItems; track item) {
                <div class="order-skeleton"></div>
              }
            </div>
          } @else if (orders.length === 0) {
            <div class="orders-empty">
              <div class="empty-mark">C</div>
              <h2>Nenhuma comanda encontrada</h2>
              <p>Revise os filtros ou atualize a lista quando novos pedidos chegarem.</p>
            </div>
          } @else {
            <div class="order-status-sections">
              @for (section of statusSections(); track section.status) {
                <section [class]="sectionClass(section.status)">
                  <header class="operator-section-header">
                    <div>
                      <p class="eyebrow">Status</p>
                      <h2>{{ section.label }}</h2>
                    </div>
                    <span class="status-pill">{{ section.orders.length }} pedido(s)</span>
                  </header>

                  <div class="order-list">
                    @for (order of section.orders; track order.orderId) {
                      <button
                        [class]="orderRowClass(order)"
                        type="button"
                        [class.selected]="selectedOrderId === order.orderId"
                        (click)="selectOrder(order)"
                      >
                        <span class="order-main">
                          <strong>{{ order.orderNumber }}</strong>
                          <span>{{ order.customer.name || 'Cliente sem nome' }} - {{ order.customer.phoneNumber }}</span>
                        </span>
                        <span class="order-meta">
                          <span [class]="statusPillClass(order.status)">{{ statusLabel(order.status) }}</span>
                          <span class="status-pill">{{ fulfillmentLabel(order.fulfillmentType) }}</span>
                          @if (order.requiresHumanHandoff) {
                            <span class="status-pill attention">Atencao humana</span>
                          }
                        </span>
                        <span class="order-facts">
                          <span>{{ formatDate(order.readyForExecutionAtUtc || order.createdAtUtc) }}</span>
                          <span>{{ order.itemCount }} item(ns)</span>
                          <strong>{{ formatCurrency(order.total) }}</strong>
                        </span>
                      </button>
                    }
                  </div>
                </section>
              }
            </div>

            <nav class="pagination-bar" aria-label="Paginacao de pedidos">
              <div>
                <strong>Pagina {{ currentPage }} de {{ totalPages }}</strong>
                <span>{{ pageRangeLabel }}</span>
              </div>
              <div class="button-row">
                <button class="btn" type="button" (click)="previousPage()" [disabled]="loading || currentPage <= 1">Anterior</button>
                <button class="btn" type="button" (click)="nextPage()" [disabled]="loading || currentPage >= totalPages">Proxima</button>
              </div>
            </nav>
          }
        </section>

        <section class="card order-detail-card">
          @if (detailLoading) {
            <p class="muted">Carregando detalhe da comanda...</p>
          } @else if (!selectedOrderId) {
            <p class="muted">Selecione uma comanda para ver itens, entrega, totais e alterar status.</p>
          } @else if (!selectedDetail) {
            <p class="muted">Detalhe nao disponivel para a comanda selecionada.</p>
          } @else {
            <div class="section-heading">
              <div>
                <h2>Comanda {{ selectedDetail.orderNumber }}</h2>
                <p>{{ selectedDetail.customer.name || 'Cliente sem nome' }} - {{ selectedDetail.customer.phoneNumber }}</p>
              </div>
              <span [class]="statusPillClass(selectedDetail.status)">{{ statusLabel(selectedDetail.status) }}</span>
            </div>

            @if (selectedDetail.requiresHumanHandoff) {
              <p class="feedback warning">Atencao humana: {{ selectedDetail.humanHandoffReason || 'pedido marcado para revisao.' }}</p>
            }

            <section class="status-actions">
              <div>
                <p class="eyebrow">Proximo passo</p>
                <h3>{{ nextStepLabel(selectedDetail) }}</h3>
              </div>
              <div class="button-row">
                @for (status of nextStatuses(selectedDetail); track status) {
                  <button
                    class="btn btn-primary btn-small"
                    type="button"
                    (click)="updateStatus(status)"
                    [disabled]="statusUpdating"
                  >
                    {{ statusUpdating ? 'Salvando...' : actionLabel(status) }}
                  </button>
                }
                @if (canCancel(selectedDetail)) {
                  <button
                    class="btn btn-danger btn-small"
                    type="button"
                    (click)="updateStatus('Cancelled')"
                    [disabled]="statusUpdating"
                  >
                    Cancelar
                  </button>
                }
              </div>
            </section>

            <ol class="status-flow">
              @for (status of flowFor(selectedDetail.fulfillmentType); track status) {
                <li [class.done]="isStatusReached(selectedDetail.status, selectedDetail.fulfillmentType, status)" [class.current]="selectedDetail.status === status">
                  {{ statusLabel(status) }}
                </li>
              }
            </ol>

            <dl class="detail-grid">
              <div>
                <dt>Origem</dt>
                <dd>{{ selectedDetail.conversation.channelType || 'Canal' }} / {{ selectedDetail.conversation.channelProvider || 'provedor' }}</dd>
              </div>
              <div>
                <dt>Confirmado em</dt>
                <dd>{{ formatDate(selectedDetail.readyForExecutionAtUtc || selectedDetail.createdAtUtc) }}</dd>
              </div>
              <div>
                <dt>Entrega</dt>
                <dd>{{ fulfillmentLabel(selectedDetail.fulfillmentType) }}</dd>
              </div>
              <div>
                <dt>Pagamento informado</dt>
                <dd>{{ selectedDetail.paymentMethod || 'Nao informado' }}</dd>
              </div>
            </dl>

            @if (selectedDetail.customer.deliveryAddress) {
              <section class="detail-section">
                <h3>Endereco</h3>
                <p>{{ selectedDetail.customer.deliveryAddress }}</p>
              </section>
            }

            <section class="detail-section">
              <h3>Itens</h3>
              <div class="detail-items">
                @for (item of selectedDetail.items; track item.orderItemId) {
                  <article class="detail-item">
                    <div class="detail-item-header">
                      <div>
                        <strong>{{ item.quantity }}x {{ item.productName }}</strong>
                        <span>{{ item.productVariantName }} @if (item.productVariantCode) {({{ item.productVariantCode }})}</span>
                      </div>
                      <strong>{{ formatCurrency(item.subtotal) }}</strong>
                    </div>

                    @if (item.notes) {
                      <p class="muted">Obs.: {{ item.notes }}</p>
                    }

                    @if (item.parts.length > 0) {
                      <div class="compact-detail-list">
                        <strong>Sabores / partes</strong>
                        @for (part of item.parts; track part.productId) {
                          <span>1/{{ part.totalParts }} {{ part.productName }} - valor inteiro {{ formatCurrency(part.fullPrice) }}</span>
                        }
                      </div>
                    }

                    @if (item.options.length > 0) {
                      <div class="compact-detail-list">
                        <strong>Adicionais</strong>
                        @for (option of item.options; track option.orderItemOptionId) {
                          <span>{{ option.quantity }}x {{ option.optionName }} - {{ formatCurrency(option.total) }}</span>
                        }
                      </div>
                    }

                    @if (item.removedIngredients.length > 0) {
                      <div class="compact-detail-list">
                        <strong>Remover</strong>
                        @for (ingredient of item.removedIngredients; track ingredient.orderItemRemovedIngredientId) {
                          <span>{{ ingredient.ingredientName }}</span>
                        }
                      </div>
                    }
                  </article>
                }
              </div>
            </section>

            <dl class="totals">
              <div><dt>Subtotal</dt><dd>{{ formatCurrency(selectedDetail.subtotal) }}</dd></div>
              <div><dt>Taxa de entrega</dt><dd>{{ formatCurrency(selectedDetail.deliveryFee) }}</dd></div>
              <div class="total-line"><dt>Total</dt><dd>{{ formatCurrency(selectedDetail.total) }}</dd></div>
            </dl>
          }
        </section>
      </section>
    </section>
  `,
  styles: [`
    .order-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr));
      gap: 1rem;
    }

    .metric-card {
      display: grid;
      gap: .35rem;
      border-left: 4px solid var(--border);
    }

    .metric-card span {
      color: var(--muted);
      font-size: .82rem;
      font-weight: 700;
    }

    .metric-card strong {
      font-size: 1.5rem;
    }

    .accepted { border-left-color: #4f46e5; }
    .preparing { border-left-color: #d97706; }
    .ready { border-left-color: var(--success); }
    .route { border-left-color: #0369a1; }
    .done { border-left-color: #475569; }
    .cancelled { border-left-color: var(--danger); }

    .status-filter {
      min-width: 0;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1rem;
      margin: 0;
    }

    .filter-feedback {
      grid-column: 1 / -1;
      margin-top: 1rem;
      padding: .65rem .75rem;
    }

    .status-filter legend {
      padding: 0 .35rem;
      font-size: .9rem;
      font-weight: 700;
    }

    .status-filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(190px, 100%), 1fr));
      gap: .75rem;
    }

    .status-filter-option {
      display: flex;
      align-items: flex-start;
      gap: .65rem;
      min-width: 0;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface-soft);
      padding: .75rem;
    }

    .status-filter-option input {
      width: 1rem;
      height: 1rem;
      margin-top: .15rem;
      accent-color: var(--primary);
      flex: 0 0 auto;
    }

    .status-filter-option span {
      display: grid;
      gap: .15rem;
      min-width: 0;
    }

    .status-filter-option small {
      color: var(--muted);
      overflow-wrap: anywhere;
    }

    .order-status-sections {
      display: grid;
      gap: 1.25rem;
    }

    .order-status-section {
      display: grid;
      gap: .85rem;
      border-left: 4px solid var(--border);
      padding-left: .85rem;
    }

    .operator-section-header {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 1rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: .65rem;
    }

    .operator-section-header h2,
    .operator-section-header .eyebrow {
      margin: 0;
    }

    .status-pill.accepted { color: #3730a3; background: #eef2ff; }
    .status-pill.preparing { color: #93370d; background: #fffaeb; }
    .status-pill.ready { color: var(--success); background: #ecfdf3; }
    .status-pill.route { color: #075985; background: #e0f2fe; }
    .status-pill.done { color: #334155; background: #f1f5f9; }
    .status-pill.cancelled { color: var(--danger); background: #fff4f2; }

    .status-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface-soft);
      padding: .85rem;
      margin-bottom: 1rem;
    }

    .status-actions h3 {
      margin: .15rem 0 0;
      font-size: 1rem;
    }

    .status-flow {
      display: grid;
      gap: .5rem;
      margin: 0 0 1rem;
      padding: 0;
      list-style: none;
      counter-reset: flow;
    }

    .status-flow li {
      counter-increment: flow;
      display: flex;
      align-items: center;
      gap: .65rem;
      color: var(--muted);
      font-weight: 700;
    }

    .status-flow li::before {
      content: counter(flow);
      width: 1.65rem;
      height: 1.65rem;
      display: inline-grid;
      place-items: center;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--muted);
      font-size: .8rem;
      flex: 0 0 auto;
    }

    .status-flow li.done,
    .status-flow li.current {
      color: var(--text);
    }

    .status-flow li.done::before,
    .status-flow li.current::before {
      border-color: var(--primary);
      background: var(--primary);
      color: #fff;
    }

    .orders-empty {
      display: grid;
      justify-items: center;
      gap: .5rem;
      padding: 2rem 1rem;
      text-align: center;
    }

    .orders-empty h2,
    .orders-empty p {
      margin: 0;
    }

    .orders-empty p {
      color: var(--muted);
    }

    .empty-mark {
      width: 3rem;
      height: 3rem;
      display: grid;
      place-items: center;
      border-radius: var(--radius);
      background: #eef2ff;
      color: #4f46e5;
      font-weight: 800;
    }

    .order-skeleton-list {
      display: grid;
      gap: .75rem;
    }

    .order-skeleton {
      min-height: 112px;
      border-radius: var(--radius);
      background: linear-gradient(90deg, var(--surface-soft), #e5e7eb, var(--surface-soft));
      background-size: 200% 100%;
      animation: orderPulse 1.2s ease-in-out infinite;
    }

    @keyframes orderPulse {
      from { background-position: 200% 0; }
      to { background-position: -200% 0; }
    }

    @media (max-width: 640px) {
      .status-actions,
      .operator-section-header {
        display: grid;
        justify-content: stretch;
      }

      .order-status-section {
        padding-left: .65rem;
      }
    }
  `]
})
export class OrdersPage {
  private static readonly FiltersStorageKey = 'comandia.admin.orders.filters';
  private static readonly PageSize = 12;
  private static readonly DeliveryFlow: OrderStatus[] = [
    'OrderAccepted',
    'InExecution',
    'ReadyForDelivery',
    'OutForDelivery',
    'Delivered'
  ];
  private static readonly PickupFlow: OrderStatus[] = [
    'OrderAccepted',
    'InExecution',
    'AwaitingPickup',
    'Delivered'
  ];

  protected readonly filtersForm = new FormGroup({
    createdFrom: new FormControl('', { nonNullable: true }),
    createdTo: new FormControl('', { nonNullable: true }),
    search: new FormControl('', { nonNullable: true })
  });
  protected readonly selectedStatuses = signal<OrderStatus[]>([]);
  protected readonly statusSections = computed<StatusSection[]>(() => {
    const orderedStatuses = this.visibleStatusOptions.map((option) => option.value);
    return orderedStatuses
      .map((status) => ({
        status,
        label: this.statusLabel(status),
        orders: this.orders.filter((order) => this.normalizedStatus(order.status) === status)
      }))
      .filter((section) => section.orders.length > 0);
  });

  protected readonly filterStatusOptions: StatusOption[] = [
    { value: 'OrderAccepted', label: 'Pedido aceito', description: 'Entrou na operacao' },
    { value: 'InExecution', label: 'Em execucao', description: 'Cozinha/preparo em andamento' },
    { value: 'ReadyForDelivery', label: 'Pronto para entrega', description: 'Aguardando entregador' },
    { value: 'AwaitingPickup', label: 'Aguardando retirada', description: 'Cliente retira na loja' },
    { value: 'OutForDelivery', label: 'Saiu para entrega', description: 'Entrega em rota' },
    { value: 'Delivered', label: 'Pedido entregue', description: 'Fluxo finalizado' },
    { value: 'Cancelled', label: 'Cancelado', description: 'Pedido encerrado sem entrega' }
  ];
  protected readonly visibleStatusOptions = this.filterStatusOptions;
  protected readonly skeletonItems = [1, 2, 3];

  protected orders: OrderSummary[] = [];
  protected selectedOrderId = '';
  protected selectedDetail: OrderDetail | null = null;
  protected currentPage = 1;
  protected total = 0;
  protected readonly pageSize = OrdersPage.PageSize;
  protected loading = false;
  protected detailLoading = false;
  protected statusUpdating = false;
  protected errorMessage = '';
  protected filtersSavedMessage = '';

  constructor(
    protected readonly catalogContext: CatalogContextService,
    private readonly ordersApi: OrdersApiService
  ) {
    this.restoreSavedFilters();

    effect(() => {
      this.catalogContext.selectedTenantId();
      this.catalogContext.selectedBusinessUnitId();
      this.currentPage = 1;
      this.resetOrders();
      this.loadOrders();
    });
  }

  protected get canUseContext(): boolean {
    return this.catalogContext.hasCatalogContext();
  }

  protected get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  protected get pageRangeLabel(): string {
    if (this.total === 0) {
      return 'Nenhum pedido';
    }

    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.total);
    return `${start}-${end} de ${this.total}`;
  }

  protected applyFilters(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  protected loadOrders(preferredOrderId = ''): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();
    this.resetOrders();

    if (!tenantId || !businessUnitId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.ordersApi.list(tenantId, businessUnitId, this.buildFilters())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          this.orders = result.items;
          this.total = result.total;
          const preferred = this.orders.find((order) => order.orderId === preferredOrderId);
          const nextOrder = preferred ?? this.orders[0];

          if (nextOrder) {
            this.selectOrder(nextOrder);
          }
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
  }

  protected selectOrder(order: OrderSummary): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();
    if (!tenantId || !businessUnitId) {
      return;
    }

    this.selectedOrderId = order.orderId;
    this.selectedDetail = null;
    this.detailLoading = true;
    this.errorMessage = '';

    this.ordersApi.detail(tenantId, businessUnitId, order.orderId)
      .pipe(finalize(() => (this.detailLoading = false)))
      .subscribe({
        next: (detail) => {
          this.selectedDetail = detail;
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
  }

  protected updateStatus(status: OrderStatus): void {
    const detail = this.selectedDetail;
    if (!detail || this.statusUpdating) {
      return;
    }

    this.statusUpdating = true;
    this.errorMessage = '';

    this.ordersApi.updateStatus(detail.tenantId, detail.businessUnitId, detail.orderId, {
      status,
      reason: 'Status atualizado pelo painel administrativo.'
    })
      .pipe(finalize(() => (this.statusUpdating = false)))
      .subscribe({
        next: (updated) => {
          this.selectedDetail = updated;
          this.loadOrders(updated.orderId);
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
  }

  protected previousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }

    this.currentPage -= 1;
    this.loadOrders();
  }

  protected nextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }

    this.currentPage += 1;
    this.loadOrders();
  }

  protected clearFilters(): void {
    this.filtersForm.reset({
      createdFrom: '',
      createdTo: '',
      search: ''
    });
    this.selectedStatuses.set([]);
    this.removeSavedFilters();
    this.filtersSavedMessage = 'Filtros limpos. A proxima visita abrira sem filtro salvo.';
    this.currentPage = 1;
    this.loadOrders();
  }

  protected saveFilters(): void {
    const filters = this.currentFilters();
    localStorage.setItem(OrdersPage.FiltersStorageKey, JSON.stringify(filters));
    this.filtersSavedMessage = 'Filtros salvos. Eles serao aplicados automaticamente ao abrir esta tela.';
    this.currentPage = 1;
    this.loadOrders();
  }

  protected toggleStatus(status: OrderStatus, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.selectedStatuses();

    this.selectedStatuses.set(checked
      ? [...current, status]
      : current.filter((item) => item !== status));
  }

  protected isStatusSelected(status: OrderStatus): boolean {
    return this.selectedStatuses().includes(status);
  }

  protected statusCount(status: OrderStatus): number {
    return this.orders.filter((order) => this.normalizedStatus(order.status) === status).length;
  }

  protected statusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      ReadyForExecution: 'Pedido aceito',
      HumanReviewRequired: 'Revisao humana',
      Completed: 'Pedido entregue',
      Cancelled: 'Cancelado',
      OrderAccepted: 'Pedido aceito',
      InExecution: 'Em execucao',
      ReadyForDelivery: 'Pronto para entrega',
      AwaitingPickup: 'Aguardando retirada',
      OutForDelivery: 'Saiu para entrega',
      Delivered: 'Pedido entregue'
    };

    return labels[status] ?? status;
  }

  protected actionLabel(status: OrderStatus): string {
    const labels: Partial<Record<OrderStatus, string>> = {
      OrderAccepted: 'Aceitar pedido',
      InExecution: 'Iniciar execucao',
      ReadyForDelivery: 'Marcar pronto',
      AwaitingPickup: 'Aguardar retirada',
      OutForDelivery: 'Saiu para entrega',
      Delivered: 'Marcar entregue',
      Cancelled: 'Cancelar'
    };

    return labels[status] ?? this.statusLabel(status);
  }

  protected nextStepLabel(detail: OrderDetail): string {
    const next = this.nextStatuses(detail).find((status) => status !== 'Cancelled');
    if (!next) {
      return detail.status === 'Cancelled' ? 'Pedido cancelado' : 'Fluxo concluido';
    }

    return this.actionLabel(next);
  }

  protected nextStatuses(detail: OrderDetail): OrderStatus[] {
    const status = this.normalizedStatus(detail.status);

    if (status === 'OrderAccepted') {
      return ['InExecution'];
    }

    if (status === 'InExecution') {
      return [detail.fulfillmentType === 'Delivery' ? 'ReadyForDelivery' : 'AwaitingPickup'];
    }

    if (status === 'ReadyForDelivery' && detail.fulfillmentType === 'Delivery') {
      return ['OutForDelivery'];
    }

    if (status === 'AwaitingPickup' && detail.fulfillmentType === 'Pickup') {
      return ['Delivered'];
    }

    if (status === 'OutForDelivery' && detail.fulfillmentType === 'Delivery') {
      return ['Delivered'];
    }

    return [];
  }

  protected canCancel(detail: OrderDetail): boolean {
    return !['Cancelled', 'Delivered', 'Completed'].includes(detail.status);
  }

  protected flowFor(value: OrderDetail['fulfillmentType']): OrderStatus[] {
    return value === 'Delivery' ? OrdersPage.DeliveryFlow : OrdersPage.PickupFlow;
  }

  protected isStatusReached(current: OrderStatus, fulfillment: OrderDetail['fulfillmentType'], status: OrderStatus): boolean {
    const normalized = this.normalizedStatus(current);
    const flow = this.flowFor(fulfillment);
    return flow.indexOf(status) <= flow.indexOf(normalized) && flow.indexOf(normalized) >= 0;
  }

  protected statusTone(status: OrderStatus): string {
    switch (this.normalizedStatus(status)) {
      case 'OrderAccepted':
        return 'accepted';
      case 'InExecution':
        return 'preparing';
      case 'ReadyForDelivery':
      case 'AwaitingPickup':
        return 'ready';
      case 'OutForDelivery':
        return 'route';
      case 'Delivered':
        return 'done';
      case 'Cancelled':
        return 'cancelled';
      default:
        return '';
    }
  }

  protected metricClass(status: OrderStatus): string {
    return `card metric-card ${this.statusTone(status)}`.trim();
  }

  protected sectionClass(status: OrderStatus): string {
    return `order-status-section ${this.statusTone(status)}`.trim();
  }

  protected orderRowClass(order: OrderSummary): string {
    return `order-row ${this.statusTone(order.status)}`.trim();
  }

  protected statusPillClass(status: OrderStatus): string {
    return `status-pill ${this.statusTone(status)}`.trim();
  }

  protected fulfillmentLabel(value: OrderDetail['fulfillmentType']): string {
    return value === 'Delivery' ? 'Entrega' : 'Retirada';
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

  private buildFilters(): OrderListFilters {
    const value = this.currentFilters();

    return {
      status: value.statuses.length > 0 ? value.statuses : undefined,
      createdFromUtc: this.dateToUtcStart(value.createdFrom),
      createdToUtc: this.dateToUtcEnd(value.createdTo),
      search: value.search,
      page: this.currentPage,
      pageSize: this.pageSize
    };
  }

  private currentFilters(): SavedOrderFilters {
    const value = this.filtersForm.getRawValue();

    return {
      statuses: this.selectedStatuses(),
      createdFrom: value.createdFrom,
      createdTo: value.createdTo,
      search: value.search
    };
  }

  private restoreSavedFilters(): void {
    const saved = this.readSavedFilters();
    if (!saved) {
      return;
    }

    this.selectedStatuses.set(saved.statuses);
    this.filtersForm.reset({
      createdFrom: saved.createdFrom,
      createdTo: saved.createdTo,
      search: saved.search
    });
    this.filtersSavedMessage = 'Filtros salvos aplicados automaticamente.';
  }

  private readSavedFilters(): SavedOrderFilters | null {
    const raw = localStorage.getItem(OrdersPage.FiltersStorageKey);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<SavedOrderFilters>;
      const statuses = Array.isArray(parsed.statuses) ? parsed.statuses : [];
      const validStatuses = statuses
        .filter((status): status is OrderStatus => this.isKnownStatus(status));

      return {
        statuses: validStatuses,
        createdFrom: typeof parsed.createdFrom === 'string' ? parsed.createdFrom : '',
        createdTo: typeof parsed.createdTo === 'string' ? parsed.createdTo : '',
        search: typeof parsed.search === 'string' ? parsed.search : ''
      };
    } catch {
      this.removeSavedFilters();
      return null;
    }
  }

  private removeSavedFilters(): void {
    localStorage.removeItem(OrdersPage.FiltersStorageKey);
  }

  private isKnownStatus(value: unknown): value is OrderStatus {
    return typeof value === 'string' &&
      this.filterStatusOptions.some((option) => option.value === value);
  }

  private normalizedStatus(status: OrderStatus): OrderStatus {
    if (status === 'ReadyForExecution') {
      return 'OrderAccepted';
    }

    if (status === 'Completed') {
      return 'Delivered';
    }

    return status;
  }

  private dateToUtcStart(value: string): string | null {
    return value ? new Date(`${value}T00:00:00`).toISOString() : null;
  }

  private dateToUtcEnd(value: string): string | null {
    return value ? new Date(`${value}T23:59:59`).toISOString() : null;
  }

  private resetOrders(): void {
    this.orders = [];
    this.selectedOrderId = '';
    this.selectedDetail = null;
    this.total = 0;
  }
}
