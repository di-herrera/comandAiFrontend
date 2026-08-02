import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

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
            <label class="field">
              <span>Conteudo do prompt</span>
              <textarea class="prompt-editor" formControlName="content" spellcheck="false"></textarea>
              @if (isContentInvalid()) {
                <small>Informe o conteudo do prompt.</small>
              } @else {
                <small class="field-hint">O backend acrescenta o contexto dinamico e o formato JSON esperado.</small>
              }
            </label>

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
  protected readonly form = new FormGroup({
    content: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  protected prompt: AiPrompt | null = null;
  protected loading = false;
  protected saving = false;
  protected successMessage = '';
  protected errorMessage = '';

  constructor(private readonly aiPromptsApi: AiPromptsApiService) {
    this.loadPrompt();
  }

  protected get hasChanges(): boolean {
    return this.prompt?.content !== this.form.controls.content.value;
  }

  protected get canSave(): boolean {
    return !this.loading && !this.saving && this.form.valid && this.hasChanges;
  }

  protected loadPrompt(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.aiPromptsApi.getOrderInterpretation()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (prompt) => {
          this.prompt = prompt;
          this.form.setValue({ content: prompt.content });
          this.form.markAsPristine();
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
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

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.aiPromptsApi.updateOrderInterpretation({
      content: this.form.controls.content.value.trim()
    })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (prompt) => {
          this.prompt = prompt;
          this.form.setValue({ content: prompt.content });
          this.form.markAsPristine();
          this.successMessage = 'Prompt atualizado com sucesso.';
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
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
