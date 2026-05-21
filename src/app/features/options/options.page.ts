import { Component, effect } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { OptionsApiService } from '@core/api/options-api.service';
import { CatalogContextService } from '@core/context/catalog-context.service';
import { CatalogContextSelectorComponent } from '@shared/components/catalog-context-selector/catalog-context-selector.component';
import {
  ProductOptionCreateRequest,
  ProductOptionListItem
} from '@shared/models/catalog.models';
import { ApiFailure, EntityStatus } from '@shared/models/common.models';

@Component({
  selector: 'app-options',
  standalone: true,
  imports: [ReactiveFormsModule, CatalogContextSelectorComponent],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Catálogo por unidade</p>
          <h1 class="page-title">Opções e adicionais</h1>
          <p class="page-description">Cadastre adicionais globais da unidade e associe aos produtos na composição.</p>
        </div>
      </header>

      @if (successMessage) {
        <p class="feedback success">{{ successMessage }}</p>
      }

      @if (errorMessage) {
        <p class="feedback error">{{ errorMessage }}</p>
      }

      <app-catalog-context-selector />

      <section class="card">
        <h2>{{ editingOptionId ? 'Editar opção' : 'Nova opção' }}</h2>

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
            @if (editingOptionId) {
              <button class="btn" type="button" (click)="cancelEdit()" [disabled]="saving">
                Cancelar edição
              </button>
            }
          </div>
        </form>
      </section>

      <section class="card">
        <div class="section-heading">
          <div>
            <h2>Opções cadastradas</h2>
            <p>Filtro ativo: {{ catalogContext.selectedTenantName() || 'empresa não selecionada' }} / {{ catalogContext.selectedBusinessUnitName() || 'unidade não selecionada' }}.</p>
          </div>
          <button class="btn" type="button" (click)="loadOptions()" [disabled]="loading || !canUseCatalogContext">
            Atualizar
          </button>
        </div>

        @if (!canUseCatalogContext) {
          <p class="muted">Selecione empresa e unidade para listar opções.</p>
        } @else if (loading) {
          <p class="muted">Carregando opções...</p>
        } @else if (options.length === 0) {
          <p class="muted">Nenhuma opção cadastrada para este contexto.</p>
        } @else {
          <table class="table">
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
              @for (option of options; track option.id) {
                <tr>
                  <td>{{ option.code }}</td>
                  <td>{{ option.name }}</td>
                  <td>{{ formatCurrency(option.additionalPrice) }}</td>
                  <td>{{ option.isAvailable ? 'Sim' : 'Não' }}</td>
                  <td><span class="status-pill">{{ statusLabel(option.status) }}</span></td>
                  <td>
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

  protected options: ProductOptionListItem[] = [];
  protected editingOptionId: string | null = null;
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

  protected startEdit(option: ProductOptionListItem): void {
    this.editingOptionId = option.id;
    this.form.setValue({
      code: option.code,
      name: option.name,
      additionalPrice: option.additionalPrice,
      status: option.status
    });
    this.successMessage = '';
    this.errorMessage = '';
  }

  protected cancelEdit(): void {
    this.editingOptionId = null;
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
