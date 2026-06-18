import { Component, effect } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { OrdersApiService } from '@core/api/orders-api.service';
import { CatalogContextService } from '@core/context/catalog-context.service';
import { ApiFailure } from '@shared/models/common.models';
import { OrderDetail, OrderListFilters, OrderStatus, OrderSummary } from '@shared/models/orders.models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Do WhatsApp para a comanda</p>
          <h1 class="page-title">Acompanhamento de pedidos</h1>
          <p class="page-description">Veja comandas prontas para execucao e casos que precisam de atencao humana.</p>
        </div>
      </header>

      @if (errorMessage) {
        <p class="feedback error">{{ errorMessage }}</p>
      }

      <section class="card">
        <form class="form-grid" [formGroup]="filtersForm" (ngSubmit)="loadOrders()">
          <label class="field">
            <span>Status</span>
            <select formControlName="status">
              <option value="">Todos</option>
              <option value="ReadyForExecution">Pronta para execucao</option>
              <option value="HumanReviewRequired">Revisao humana</option>
              <option value="Completed">Concluida</option>
              <option value="Cancelled">Cancelada</option>
            </select>
          </label>

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
            <button class="btn" type="button" (click)="clearFilters()" [disabled]="loading">
              Limpar filtros
            </button>
          </div>
        </form>
      </section>

      <section class="orders-layout">
        <section class="card orders-list-card">
          <div class="section-heading">
            <div>
              <h2>Comandas</h2>
              <p>{{ orders.length }} pedido(s) no contexto selecionado.</p>
            </div>
            <button class="btn" type="button" (click)="loadOrders()" [disabled]="loading || !canUseContext">Atualizar</button>
          </div>

          @if (!canUseContext) {
            <p class="muted">Selecione empresa e unidade para acompanhar pedidos.</p>
          } @else if (loading) {
            <p class="muted">Carregando pedidos...</p>
          } @else if (orders.length === 0) {
            <p class="muted">Nenhuma comanda encontrada para os filtros atuais.</p>
          } @else {
            <div class="order-list">
              @for (order of orders; track order.orderId) {
                <button
                  class="order-row"
                  type="button"
                  [class.selected]="selectedOrderId === order.orderId"
                  [class.ready]="order.status === 'ReadyForExecution'"
                  (click)="selectOrder(order)"
                >
                  <span class="order-main">
                    <strong>{{ order.orderNumber }}</strong>
                    <span>{{ order.customer.name || 'Cliente sem nome' }} - {{ order.customer.phoneNumber }}</span>
                  </span>
                  <span class="order-meta">
                    <span class="status-pill">{{ statusLabel(order.status) }}</span>
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
          }
        </section>

        <section class="card order-detail-card">
          @if (detailLoading) {
            <p class="muted">Carregando detalhe da comanda...</p>
          } @else if (!selectedOrderId) {
            <p class="muted">Selecione uma comanda para ver itens, entrega e totais.</p>
          } @else if (!selectedDetail) {
            <p class="muted">Detalhe nao disponivel para a comanda selecionada.</p>
          } @else {
            <div class="section-heading">
              <div>
                <h2>Comanda {{ selectedDetail.orderNumber }}</h2>
                <p>{{ selectedDetail.customer.name || 'Cliente sem nome' }} - {{ selectedDetail.customer.phoneNumber }}</p>
              </div>
              <span class="status-pill">{{ statusLabel(selectedDetail.status) }}</span>
            </div>

            @if (selectedDetail.requiresHumanHandoff) {
              <p class="feedback warning">Atencao humana: {{ selectedDetail.humanHandoffReason || 'pedido marcado para revisao.' }}</p>
            }

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
  `
})
export class OrdersPage {
  protected readonly filtersForm = new FormGroup({
    status: new FormControl<OrderStatus | ''>('', { nonNullable: true }),
    createdFrom: new FormControl('', { nonNullable: true }),
    createdTo: new FormControl('', { nonNullable: true }),
    search: new FormControl('', { nonNullable: true })
  });

  protected orders: OrderSummary[] = [];
  protected selectedOrderId = '';
  protected selectedDetail: OrderDetail | null = null;
  protected loading = false;
  protected detailLoading = false;
  protected errorMessage = '';

  constructor(
    protected readonly catalogContext: CatalogContextService,
    private readonly ordersApi: OrdersApiService
  ) {
    effect(() => {
      this.catalogContext.selectedTenantId();
      this.catalogContext.selectedBusinessUnitId();
      this.resetOrders();
      this.loadOrders();
    });
  }

  protected get canUseContext(): boolean {
    return this.catalogContext.hasCatalogContext();
  }

  protected loadOrders(): void {
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
          if (this.orders.length > 0) {
            this.selectOrder(this.orders[0]);
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

  protected clearFilters(): void {
    this.filtersForm.reset({
      status: '',
      createdFrom: '',
      createdTo: '',
      search: ''
    });
    this.loadOrders();
  }

  protected statusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      ReadyForExecution: 'Pronta para execucao',
      HumanReviewRequired: 'Revisao humana',
      Completed: 'Concluida',
      Cancelled: 'Cancelada'
    };

    return labels[status] ?? status;
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
    const value = this.filtersForm.getRawValue();

    return {
      status: value.status,
      createdFromUtc: this.dateToUtcStart(value.createdFrom),
      createdToUtc: this.dateToUtcEnd(value.createdTo),
      search: value.search
    };
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
  }
}

