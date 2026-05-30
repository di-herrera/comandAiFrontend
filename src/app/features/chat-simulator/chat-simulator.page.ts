import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { ChatSimulatorApiService } from '@core/api/chat-simulator-api.service';
import { CatalogContextService } from '@core/context/catalog-context.service';
import { CatalogContextSelectorComponent } from '@shared/components/catalog-context-selector/catalog-context-selector.component';
import { SimulateMessageResult } from '@shared/models/chat-simulator.models';
import { ApiFailure } from '@shared/models/common.models';

interface ChatMessage {
  role: 'customer' | 'system';
  text: string;
  result?: SimulateMessageResult;
}

@Component({
  selector: 'app-chat-simulator',
  standalone: true,
  imports: [ReactiveFormsModule, CatalogContextSelectorComponent],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Teste sem WhatsApp</p>
          <h1 class="page-title">Simulador de chat</h1>
          <p class="page-description">Envie mensagens como se fossem recebidas pelo WhatsApp e veja como a ComandIA responde.</p>
        </div>
      </header>

      @if (errorMessage()) {
        <p class="feedback error">{{ errorMessage() }}</p>
      }

      <app-catalog-context-selector />

      <section class="card">
        <div class="form-grid">
<label class="field">
            <span>Telefone do cliente</span>
            <input type="text" [formControl]="phoneControl" placeholder="+5517999999999" />
          </label>

          <label class="field">
            <span>Identificador do canal</span>
            <input type="text" [formControl]="channelIdentifierControl" placeholder="whatsapp-dev" />
          </label>

          <div class="context-panel">
            <strong>Contexto do teste</strong>
            <span>Empresa: {{ catalogContext.selectedTenantName() || 'padrão do backend' }}</span>
            <span>Unidade: {{ catalogContext.selectedBusinessUnitName() || 'padrão do backend' }}</span>
            <span>Telefone: {{ phoneControl.value || 'não informado' }}</span>
          </div>
        </div>
      </section>

      <section class="chat-layout">
        <div class="chat-window card">
          @if (messages().length === 0) {
            <div class="empty-chat">
              <h2>Conversa de teste</h2>
              <p>Digite uma mensagem como "quero um X-Bacon sem cebola" para simular a entrada recebida pelo WhatsApp.</p>
            </div>
          } @else {
            @for (message of messages(); track $index) {
              <article class="chat-bubble" [class.customer]="message.role === 'customer'" [class.system]="message.role === 'system'">
                <strong>{{ message.role === 'customer' ? 'Cliente' : 'ComandIA' }}</strong>
                <p>{{ message.text }}</p>

                @if (message.result) {
                  <details>
                    <summary>Detalhes do processamento</summary>
                    <dl class="result-grid">
                      <div>
                        <dt>Conversa</dt>
                        <dd>{{ message.result.conversationId }}</dd>
                      </div>
                      <div>
                        <dt>Rascunho</dt>
                        <dd>{{ message.result.orderDraftId || '-' }}</dd>
                      </div>
                      <div>
                        <dt>Pedido</dt>
                        <dd>{{ message.result.orderId || '-' }}</dd>
                      </div>
                      <div>
                        <dt>Atenção humana</dt>
                        <dd>{{ message.result.requiresHumanAttention ? 'Sim' : 'Não' }}</dd>
                      </div>
                    </dl>

                    @if (message.result.interpretedActions.length > 0) {
                      <h3>Ações interpretadas</h3>
                      <ul class="compact-list">
                        @for (action of message.result.interpretedActions; track $index) {
                          <li>{{ describeInterpretedAction(action) }}</li>
                        }
                      </ul>
                    }

                    @if (message.result.appliedActions.length > 0) {
                      <h3>Ações aplicadas</h3>
                      <ul class="compact-list">
                        @for (action of message.result.appliedActions; track $index) {
                          <li>{{ describeAppliedAction(action) }}</li>
                        }
                      </ul>
                    }

                    @if (message.result.validationErrors.length > 0) {
                      <h3>Validações</h3>
                      <ul class="compact-list">
                        @for (validation of message.result.validationErrors; track validation) {
                          <li>{{ validation }}</li>
                        }
                      </ul>
                    }
                  </details>
                }
              </article>
            }
          }
        </div>

        <form class="card send-panel" [formGroup]="messageForm" (ngSubmit)="sendMessage()">
          <label class="field">
            <span>Mensagem recebida</span>
            <textarea rows="5" formControlName="text" placeholder="Ex.: quero um X-Bacon sem cebola"></textarea>
            @if (messageForm.controls.text.invalid && messageForm.controls.text.touched) {
              <small>Informe a mensagem para simular.</small>
            }
          </label>

          <div class="button-row">
            <button class="btn btn-primary" type="submit" [disabled]="sending()">
              {{ sending() ? 'Enviando...' : 'Enviar mensagem' }}
            </button>
            <button class="btn" type="button" (click)="clearChat()" [disabled]="sending() || messages().length === 0">
              Limpar conversa
            </button>
          </div>
        </form>
      </section>
    </section>
  `
})
export class ChatSimulatorPage {
  protected readonly phoneControl = new FormControl('+5517999999999', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(32)]
  });
  protected readonly channelIdentifierControl = new FormControl('whatsapp-dev', {
    nonNullable: true,
    validators: [Validators.maxLength(80)]
  });
  protected readonly messageForm = new FormGroup({
    text: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(1000)] })
  });

  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly sending = signal(false);
  protected readonly errorMessage = signal('');



  constructor(
    protected readonly catalogContext: CatalogContextService,
    private readonly chatSimulatorApi: ChatSimulatorApiService
  ) {}

  protected sendMessage(): void {
    if (this.phoneControl.invalid) {
      this.phoneControl.markAsTouched();
      this.errorMessage.set('Informe o telefone do cliente.');
      return;
    }

    if (this.messageForm.invalid) {
      this.messageForm.markAllAsTouched();
      return;
    }

    const text = this.messageForm.controls.text.value.trim();
    this.errorMessage.set('');
    this.sending.set(true);
    this.messages.update((messages) => [...messages, { role: 'customer', text }]);

    this.chatSimulatorApi.send({
      tenantId: this.emptyToNull(this.catalogContext.selectedTenantId()),
      businessUnitId: this.emptyToNull(this.catalogContext.selectedBusinessUnitId()),
      channelId: null,
      channelIdentifier: this.emptyToNull(this.channelIdentifierControl.value),
      phoneNumber: this.phoneControl.value.trim(),
      text
    }).pipe(finalize(() => this.sending.set(false))).subscribe({
      next: (result) => {
        this.messages.update((messages) => [
          ...messages,
          { role: 'system', text: result.customerReply || 'Mensagem processada.', result }
        ]);
        this.messageForm.reset({ text: '' });
      },
      error: (failure: ApiFailure) => {
        this.errorMessage.set(failure.error.message);
      }
    });
  }

  protected clearChat(): void {
    this.messages.set([]);
    this.errorMessage.set('');
  }

  protected describeInterpretedAction(action: { type: string; productCode: string | null; ingredientCode: string | null; optionCode: string | null }): string {
    const details = [action.productCode, action.ingredientCode, action.optionCode].filter(Boolean).join(' / ');
    return details ? `${action.type}: ${details}` : action.type;
  }

  protected describeAppliedAction(action: { type: string; applied: boolean; detail: string | null; error: string | null }): string {
    const status = action.applied ? 'aplicada' : 'não aplicada';
    const detail = action.detail || action.error;
    return detail ? `${action.type} ${status}: ${detail}` : `${action.type} ${status}`;
  }


  private emptyToNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
}
