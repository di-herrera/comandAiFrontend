import { Component, effect } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { ProductCategoriesApiService } from '@core/api/product-categories-api.service';
import { CatalogContextService } from '@core/context/catalog-context.service';
import {
  OptionGroup,
  ProductCategoryCreateRequest,
  ProductCategoryListItem
} from '@shared/models/catalog.models';
import { ApiFailure, EntityStatus } from '@shared/models/common.models';

@Component({
  selector: 'app-product-categories',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Catalogo por unidade</p>
          <h1 class="page-title">Categorias</h1>
          <p class="page-description">Cadastre categorias e vincule grupos ja cadastrados aos produtos da categoria.</p>
        </div>
        <div class="crud-toolbar">
          <button class="btn btn-primary" type="button" (click)="openCreate()" [disabled]="!canUseCatalogContext">
            Nova categoria
          </button>
          <button class="btn" type="button" (click)="loadCategories()" [disabled]="loading || !canUseCatalogContext">
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
              <h2>{{ editingCategoryId ? 'Editar categoria' : 'Nova categoria' }}</h2>
              <p>{{ catalogContext.selectedTenantName() || 'empresa nao selecionada' }} / {{ catalogContext.selectedBusinessUnitName() || 'unidade nao selecionada' }}</p>
            </div>
            <button class="btn editor-close" type="button" (click)="cancelEdit()" [disabled]="saving" title="Fechar">X</button>
          </div>

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
            <h2>Categorias cadastradas</h2>
          </div>
          <label class="field list-search">
            <span>Buscar</span>
            <input type="search" [formControl]="searchControl" placeholder="Categoria ou descricao" />
          </label>
        </div>

        @if (!canUseCatalogContext) {
          <p class="muted">Selecione empresa e unidade para listar categorias.</p>
        } @else if (loading) {
          <p class="muted">Carregando categorias...</p>
        } @else if (categories.length === 0) {
          <p class="muted">Nenhuma categoria cadastrada para este contexto.</p>
        } @else if (filteredCategories.length === 0) {
          <p class="muted">Nenhuma categoria encontrada para a busca.</p>
        } @else {
          <table class="table responsive-table">
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
              @for (category of filteredCategories; track category.id) {
                <tr>
                  <td data-label="Ordem">{{ category.displayOrder }}</td>
                  <td data-label="Categoria">{{ category.name }}</td>
                  <td data-label="Descricao">{{ category.description || '-' }}</td>
                  <td data-label="Status"><span class="status-pill">{{ statusLabel(category.status) }}</span></td>
                  <td data-label="Acao">
                    <div class="button-row compact">
                      <button class="btn btn-small" type="button" (click)="startEdit(category)">
                        Editar
                      </button>
                      <button class="btn btn-small" type="button" (click)="selectCategoryForGroups(category)">
                        Vinculos
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>

      <section class="card">
        <div class="section-heading">
          <div>
            <h2>Grupos vinculados a categoria</h2>
            <p>{{ selectedCategory ? selectedCategory.name : 'Selecione uma categoria para gerenciar vinculos.' }}</p>
          </div>
        </div>

        @if (!canUseCategoryGroupContext) {
          <p class="muted">Selecione uma categoria cadastrada para vincular grupos.</p>
        } @else if (loadingGroups) {
          <p class="muted">Carregando grupos da categoria...</p>
        } @else {
          <div class="link-panel">
            <label class="field">
              <span>Grupo cadastrado</span>
              <select [formControl]="existingGroupControl" [disabled]="linkableOptionGroups.length === 0 || savingGroup">
                <option value="">Selecione um grupo</option>
                @for (group of linkableOptionGroups; track group.id) {
                  <option [value]="group.id">{{ group.name }}</option>
                }
              </select>
            </label>
            <button class="btn" type="button" (click)="linkExistingOptionGroup()" [disabled]="!existingGroupControl.value || savingGroup">
              Vincular
            </button>
          </div>

          @if (optionGroups.length === 0) {
            <p class="muted">Nenhum grupo vinculado a esta categoria.</p>
          } @else {
            <table class="table responsive-table">
              <thead>
                <tr>
                  <th>Grupo</th>
                  <th>Selecao</th>
                  <th>Opcoes</th>
                  <th>Acao</th>
                </tr>
              </thead>
              <tbody>
                @for (group of optionGroups; track group.id) {
                  <tr>
                    <td data-label="Grupo">
                      <strong>{{ group.name }}</strong>
                      @if (group.isRequired) {
                        <span class="status-chip active">obrigatorio</span>
                      }
                    </td>
                    <td data-label="Selecao">{{ group.minSelected }} a {{ group.maxSelected }}</td>
                    <td data-label="Opcoes">
                      @for (option of group.options; track option.id) {
                        <span class="inline-chip">{{ option.code }} - {{ option.name }}</span>
                      }
                    </td>
                    <td data-label="Acao">
                      <button class="btn btn-danger" type="button" (click)="deleteOptionGroup(group)" [disabled]="savingGroup">
                        Desvincular
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
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
  protected readonly existingGroupControl = new FormControl('', { nonNullable: true });
  protected readonly searchControl = new FormControl('', { nonNullable: true });

  protected categories: ProductCategoryListItem[] = [];
  protected optionGroups: OptionGroup[] = [];
  protected reusableOptionGroups: OptionGroup[] = [];
  protected selectedCategoryId = '';
  protected editingCategoryId: string | null = null;
  protected isEditorOpen = false;
  protected loading = false;
  protected loadingGroups = false;
  protected saving = false;
  protected savingGroup = false;
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
      this.clearGroupContext();
      this.loadCategories();
    });
  }

  protected get canUseCatalogContext(): boolean {
    return this.catalogContext.hasCatalogContext();
  }

  protected get canUseCategoryGroupContext(): boolean {
    return Boolean(this.canUseCatalogContext && this.selectedCategoryId);
  }

  protected get selectedCategory(): ProductCategoryListItem | undefined {
    return this.categories.find((category) => category.id === this.selectedCategoryId);
  }

  protected get filteredCategories(): ProductCategoryListItem[] {
    const term = this.searchControl.value.trim().toLowerCase();
    if (!term) {
      return this.categories;
    }

    return this.categories.filter((category) =>
      category.name.toLowerCase().includes(term) ||
      (category.description ?? '').toLowerCase().includes(term));
  }

  protected get linkableOptionGroups(): OptionGroup[] {
    const linkedIds = new Set(this.optionGroups.map((group) => group.id));
    return this.reusableOptionGroups.filter((group) => !linkedIds.has(group.id));
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
          if (this.selectedCategoryId && !this.selectedCategory) {
            this.clearGroupContext();
          }
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
      next: (category) => {
        this.successMessage = this.editingCategoryId ? 'Categoria atualizada com sucesso.' : 'Categoria cadastrada com sucesso.';
        this.selectedCategoryId = category.id;
        this.cancelEdit();
        this.loadCategories();
        this.loadCategoryGroups();
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

  protected startEdit(category: ProductCategoryListItem): void {
    this.editingCategoryId = category.id;
    this.form.setValue({
      name: category.name,
      description: category.description ?? null,
      displayOrder: category.displayOrder,
      status: category.status
    });
    this.isEditorOpen = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  protected cancelEdit(): void {
    this.editingCategoryId = null;
    this.isEditorOpen = false;
    this.form.reset({
      name: '',
      description: null,
      displayOrder: 0,
      status: 'Active'
    });
  }

  protected selectCategoryForGroups(category: ProductCategoryListItem): void {
    this.selectedCategoryId = category.id;
    this.loadCategoryGroups();
  }

  protected loadCategoryGroups(): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();
    const categoryId = this.selectedCategoryId;

    if (!tenantId || !businessUnitId || !categoryId) {
      return;
    }

    this.loadingGroups = true;
    this.errorMessage = '';

    forkJoin({
      linkedGroups: this.productCategoriesApi.listOptionGroups(tenantId, businessUnitId, categoryId),
      reusableGroups: this.productCategoriesApi.listReusableOptionGroups(tenantId, businessUnitId)
    }).pipe(finalize(() => (this.loadingGroups = false))).subscribe({
      next: ({ linkedGroups, reusableGroups }) => {
        this.optionGroups = linkedGroups.items;
        this.reusableOptionGroups = reusableGroups.items;
        this.existingGroupControl.setValue('');
      },
      error: (failure: ApiFailure) => {
        this.errorMessage = failure.error.message;
      }
    });
  }

  protected linkExistingOptionGroup(): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();
    const categoryId = this.selectedCategoryId;
    const optionGroupId = this.existingGroupControl.value;

    if (!tenantId || !businessUnitId || !categoryId || !optionGroupId) {
      return;
    }

    this.savingGroup = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.productCategoriesApi.linkOptionGroup(tenantId, businessUnitId, categoryId, optionGroupId)
      .pipe(finalize(() => (this.savingGroup = false)))
      .subscribe({
        next: () => {
          this.successMessage = 'Grupo vinculado a categoria.';
          this.loadCategoryGroups();
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
  }

  protected deleteOptionGroup(group: OptionGroup): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();
    const categoryId = this.selectedCategoryId;

    if (!tenantId || !businessUnitId || !categoryId) {
      return;
    }

    if (!window.confirm(`Desvincular o grupo "${group.name}" desta categoria?`)) {
      return;
    }

    this.savingGroup = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.productCategoriesApi.deleteOptionGroup(tenantId, businessUnitId, categoryId, group.id)
      .pipe(finalize(() => (this.savingGroup = false)))
      .subscribe({
        next: () => {
          this.successMessage = 'Grupo desvinculado da categoria.';
          this.loadCategoryGroups();
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
  }

  protected isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  protected statusLabel(status: EntityStatus): string {
    return status === 'Active' ? 'Ativa' : 'Inativa';
  }

  private clearGroupContext(): void {
    this.selectedCategoryId = '';
    this.optionGroups = [];
    this.reusableOptionGroups = [];
    this.existingGroupControl.setValue('');
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


