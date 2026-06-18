import { Component, effect } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { OptionsApiService } from '@core/api/options-api.service';
import { CatalogContextService } from '@core/context/catalog-context.service';
import {
  ProductOptionCreateRequest,
  ProductOptionListItem
} from '@shared/models/catalog.models';
import { ApiFailure, EntityStatus } from '@shared/models/common.models';

@Component({
  selector: 'app-options',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Catálogo por unidade</p>
          <h1 class="page-title">Opções e adicionais</h1>
          <p class="page-description">Cadastre adicionais globais da unidade e associe aos produtos na composição.</p>
        </div>
        <div class="crud-toolbar">
          <button class="btn btn-primary" type="button" (click)="openCreate()" [disabled]="!canUseCatalogContext">
            Nova opção
          </button>
          <button class="btn" type="button" (click)="loadOptions()" [disabled]="loading || !canUseCatalogContext">
            Atualizar
          </button>
        </div>
      </header>

      @if (successMessage) {
        <p class="feedback success">{{ successMessage }}</p>
      }

      @if (errorMessage) {
        <p class="feedback error">{{ errorMessage }}</p>
      }

      @if (isEditorOpen) {
      <div class="editor-backdrop">
        <section class="editor-panel">
          <div class="editor-header">
            <div>
              <h2>{{ editingOptionId ? 'Editar opção' : 'Nova opção' }}</h2>
              <p>{{ catalogContext.selectedTenantName() || 'empresa não selecionada' }} / {{ catalogContext.selectedBusinessUnitName() || 'unidade não selecionada' }}</p>
            </div>
            <button class="btn editor-close" type="button" (click)="cancelEdit()" [disabled]="saving" title="Fechar">X</button>
          </div>

          <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Código</span>
            <input type="text" formControlName="code" placeholder="O001" />
            @if (isInvalid('code')) {
              <small>Informe o código persistido da opção.</small>
            }
          </label>

          <label class="field">
            <span>Nome</span>
            <input type="text" formControlName="name" />
            @if (isInvalid('name')) {
              <small>Informe o nome da opção.</small>
            }
          </label>

          <label class="field">
            <span>Preço adicional</span>
            <input type="number" min="0" step="0.01" formControlName="additionalPrice" />
            @if (isInvalid('additionalPrice')) {
              <small>Informe um preço maior ou igual a zero.</small>
            }
          </label>

          <label class="field">
            <span>Status</span>
            <select formControlName="status">
              <option value="Active">Ativa</option>
              <option value="Inactive">Inativa</option>
            </select>
          </label>

          <div class="button-row form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="saving || !canUseCatalogContext">
              {{ saving ? 'Salvando...' : editingOptionId ? 'Salvar edição' : 'Cadastrar opção' }}
            </button>
            <button class="btn" type="button" (click)="cancelEdit()" [disabled]="saving">
              Cancelar
            </button>
          </div>
        </form>
        </section>
      </div>
      }

      <section class="card">
        <div class="section-heading">
          <div>
            <h2>Opções cadastradas</h2>
          </div>
          <label class="field list-search">
            <span>Buscar</span>
            <input type="search" [formControl]="searchControl" placeholder="Codigo ou nome" />
          </label>
        </div>

        @if (!canUseCatalogContext) {
          <p class="muted">Selecione empresa e unidade para listar opções.</p>
        } @else if (loading) {
          <p class="muted">Carregando opções...</p>
        } @else if (options.length === 0) {
          <p class="muted">Nenhuma opção cadastrada para este contexto.</p>
        } @else if (filteredOptions.length === 0) {
          <p class="muted">Nenhuma opção encontrada para a busca.</p>
        } @else {
          <table class="table responsive-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Opção</th>
                <th>Preço adicional</th>
                <th>Disponível</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              @for (option of filteredOptions; track option.id) {
                <tr>
                  <td data-label="Código">{{ option.code }}</td>
                  <td data-label="Opção">{{ option.name }}</td>
                  <td data-label="Preço adicional">{{ formatCurrency(option.additionalPrice) }}</td>
                  <td data-label="Disponível">{{ option.isAvailable ? 'Sim' : 'Não' }}</td>
                  <td data-label="Status"><span class="status-pill">{{ statusLabel(option.status) }}</span></td>
                  <td data-label="Ação">
                    <button class="btn btn-small" type="button" (click)="startEdit(option)">
                      Editar
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </section>
  `
})
export class OptionsPage {
  protected readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(32)] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(160)] }),
    additionalPrice: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    status: new FormControl<EntityStatus>('Active', { nonNullable: true, validators: [Validators.required] })
  });
  protected readonly searchControl = new FormControl('', { nonNullable: true });

  protected options: ProductOptionListItem[] = [];
  protected editingOptionId: string | null = null;
  protected isEditorOpen = false;
  protected loading = false;
  protected saving = false;
  protected successMessage = '';
  protected errorMessage = '';

  constructor(
    protected readonly catalogContext: CatalogContextService,
    private readonly optionsApi: OptionsApiService
  ) {
    effect(() => {
      this.catalogContext.selectedTenantId();
      this.catalogContext.selectedBusinessUnitId();
      this.cancelEdit();
      this.loadOptions();
    });
  }

  protected get canUseCatalogContext(): boolean {
    return this.catalogContext.hasCatalogContext();
  }

  protected get filteredOptions(): ProductOptionListItem[] {
    const term = this.searchControl.value.trim().toLowerCase();
    if (!term) {
      return this.options;
    }

    return this.options.filter((option) =>
      option.code.toLowerCase().includes(term) ||
      option.name.toLowerCase().includes(term));
  }

  protected loadOptions(): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();
    this.options = [];

    if (!tenantId || !businessUnitId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.optionsApi.list(tenantId, businessUnitId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          this.options = result.items;
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
  }

  protected submit(): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();
    if (!tenantId || !businessUnitId) {
      this.errorMessage = 'Selecione empresa e unidade antes de salvar a opção.';
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request = this.buildRequest();
    const save = this.editingOptionId
      ? this.optionsApi.update(tenantId, businessUnitId, this.editingOptionId, request)
      : this.optionsApi.create(tenantId, businessUnitId, request);

    save.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.successMessage = this.editingOptionId ? 'Opção atualizada com sucesso.' : 'Opção cadastrada com sucesso.';
        this.cancelEdit();
        this.loadOptions();
      },
      error: (failure: ApiFailure) => {
        this.errorMessage = failure.error.message;
      }
    });
  }

  protected openCreate(): void {
    this.cancelEdit();
    this.isEditorOpen = true;
  }

  protected startEdit(option: ProductOptionListItem): void {
    this.editingOptionId = option.id;
    this.form.setValue({
      code: option.code,
      name: option.name,
      additionalPrice: option.additionalPrice,
      status: option.status
    });
    this.isEditorOpen = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  protected cancelEdit(): void {
    this.editingOptionId = null;
    this.isEditorOpen = false;
    this.form.reset({
      code: '',
      name: '',
      additionalPrice: 0,
      status: 'Active'
    });
  }

  protected isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  protected statusLabel(status: EntityStatus): string {
    return status === 'Active' ? 'Ativa' : 'Inativa';
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  private buildRequest(): ProductOptionCreateRequest {
    const value = this.form.getRawValue();

    return {
      code: value.code.trim(),
      name: value.name.trim(),
      additionalPrice: Number(value.additionalPrice),
      status: value.status
    };
  }
}


