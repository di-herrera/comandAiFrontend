import { Component, effect } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { ProductCategoriesApiService } from '@core/api/product-categories-api.service';
import { CatalogContextService } from '@core/context/catalog-context.service';
import { CatalogContextSelectorComponent } from '@shared/components/catalog-context-selector/catalog-context-selector.component';
import {
  ProductCategoryCreateRequest,
  ProductCategoryListItem
} from '@shared/models/catalog.models';
import { ApiFailure, EntityStatus } from '@shared/models/common.models';

@Component({
  selector: 'app-product-categories',
  standalone: true,
  imports: [ReactiveFormsModule, CatalogContextSelectorComponent],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Catalogo por unidade</p>
          <h1 class="page-title">Categorias</h1>
          <p class="page-description">Organize produtos em grupos do cardapio para cadastro, exibicao e interpretacao da IA.</p>
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
        <h2>{{ editingCategoryId ? 'Editar categoria' : 'Nova categoria' }}</h2>

        <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Nome</span>
            <input type="text" formControlName="name" placeholder="Hamburguer" />
            @if (isInvalid('name')) {
              <small>Informe o nome da categoria.</small>
            }
          </label>

          <label class="field">
            <span>Ordem</span>
            <input type="number" min="0" step="1" formControlName="displayOrder" />
            @if (isInvalid('displayOrder')) {
              <small>Informe a ordem de exibicao.</small>
            }
          </label>

          <label class="field">
            <span>Status</span>
            <select formControlName="status">
              <option value="Active">Ativa</option>
              <option value="Inactive">Inativa</option>
            </select>
          </label>

          <label class="field field-wide">
            <span>Descricao</span>
            <textarea rows="3" formControlName="description"></textarea>
          </label>

          <div class="button-row form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="saving || !canUseCatalogContext">
              {{ saving ? 'Salvando...' : editingCategoryId ? 'Salvar edicao' : 'Cadastrar categoria' }}
            </button>
            @if (editingCategoryId) {
              <button class="btn" type="button" (click)="cancelEdit()" [disabled]="saving">
                Cancelar edicao
              </button>
            }
          </div>
        </form>
      </section>

      <section class="card">
        <div class="section-heading">
          <div>
            <h2>Categorias cadastradas</h2>
            <p>Filtro ativo: {{ catalogContext.selectedTenantName() || 'empresa nao selecionada' }} / {{ catalogContext.selectedBusinessUnitName() || 'unidade nao selecionada' }}.</p>
          </div>
          <button class="btn" type="button" (click)="loadCategories()" [disabled]="loading || !canUseCatalogContext">
            Atualizar
          </button>
        </div>

        @if (!canUseCatalogContext) {
          <p class="muted">Selecione empresa e unidade para listar categorias.</p>
        } @else if (loading) {
          <p class="muted">Carregando categorias...</p>
        } @else if (categories.length === 0) {
          <p class="muted">Nenhuma categoria cadastrada para este contexto.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Ordem</th>
                <th>Categoria</th>
                <th>Descricao</th>
                <th>Status</th>
                <th>Acao</th>
              </tr>
            </thead>
            <tbody>
              @for (category of categories; track category.id) {
                <tr>
                  <td>{{ category.displayOrder }}</td>
                  <td>{{ category.name }}</td>
                  <td>{{ category.description || '-' }}</td>
                  <td><span class="status-pill">{{ statusLabel(category.status) }}</span></td>
                  <td>
                    <button class="btn btn-small" type="button" (click)="startEdit(category)">
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
export class ProductCategoriesPage {
  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(160)] }),
    description: new FormControl<string | null>(null, { validators: [Validators.maxLength(500)] }),
    displayOrder: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    status: new FormControl<EntityStatus>('Active', { nonNullable: true, validators: [Validators.required] })
  });

  protected categories: ProductCategoryListItem[] = [];
  protected editingCategoryId: string | null = null;
  protected loading = false;
  protected saving = false;
  protected successMessage = '';
  protected errorMessage = '';

  constructor(
    protected readonly catalogContext: CatalogContextService,
    private readonly productCategoriesApi: ProductCategoriesApiService
  ) {
    effect(() => {
      this.catalogContext.selectedTenantId();
      this.catalogContext.selectedBusinessUnitId();
      this.cancelEdit();
      this.loadCategories();
    });
  }

  protected get canUseCatalogContext(): boolean {
    return this.catalogContext.hasCatalogContext();
  }

  protected loadCategories(): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();
    this.categories = [];

    if (!tenantId || !businessUnitId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.productCategoriesApi.list(tenantId, businessUnitId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          this.categories = result.items;
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
      this.errorMessage = 'Selecione empresa e unidade antes de salvar a categoria.';
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
    const save = this.editingCategoryId
      ? this.productCategoriesApi.update(tenantId, businessUnitId, this.editingCategoryId, request)
      : this.productCategoriesApi.create(tenantId, businessUnitId, request);

    save.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.successMessage = this.editingCategoryId ? 'Categoria atualizada com sucesso.' : 'Categoria cadastrada com sucesso.';
        this.cancelEdit();
        this.loadCategories();
      },
      error: (failure: ApiFailure) => {
        this.errorMessage = failure.error.message;
      }
    });
  }

  protected startEdit(category: ProductCategoryListItem): void {
    this.editingCategoryId = category.id;
    this.form.setValue({
      name: category.name,
      description: category.description ?? null,
      displayOrder: category.displayOrder,
      status: category.status
    });
    this.successMessage = '';
    this.errorMessage = '';
  }

  protected cancelEdit(): void {
    this.editingCategoryId = null;
    this.form.reset({
      name: '',
      description: null,
      displayOrder: 0,
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

  private buildRequest(): ProductCategoryCreateRequest {
    const value = this.form.getRawValue();
    const description = value.description?.trim();

    return {
      name: value.name.trim(),
      description: description ? description : null,
      displayOrder: Number(value.displayOrder),
      status: value.status
    };
  }
}
