import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { BusinessUnitsApiService } from '@core/api/business-units-api.service';
import { IngredientsApiService } from '@core/api/ingredients-api.service';
import { TenantsApiService } from '@core/api/tenants-api.service';
import {
  BusinessUnitListItem,
  IngredientCreateRequest,
  IngredientListItem,
  TenantListItem
} from '@shared/models/catalog.models';
import { ApiFailure, EntityStatus } from '@shared/models/common.models';

@Component({
  selector: 'app-ingredients',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Catálogo por unidade</p>
          <h1 class="page-title">Ingredientes</h1>
          <p class="page-description">Cadastre ingredientes que podem compor produtos e serem removidos.</p>
        </div>
      </header>

      @if (successMessage) {
        <p class="feedback success">{{ successMessage }}</p>
      }

      @if (errorMessage) {
        <p class="feedback error">{{ errorMessage }}</p>
      }

      <section class="card">
        <div class="form-grid">
          <label class="field">
            <span>Empresa</span>
            <select [formControl]="tenantControl">
              <option value="">Selecione uma empresa</option>
              @for (tenant of tenants; track tenant.id) {
                <option [value]="tenant.id">{{ tenant.tradeName || tenant.name }}</option>
              }
            </select>
          </label>

          <label class="field">
            <span>Unidade</span>
            <select [formControl]="businessUnitControl">
              <option value="">Selecione uma unidade</option>
              @for (unit of businessUnits; track unit.id) {
                <option [value]="unit.id">{{ unit.name }}</option>
              }
            </select>
          </label>

          <div class="context-panel">
            <strong>Filtro ativo</strong>
            <span>Empresa: {{ selectedTenantName || 'nenhuma selecionada' }}</span>
            <span>Unidade: {{ selectedBusinessUnitName || 'nenhuma selecionada' }}</span>
          </div>
        </div>
      </section>

      <section class="card">
        <h2>{{ editingIngredientId ? 'Editar ingrediente' : 'Novo ingrediente' }}</h2>

        <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Código</span>
            <input type="text" formControlName="code" placeholder="I001" />
            @if (isInvalid('code')) {
              <small>Informe o código persistido do ingrediente.</small>
            }
          </label>

          <label class="field">
            <span>Nome</span>
            <input type="text" formControlName="name" />
            @if (isInvalid('name')) {
              <small>Informe o nome do ingrediente.</small>
            }
          </label>

          <label class="field">
            <span>Status</span>
            <select formControlName="status">
              <option value="Active">Ativo</option>
              <option value="Inactive">Inativo</option>
            </select>
          </label>

          <div class="button-row form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="saving || !canUseCatalogContext">
              {{ saving ? 'Salvando...' : editingIngredientId ? 'Salvar edição' : 'Cadastrar ingrediente' }}
            </button>
            @if (editingIngredientId) {
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
            <h2>Ingredientes cadastrados</h2>
            <p>Filtro ativo: {{ selectedTenantName || 'empresa não selecionada' }} / {{ selectedBusinessUnitName || 'unidade não selecionada' }}.</p>
          </div>
          <button class="btn" type="button" (click)="loadIngredients()" [disabled]="loading || !canUseCatalogContext">
            Atualizar
          </button>
        </div>

        @if (!canUseCatalogContext) {
          <p class="muted">Selecione empresa e unidade para listar ingredientes.</p>
        } @else if (loading) {
          <p class="muted">Carregando ingredientes...</p>
        } @else if (ingredients.length === 0) {
          <p class="muted">Nenhum ingrediente cadastrado para este contexto.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Ingrediente</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              @for (ingredient of ingredients; track ingredient.id) {
                <tr>
                  <td>{{ ingredient.code }}</td>
                  <td>{{ ingredient.name }}</td>
                  <td><span class="status-pill">{{ statusLabel(ingredient.status) }}</span></td>
                  <td>
                    <button class="btn btn-small" type="button" (click)="startEdit(ingredient)">
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
export class IngredientsPage {
  protected readonly tenantControl = new FormControl('', { nonNullable: true });
  protected readonly businessUnitControl = new FormControl('', { nonNullable: true });
  protected readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(32)] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(160)] }),
    status: new FormControl<EntityStatus>('Active', { nonNullable: true, validators: [Validators.required] })
  });

  protected tenants: TenantListItem[] = [];
  protected businessUnits: BusinessUnitListItem[] = [];
  protected ingredients: IngredientListItem[] = [];
  protected editingIngredientId: string | null = null;
  protected loading = false;
  protected saving = false;
  protected successMessage = '';
  protected errorMessage = '';

  constructor(
    private readonly tenantsApi: TenantsApiService,
    private readonly businessUnitsApi: BusinessUnitsApiService,
    private readonly ingredientsApi: IngredientsApiService
  ) {
    this.loadTenants();
    this.tenantControl.valueChanges.subscribe(() => {
      this.businessUnitControl.setValue('');
      this.businessUnits = [];
      this.ingredients = [];
      this.cancelEdit();
      this.loadBusinessUnits();
    });
    this.businessUnitControl.valueChanges.subscribe(() => {
      this.cancelEdit();
      this.loadIngredients();
    });
  }

  protected get canUseCatalogContext(): boolean {
    return Boolean(this.tenantControl.value && this.businessUnitControl.value);
  }

  protected get selectedTenantName(): string {
    const tenant = this.tenants.find((item) => item.id === this.tenantControl.value);
    return tenant?.tradeName || tenant?.name || '';
  }

  protected get selectedBusinessUnitName(): string {
    return this.businessUnits.find((item) => item.id === this.businessUnitControl.value)?.name ?? '';
  }

  protected loadTenants(): void {
    this.tenantsApi.list().subscribe({
      next: (result) => {
        this.tenants = result.items;
      },
      error: (failure: ApiFailure) => {
        this.errorMessage = failure.error.message;
      }
    });
  }

  protected loadBusinessUnits(): void {
    const tenantId = this.tenantControl.value;
    if (!tenantId) {
      return;
    }

    this.businessUnitsApi.list(tenantId).subscribe({
      next: (result) => {
        this.businessUnits = result.items;
      },
      error: (failure: ApiFailure) => {
        this.errorMessage = failure.error.message;
      }
    });
  }

  protected loadIngredients(): void {
    const tenantId = this.tenantControl.value;
    const businessUnitId = this.businessUnitControl.value;
    this.ingredients = [];

    if (!tenantId || !businessUnitId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.ingredientsApi.list(tenantId, businessUnitId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          this.ingredients = result.items;
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
  }

  protected submit(): void {
    const tenantId = this.tenantControl.value;
    const businessUnitId = this.businessUnitControl.value;
    if (!tenantId || !businessUnitId) {
      this.errorMessage = 'Selecione empresa e unidade antes de salvar o ingrediente.';
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
    const save = this.editingIngredientId
      ? this.ingredientsApi.update(tenantId, businessUnitId, this.editingIngredientId, request)
      : this.ingredientsApi.create(tenantId, businessUnitId, request);

    save.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.successMessage = this.editingIngredientId ? 'Ingrediente atualizado com sucesso.' : 'Ingrediente cadastrado com sucesso.';
        this.cancelEdit();
        this.loadIngredients();
      },
      error: (failure: ApiFailure) => {
        this.errorMessage = failure.error.message;
      }
    });
  }

  protected startEdit(ingredient: IngredientListItem): void {
    this.editingIngredientId = ingredient.id;
    this.form.setValue({
      code: ingredient.code,
      name: ingredient.name,
      status: ingredient.status
    });
    this.successMessage = '';
    this.errorMessage = '';
  }

  protected cancelEdit(): void {
    this.editingIngredientId = null;
    this.form.reset({
      code: '',
      name: '',
      status: 'Active'
    });
  }

  protected isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  protected statusLabel(status: EntityStatus): string {
    return status === 'Active' ? 'Ativo' : 'Inativo';
  }

  private buildRequest(): IngredientCreateRequest {
    const value = this.form.getRawValue();

    return {
      code: value.code.trim(),
      name: value.name.trim(),
      status: value.status
    };
  }
}
