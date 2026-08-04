import { CommonModule } from '@angular/common';
import { Component, effect } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AiAuditApiService } from '@core/api/ai-audit-api.service';
import { CatalogContextService } from '@core/context/catalog-context.service';
import { AiInteractionFilters, AiInteractionListItem } from '@shared/models/ai-audit.models';
import { ApiFailure } from '@shared/models/common.models';

type ParsedStatusFilter = '' | 'success' | 'failure';

@Component({
  selector: 'app-ai-audit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Auditoria de IA</p>
          <h1 class="page-title">Interacoes da IA</h1>
          <p class="page-description">Consulte prompts, respostas e falhas de parse sem expor secrets ou headers sensiveis.</p>
        </div>
      </header>

      @if (errorMessage) {
        <p class="feedback error">{{ errorMessage }}</p>
      }

      <section class="card">
        <form class="form-grid" [formGroup]="filtersForm" (ngSubmit)="applyFilters()">
          <label class="field">
            <span>Status de parse</span>
            <select formControlName="parsedStatus">
              <option value="">Todos</option>
              <option value="success">Sucesso</option>
              <option value="failure">Falha</option>
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
            <span>ConversationId</span>
            <input type="text" formControlName="conversationId" placeholder="uuid" />
          </label>

          <label class="field">
            <span>IncomingMessageId</span>
            <input type="text" formControlName="incomingMessageId" placeholder="uuid" />
          </label>

          <div class="button-row form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="loading || !canUseContext">
              {{ loading ? 'Carregando...' : 'Aplicar filtros' }}
            </button>
            <button class="btn" type="button" (click)="clearFilters()" [disabled]="loading">Limpar filtros</button>
          </div>
        </form>
      </section>

      <section class="audit-layout">
        <section class="card audit-list-card">
          <div class="section-heading">
            <div>
              <h2>Registros</h2>
              <p>{{ total }} interacao(oes) no contexto selecionado.</p>
            </div>
            <button class="btn" type="button" (click)="loadInteractions()" [disabled]="loading || !canUseContext">Atualizar</button>
          </div>

          @if (!canUseContext) {
            <p class="muted">Selecione empresa e unidade para listar auditorias de IA.</p>
          } @else if (loading) {
            <p class="muted">Carregando interacoes...</p>
          } @else if (interactions.length === 0) {
            <p class="muted">Nenhuma interacao encontrada para os filtros atuais.</p>
          } @else {
            <div class="audit-list">
              @for (interaction of interactions; track interaction.id) {
                <button
                  class="audit-row"
                  type="button"
                  [class.selected]="selectedInteraction?.id === interaction.id"
                  [class.failed]="!interaction.parsedSuccessfully"
                  (click)="selectInteraction(interaction)"
                >
                  <span class="audit-row-header">
                    <strong>{{ interaction.provider }} / {{ interaction.model }}</strong>
                    <span class="status-pill" [class.attention]="!interaction.parsedSuccessfully">
                      {{ interaction.parsedSuccessfully ? 'Parse OK' : 'Falha no parse' }}
                    </span>
                  </span>
                  <span class="audit-message">{{ interaction.customerMessage || 'Mensagem vazia' }}</span>
                  <span class="audit-facts">
                    <span>{{ formatDate(interaction.createdAtUtc) }}</span>
                    <span>{{ interaction.durationMs }} ms</span>
                    <span>{{ formatTokenSummary(interaction) }}</span>
                    <span>{{ formatEstimatedCost(interaction.estimatedCostUsd) }}</span>
                    @if (interaction.errorMessage) {
                      <span class="error-inline">{{ interaction.errorMessage }}</span>
                    }
                  </span>
                </button>
              }
            </div>

            <nav class="pagination-bar" aria-label="Paginacao de auditoria de IA">
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

        <section class="card audit-detail-card desktop-audit-detail">
          @if (!selectedInteraction) {
            <p class="muted">Selecione uma interacao para ver mensagem, prompt, resposta e JSON parseado.</p>
          } @else {
            <ng-container [ngTemplateOutlet]="auditDetailContent" [ngTemplateOutletContext]="{ $implicit: selectedInteraction }" />
          }
        </section>
      </section>

      @if (detailModalOpen && selectedInteraction) {
        <div class="operator-modal-backdrop audit-modal-backdrop" role="presentation" (click)="closeDetailModal()">
          <section class="operator-modal audit-modal" role="dialog" aria-modal="true" aria-label="Detalhe da interacao de IA" (click)="$event.stopPropagation()">
            <header class="operator-modal-header">
              <div>
                <h2>Detalhe da interacao</h2>
                <p>{{ selectedInteraction.provider }} / {{ selectedInteraction.model }} - {{ formatDate(selectedInteraction.createdAtUtc) }}</p>
              </div>
              <button class="btn editor-close" type="button" (click)="closeDetailModal()" aria-label="Fechar detalhe">x</button>
            </header>

            <ng-container [ngTemplateOutlet]="auditDetailContent" [ngTemplateOutletContext]="{ $implicit: selectedInteraction }" />
          </section>
        </div>
      }

      <ng-template #auditDetailContent let-interaction>
        <div class="section-heading audit-detail-heading">
          <div>
            <h2>Detalhe da interacao</h2>
            <p>{{ interaction.provider }} / {{ interaction.model }} - {{ formatDate(interaction.createdAtUtc) }}</p>
          </div>
          <span class="status-pill" [class.attention]="!interaction.parsedSuccessfully">
            {{ interaction.parsedSuccessfully ? 'Sucesso' : 'Falha' }}
          </span>
        </div>

        <dl class="detail-grid">
          <div>
            <dt>ConversationId</dt>
            <dd>{{ interaction.conversationId }}</dd>
          </div>
          <div>
            <dt>IncomingMessageId</dt>
            <dd>{{ interaction.incomingMessageId }}</dd>
          </div>
          <div>
            <dt>Duração</dt>
            <dd>{{ interaction.durationMs }} ms</dd>
          </div>
          <div>
            <dt>Tokens entrada</dt>
            <dd>{{ formatNumber(interaction.inputTokens) }}</dd>
          </div>
          <div>
            <dt>Tokens cache hit</dt>
            <dd>{{ formatNumber(interaction.cachedInputTokens) }}</dd>
          </div>
          <div>
            <dt>Tokens cache write</dt>
            <dd>{{ formatNumber(interaction.cacheWriteInputTokens) }}</dd>
          </div>
          <div>
            <dt>Tokens saída</dt>
            <dd>{{ formatNumber(interaction.outputTokens) }}</dd>
          </div>
          <div>
            <dt>Tokens total</dt>
            <dd>{{ formatNumber(interaction.totalTokens) }}</dd>
          </div>
          <div>
            <dt>Custo estimado</dt>
            <dd>{{ formatEstimatedCost(interaction.estimatedCostUsd) }}</dd>
          </div>
          <div>
            <dt>Registro</dt>
            <dd>{{ interaction.id }}</dd>
          </div>
        </dl>

        @if (interaction.errorMessage) {
          <p class="feedback error">{{ interaction.errorMessage }}</p>
        }

        <section class="audit-detail-section">
          <h3>Mensagem do cliente</h3>
          <pre>{{ interaction.customerMessage || 'Nao informado' }}</pre>
        </section>

        <section class="audit-detail-section">
          <h3>Prompt enviado</h3>
          <pre>{{ interaction.prompt }}</pre>
        </section>

        <section class="audit-detail-section">
          <h3>Resposta bruta</h3>
          <pre>{{ interaction.responseText || 'Nao informado' }}</pre>
        </section>

        <section class="audit-detail-section">
          <h3>JSON parseado</h3>
          <pre>{{ formatJson(interaction.parsedResultJson) }}</pre>
        </section>
      </ng-template>
    </section>
  `
})
export class AiAuditPage {
  private static readonly PageSize = 20;
  private static readonly MobileBreakpoint = 980;

  protected readonly filtersForm = new FormGroup({
    parsedStatus: new FormControl<ParsedStatusFilter>('', { nonNullable: true }),
    createdFrom: new FormControl(AiAuditPage.defaultCreatedFromDate(), { nonNullable: true }),
    createdTo: new FormControl('', { nonNullable: true }),
    conversationId: new FormControl('', { nonNullable: true }),
    incomingMessageId: new FormControl('', { nonNullable: true })
  });

  protected interactions: AiInteractionListItem[] = [];
  protected selectedInteraction: AiInteractionListItem | null = null;
  protected currentPage = 1;
  protected total = 0;
  protected readonly pageSize = AiAuditPage.PageSize;
  protected detailModalOpen = false;
  protected loading = false;
  protected errorMessage = '';

  constructor(
    protected readonly catalogContext: CatalogContextService,
    private readonly aiAuditApi: AiAuditApiService
  ) {
    effect(() => {
      this.catalogContext.selectedTenantId();
      this.catalogContext.selectedBusinessUnitId();
      this.currentPage = 1;
      this.resetInteractions();
      this.loadInteractions();
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
      return 'Nenhum registro';
    }

    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.total);
    return `${start}-${end} de ${this.total}`;
  }

  protected applyFilters(): void {
    this.currentPage = 1;
    this.loadInteractions();
  }

  protected loadInteractions(): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();
    this.resetInteractions();

    if (!tenantId || !businessUnitId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.aiAuditApi.list(tenantId, businessUnitId, this.buildFilters())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          this.interactions = result.items;
          this.total = result.total;
          this.selectedInteraction = this.isMobileViewport() ? null : this.interactions[0] ?? null;
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
  }

  protected selectInteraction(interaction: AiInteractionListItem): void {
    this.selectedInteraction = interaction;
    this.detailModalOpen = this.isMobileViewport();
  }

  protected closeDetailModal(): void {
    this.detailModalOpen = false;
  }

  protected previousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }

    this.currentPage -= 1;
    this.loadInteractions();
  }

  protected nextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }

    this.currentPage += 1;
    this.loadInteractions();
  }

  protected clearFilters(): void {
    this.filtersForm.reset({
      parsedStatus: '',
      createdFrom: AiAuditPage.defaultCreatedFromDate(),
      createdTo: '',
      conversationId: '',
      incomingMessageId: ''
    });
    this.applyFilters();
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium'
    }).format(new Date(value));
  }

  protected formatJson(value?: string | null): string {
    if (!value) {
      return 'Nao informado';
    }

    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  protected formatNumber(value?: number | null): string {
    if (value === null || value === undefined) {
      return 'Nao informado';
    }

    return new Intl.NumberFormat('pt-BR').format(value);
  }

  protected formatEstimatedCost(value?: number | null): string {
    if (value === null || value === undefined) {
      return 'Custo nao estimado';
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 6,
      maximumFractionDigits: 8
    }).format(value);
  }

  protected formatTokenSummary(interaction: AiInteractionListItem): string {
    if (interaction.totalTokens === null || interaction.totalTokens === undefined) {
      return 'Tokens nao informados';
    }

    const cached = interaction.cachedInputTokens ?? 0;
    return `${this.formatNumber(interaction.totalTokens)} tokens (${this.formatNumber(cached)} cache)`;
  }

  private buildFilters(): AiInteractionFilters {
    const value = this.filtersForm.getRawValue();

    return {
      conversationId: this.trimOrNull(value.conversationId),
      incomingMessageId: this.trimOrNull(value.incomingMessageId),
      parsedSuccessfully: this.toParsedSuccessfully(value.parsedStatus),
      createdFromUtc: this.dateToUtcStart(value.createdFrom),
      createdToUtc: this.dateToUtcEnd(value.createdTo),
      page: this.currentPage,
      pageSize: this.pageSize
    };
  }

  private toParsedSuccessfully(value: ParsedStatusFilter): boolean | null {
    if (value === 'success') {
      return true;
    }

    if (value === 'failure') {
      return false;
    }

    return null;
  }

  private trimOrNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private dateToUtcStart(value: string): string | null {
    return value ? new Date(`${value}T00:00:00`).toISOString() : null;
  }

  private dateToUtcEnd(value: string): string | null {
    return value ? new Date(`${value}T23:59:59`).toISOString() : null;
  }

  private resetInteractions(): void {
    this.interactions = [];
    this.selectedInteraction = null;
    this.detailModalOpen = false;
    this.total = 0;
  }

  private isMobileViewport(): boolean {
    return window.innerWidth <= AiAuditPage.MobileBreakpoint;
  }

  private static defaultCreatedFromDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 1);

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  }
}
