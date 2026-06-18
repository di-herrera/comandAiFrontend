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
  imports: [ReactiveFormsModule],
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
        <form class="form-grid" [formGroup]="filtersForm" (ngSubmit)="loadInteractions()">
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
              <p>{{ interactions.length }} interacao(oes) no contexto selecionado.</p>
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
                    @if (interaction.errorMessage) {
                      <span class="error-inline">{{ interaction.errorMessage }}</span>
                    }
                  </span>
                </button>
              }
            </div>
          }
        </section>

        <section class="card audit-detail-card">
          @if (!selectedInteraction) {
            <p class="muted">Selecione uma interacao para ver mensagem, prompt, resposta e JSON parseado.</p>
          } @else {
            <div class="section-heading">
              <div>
                <h2>Detalhe da interacao</h2>
                <p>{{ selectedInteraction.provider }} / {{ selectedInteraction.model }} - {{ formatDate(selectedInteraction.createdAtUtc) }}</p>
              </div>
              <span class="status-pill" [class.attention]="!selectedInteraction.parsedSuccessfully">
                {{ selectedInteraction.parsedSuccessfully ? 'Sucesso' : 'Falha' }}
              </span>
            </div>

            <dl class="detail-grid">
              <div>
                <dt>ConversationId</dt>
                <dd>{{ selectedInteraction.conversationId }}</dd>
              </div>
              <div>
                <dt>IncomingMessageId</dt>
                <dd>{{ selectedInteraction.incomingMessageId }}</dd>
              </div>
              <div>
                <dt>Duração</dt>
                <dd>{{ selectedInteraction.durationMs }} ms</dd>
              </div>
              <div>
                <dt>Registro</dt>
                <dd>{{ selectedInteraction.id }}</dd>
              </div>
            </dl>

            @if (selectedInteraction.errorMessage) {
              <p class="feedback error">{{ selectedInteraction.errorMessage }}</p>
            }

            <section class="audit-detail-section">
              <h3>Mensagem do cliente</h3>
              <pre>{{ selectedInteraction.customerMessage || 'Nao informado' }}</pre>
            </section>

            <section class="audit-detail-section">
              <h3>Prompt enviado</h3>
              <pre>{{ selectedInteraction.prompt }}</pre>
            </section>

            <section class="audit-detail-section">
              <h3>Resposta bruta</h3>
              <pre>{{ selectedInteraction.responseText || 'Nao informado' }}</pre>
            </section>

            <section class="audit-detail-section">
              <h3>JSON parseado</h3>
              <pre>{{ formatJson(selectedInteraction.parsedResultJson) }}</pre>
            </section>
          }
        </section>
      </section>
    </section>
  `
})
export class AiAuditPage {
  protected readonly filtersForm = new FormGroup({
    parsedStatus: new FormControl<ParsedStatusFilter>('', { nonNullable: true }),
    createdFrom: new FormControl('', { nonNullable: true }),
    createdTo: new FormControl('', { nonNullable: true }),
    conversationId: new FormControl('', { nonNullable: true }),
    incomingMessageId: new FormControl('', { nonNullable: true })
  });

  protected interactions: AiInteractionListItem[] = [];
  protected selectedInteraction: AiInteractionListItem | null = null;
  protected loading = false;
  protected errorMessage = '';

  constructor(
    protected readonly catalogContext: CatalogContextService,
    private readonly aiAuditApi: AiAuditApiService
  ) {
    effect(() => {
      this.catalogContext.selectedTenantId();
      this.catalogContext.selectedBusinessUnitId();
      this.resetInteractions();
      this.loadInteractions();
    });
  }

  protected get canUseContext(): boolean {
    return this.catalogContext.hasCatalogContext();
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
          this.selectedInteraction = this.interactions[0] ?? null;
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
  }

  protected selectInteraction(interaction: AiInteractionListItem): void {
    this.selectedInteraction = interaction;
  }

  protected clearFilters(): void {
    this.filtersForm.reset({
      parsedStatus: '',
      createdFrom: '',
      createdTo: '',
      conversationId: '',
      incomingMessageId: ''
    });
    this.loadInteractions();
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

  private buildFilters(): AiInteractionFilters {
    const value = this.filtersForm.getRawValue();

    return {
      conversationId: this.trimOrNull(value.conversationId),
      incomingMessageId: this.trimOrNull(value.incomingMessageId),
      parsedSuccessfully: this.toParsedSuccessfully(value.parsedStatus),
      createdFromUtc: this.dateToUtcStart(value.createdFrom),
      createdToUtc: this.dateToUtcEnd(value.createdTo)
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
  }
}

