import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, of, take, timeout } from 'rxjs';

import { AiPromptsApiService } from '@core/api/ai-prompts-api.service';
import { AiPrompt } from '@shared/models/ai-prompts.models';
import { ApiFailure } from '@shared/models/common.models';

@Component({
  selector: 'app-ai-prompts',
  standalone: true,
  imports: [ReactiveFormsModule],
  styles: [`
    .prompt-form {
      display: grid;
      gap: 1rem;
    }

    .prompt-editor {
      min-height: 58vh;
      resize: vertical;
      line-height: 1.45;
      font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
      font-size: .9rem;
    }

    .prompt-meta {
      margin: 0;
    }
  `],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">IA</p>
          <h1 class="page-title">Prompts da IA</h1>
          <p class="page-description">Mantenha o prompt global usado na interpretacao dos pedidos.</p>
        </div>
        <div class="crud-toolbar">
          <button class="btn" type="button" (click)="loadPrompt()" [disabled]="loading || saving">Recarregar</button>
          <button class="btn btn-primary" type="button" (click)="submit()" [disabled]="!canSave">
            {{ saving ? 'Salvando...' : 'Salvar prompt' }}
          </button>
        </div>
      </header>

      @if (successMessage) {
        <p class="feedback success">{{ successMessage }}</p>
      }

      @if (errorMessage) {
        <p class="feedback error">{{ errorMessage }}</p>
      }

      <section class="card">
        <div class="section-heading">
          <div>
            <h2>Interpretacao de pedidos</h2>
            <p>Chave: order_interpretation</p>
          </div>
          @if (prompt) {
            <dl class="detail-grid prompt-meta">
              <div>
                <dt>Versao</dt>
                <dd>{{ prompt.version }}</dd>
              </div>
              <div>
                <dt>Atualizado em</dt>
                <dd>{{ formatDate(prompt.updatedAtUtc) }}</dd>
              </div>
              <div>
                <dt>Atualizado por</dt>
                <dd>{{ prompt.updatedByUserId || 'Seed inicial' }}</dd>
              </div>
            </dl>
          }
        </div>

        @if (loading) {
          <p class="muted">Carregando prompt...</p>
        } @else {
          <form class="prompt-form" [formGroup]="form" (ngSubmit)="submit()">
            @for (section of sections; track section.title) {
              <label class="field">
                <span>{{ section.title }}</span>
                <textarea class="prompt-editor" [value]="section.content" [readOnly]="!section.editable" [disabled]="!section.editable" spellcheck="false" (input)="updateCustomSection($any($event.target).value)"></textarea>
                <small class="field-hint">{{ section.editable ? 'Use este espaço para orientações adicionais da loja.' : 'Seção de plataforma: mantida pelo sistema para preservar regras e contratos.' }}</small>
              </label>
            }
            @if (isContentInvalid()) {
              <small>Informe o conteúdo do prompt.</small>
            }

            <div class="button-row form-actions">
              <button class="btn btn-primary" type="submit" [disabled]="!canSave">
                {{ saving ? 'Salvando...' : 'Salvar prompt' }}
              </button>
              <button class="btn" type="button" (click)="resetForm()" [disabled]="loading || saving || !hasChanges">
                Desfazer alteracoes
              </button>
            </div>
          </form>
        }
      </section>
    </section>
  `
})
export class AiPromptsPage {
  private static readonly RequestTimeoutMs = 15000;

  protected readonly form = new FormGroup({
    content: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  private readonly promptState = signal<AiPrompt | null>(null);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly successMessageState = signal('');
  private readonly errorMessageState = signal('');
  private loadRequestId = 0;
  private saveRequestId = 0;

  protected get prompt(): AiPrompt | null { return this.promptState(); }
  protected set prompt(value: AiPrompt | null) { this.promptState.set(value); }
  protected get loading(): boolean { return this.loadingState(); }
  protected set loading(value: boolean) { this.loadingState.set(value); }
  protected get saving(): boolean { return this.savingState(); }
  protected set saving(value: boolean) { this.savingState.set(value); }
  protected get successMessage(): string { return this.successMessageState(); }
  protected set successMessage(value: string) { this.successMessageState.set(value); }
  protected get errorMessage(): string { return this.errorMessageState(); }
  protected set errorMessage(value: string) { this.errorMessageState.set(value); }

  constructor(private readonly aiPromptsApi: AiPromptsApiService) {
    this.loadPrompt();
  }

  protected get hasChanges(): boolean {
    return this.prompt?.content !== this.form.controls.content.value;
  }

  protected get canSave(): boolean {
    return !this.loading && !this.saving && this.form.valid && this.hasChanges;
  }

  protected get sections(): PromptSection[] {
    return parseSections(this.form.controls.content.value);
  }

  protected updateCustomSection(content: string): void {
    const marker = '## Instruções personalizadas';
    const current = this.form.controls.content.value;
    const index = current.indexOf(marker);
    if (index < 0) {
      return;
    }

    this.form.controls.content.setValue(`${current.slice(0, index + marker.length)}\n${content.trim()}`);
  }

  protected loadPrompt(): void {
    const requestId = ++this.loadRequestId;
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.aiPromptsApi.getOrderInterpretation()
      .pipe(
        timeout(AiPromptsPage.RequestTimeoutMs),
        take(1),
        catchError((failure: unknown) => {
          if (requestId === this.loadRequestId) {
            this.errorMessage = this.failureMessage(failure);
          }
          return of(null);
        }),
        finalize(() => {
          if (requestId === this.loadRequestId) {
            this.loading = false;
          }
        })
      )
      .subscribe({
        next: (prompt) => {
          if (!prompt || requestId !== this.loadRequestId) {
            return;
          }

          this.prompt = prompt;
          this.form.setValue({ content: prompt.content });
          this.form.markAsPristine();
        }
      });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.hasChanges) {
      return;
    }

    const requestId = ++this.saveRequestId;
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.aiPromptsApi.updateOrderInterpretation({
      content: this.form.controls.content.value.trim()
    })
      .pipe(
        timeout(AiPromptsPage.RequestTimeoutMs),
        take(1),
        catchError((failure: unknown) => {
          if (requestId === this.saveRequestId) {
            this.errorMessage = this.failureMessage(failure);
          }
          return of(null);
        }),
        finalize(() => {
          if (requestId === this.saveRequestId) {
            this.saving = false;
          }
        })
      )
      .subscribe({
        next: (prompt) => {
          if (!prompt || requestId !== this.saveRequestId) {
            return;
          }

          this.prompt = prompt;
          this.form.setValue({ content: prompt.content });
          this.form.markAsPristine();
          this.successMessage = 'Prompt atualizado com sucesso.';
        },
      });
  }

  private failureMessage(failure: unknown): string {
    if (failure && typeof failure === 'object') {
      const candidate = failure as Partial<ApiFailure>;
      if (candidate.error && typeof candidate.error.message === 'string') {
        return candidate.error.message;
      }
    }

    return 'Nao foi possivel carregar o prompt da IA. Tente novamente.';
  }

  protected resetForm(): void {
    if (!this.prompt) {
      this.form.reset({ content: '' });
      return;
    }

    this.form.setValue({ content: this.prompt.content });
    this.form.markAsPristine();
  }

  protected isContentInvalid(): boolean {
    const control = this.form.controls.content;
    return control.invalid && (control.dirty || control.touched);
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium'
    }).format(new Date(value));
  }
}

interface PromptSection {
  title: string;
  content: string;
  editable: boolean;
}

function parseSections(document: string): PromptSection[] {
  const matches = [...document.matchAll(/^## (.+)$/gm)];
  if (matches.length === 0) {
    return [{ title: 'Instruções personalizadas', content: document, editable: true }];
  }

  return matches.map((match, index) => {
    const contentStart = (match.index ?? 0) + match[0].length;
    const contentEnd = matches[index + 1]?.index ?? document.length;
    const title = match[1].trim();
    return {
      title,
      content: document.slice(contentStart, contentEnd).trim(),
      editable: title === 'Instruções personalizadas'
    };
  });
}
