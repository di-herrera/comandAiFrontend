import { Component, effect } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { ProductCategoriesApiService } from '@core/api/product-categories-api.service';
import { ProductsApiService } from '@core/api/products-api.service';
import { CatalogContextService } from '@core/context/catalog-context.service';
import {
  ProductCreateRequest,
  ProductCategoryListItem,
  ProductListItem,
  ProductVariantRequest
} from '@shared/models/catalog.models';
import { ApiFailure, EntityStatus } from '@shared/models/common.models';

type VariantForm = FormGroup<{
  code: FormControl<string>;
  name: FormControl<string>;
  price: FormControl<number>;
  isAvailable: FormControl<boolean>;
  displayOrder: FormControl<number>;
}>;

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Catalogo por unidade</p>
          <h1 class="page-title">Produtos</h1>
          <p class="page-description">Cadastre produtos e vincule variantes globais com preco por produto.</p>
        </div>
        <div class="crud-toolbar">
          <button class="btn btn-primary" type="button" (click)="openCreate()" [disabled]="!canUseCatalogContext">
            Novo produto
          </button>
          <button class="btn" type="button" (click)="loadProducts()" [disabled]="loading || !canUseCatalogContext">
            Atualizar
          </button>
        </div>
      </header>

      @if (successMessage) {
        <p class="feedback success">{{ successMessage }}</p>
      }

      @if (errorMessage) {
        <p class="feedback error">{{ errorMessage }}</p>
        <div class="toast-stack" aria-live="assertive">
          <p class="toast toast-error" role="alert">{{ errorMessage }}</p>
        </div>
      }

      @if (isEditorOpen) {
      <div class="editor-backdrop">
        <section class="editor-panel editor-panel-wide">
          <div class="editor-header">
            <div>
              <h2>{{ editingProductId ? 'Editar produto' : 'Novo produto' }}</h2>
              <p>{{ catalogContext.selectedTenantName() || 'empresa nao selecionada' }} / {{ catalogContext.selectedBusinessUnitName() || 'unidade nao selecionada' }}</p>
            </div>
            <button class="btn editor-close" type="button" (click)="cancelEdit()" [disabled]="saving" title="Fechar">X</button>
          </div>

          <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Codigo</span>
            <input type="text" formControlName="code" placeholder="P001" />
            @if (isInvalid('code')) {
              <small>Informe o codigo persistido do produto.</small>
            }
          </label>

          <label class="field">
            <span>Nome</span>
            <input type="text" formControlName="name" />
            @if (isInvalid('name')) {
              <small>Informe o nome do produto.</small>
            }
          </label>

          <label class="field">
            <span>Categoria</span>
            <select formControlName="categoryId">
              <option [ngValue]="null">Geral</option>
              @for (category of categories; track category.id) {
                <option [ngValue]="category.id">{{ category.name }}</option>
              }
            </select>
          </label>

          <label class="field">
            <span>Preco base</span>
            <input type="number" min="0" step="0.01" formControlName="price" />
            @if (isInvalid('price')) {
              <small>Informe um preco maior ou igual a zero.</small>
            }
          </label>

          <label class="field">
            <span>Status</span>
            <select formControlName="status">
              <option value="Active">Ativo</option>
              <option value="Inactive">Inativo</option>
            </select>
          </label>

          <label class="field field-wide">
            <span>Descricao</span>
            <textarea rows="3" formControlName="description"></textarea>
          </label>

          <label class="check-field">
            <input type="checkbox" formControlName="isAvailable" />
            <span>Disponivel para venda</span>
          </label>

          <section class="field-wide nested-section" formArrayName="variants">
            <div class="section-heading">
              <div>
                <h3>Variantes</h3>
                <p>Informe o codigo e nome da variante global; o preco e disponibilidade valem apenas para este produto.</p>
              </div>
              <button class="btn btn-small" type="button" (click)="addVariant()">Adicionar variante</button>
            </div>

            @if (variants.length === 0) {
              <p class="muted">Sem variantes informadas. A API criara ou reutilizara a variante global Unico automaticamente.</p>
            } @else {
              <div class="variant-grid">
                @for (variant of variants.controls; track $index; let index = $index) {
                  <div class="variant-card" [formGroupName]="index">
                    <label class="field">
                      <span>Codigo</span>
                      <input type="text" formControlName="code" placeholder="G" />
                    </label>
                    <label class="field">
                      <span>Nome</span>
                      <input type="text" formControlName="name" placeholder="Grande" />
                    </label>
                    <label class="field">
                      <span>Preco neste produto</span>
                      <input type="number" min="0" step="0.01" formControlName="price" />
                    </label>
                    <label class="field">
                      <span>Ordem</span>
                      <input type="number" min="1" step="1" formControlName="displayOrder" />
                    </label>
                    <label class="check-field">
                      <input type="checkbox" formControlName="isAvailable" />
                      <span>Disponivel</span>
                    </label>
                    <button class="btn btn-small" type="button" (click)="removeVariant(index)">Remover</button>
                  </div>
                }
              </div>
            }
          </section>

          <div class="button-row form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="saving || !canUseCatalogContext">
              {{ saving ? 'Salvando...' : editingProductId ? 'Salvar edicao' : 'Cadastrar produto' }}
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
            <h2>Produtos cadastrados</h2>
          </div>
          <label class="field list-search">
            <span>Buscar</span>
            <input type="search" [formControl]="searchControl" placeholder="Codigo, produto ou categoria" />
          </label>
        </div>

        @if (!canUseCatalogContext) {
          <p class="muted">Selecione empresa e unidade para listar produtos.</p>
        } @else if (loading) {
          <p class="muted">Carregando produtos...</p>
        } @else if (products.length === 0) {
          <p class="muted">Nenhum produto cadastrado para este contexto.</p>
        } @else if (filteredProducts.length === 0) {
          <p class="muted">Nenhum produto encontrado para a busca.</p>
        } @else {
          <table class="table responsive-table">
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Preco base</th>
                <th>Variantes do produto</th>
                <th>Disponivel</th>
                <th>Status</th>
                <th>Acao</th>
              </tr>
            </thead>
            <tbody>
              @for (product of filteredProducts; track product.id) {
                <tr>
                  <td data-label="Codigo">{{ product.code }}</td>
                  <td data-label="Produto">{{ product.name }}</td>
                  <td data-label="Categoria">{{ product.categoryName }}</td>
                  <td data-label="Preco base">{{ formatCurrency(product.price) }}</td>
                  <td data-label="Variantes">
                    @if (product.variants.length === 0) {
                      <span class="muted">Nenhuma</span>
                    } @else {
                      <div class="stacked-list">
                        @for (variant of product.variants; track variant.id) {
                          <span>{{ variant.code }} - {{ variant.name }} neste produto: {{ formatCurrency(variant.price) }}</span>
                        }
                      </div>
                    }
                  </td>
                  <td data-label="Disponivel">{{ product.isAvailable ? 'Sim' : 'Nao' }}</td>
                  <td data-label="Status"><span class="status-pill">{{ statusLabel(product.status) }}</span></td>
                  <td data-label="Acao">
                    <button class="btn btn-small" type="button" (click)="startEdit(product)">
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
export class ProductsPage {
  protected readonly form = new FormGroup({
    categoryId: new FormControl<string | null>(null),
    code: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(32)] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(160)] }),
    description: new FormControl<string | null>(null, { validators: [Validators.maxLength(500)] }),
    price: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    isAvailable: new FormControl(true, { nonNullable: true }),
    status: new FormControl<EntityStatus>('Active', { nonNullable: true, validators: [Validators.required] }),
    variants: new FormArray<VariantForm>([])
  });
  protected readonly searchControl = new FormControl('', { nonNullable: true });

  private readonly productsState = signal<ProductListItem[]>([]);
  private readonly categoriesState = signal<ProductCategoryListItem[]>([]);
  protected get products(): ProductListItem[] { return this.productsState(); }
  protected set products(value: ProductListItem[]) { this.productsState.set(value); }
  protected get categories(): ProductCategoryListItem[] { return this.categoriesState(); }
  protected set categories(value: ProductCategoryListItem[]) { this.categoriesState.set(value); }
  protected editingProductId: string | null = null;
  protected isEditorOpen = false;
  private readonly loadingState = signal(false);
  protected get loading(): boolean { return this.loadingState(); }
  protected set loading(value: boolean) { this.loadingState.set(value); }
  protected saving = false;
  protected successMessage = '';
  protected errorMessage = '';

  constructor(
    protected readonly catalogContext: CatalogContextService,
    private readonly productCategoriesApi: ProductCategoriesApiService,
    private readonly productsApi: ProductsApiService
  ) {
    effect(() => {
      this.catalogContext.selectedTenantId();
      this.catalogContext.selectedBusinessUnitId();
      this.cancelEdit();
      this.loadCategories();
      this.loadProducts();
    });
  }

  protected get variants(): FormArray<VariantForm> {
    return this.form.controls.variants;
  }

  protected get canUseCatalogContext(): boolean {
    return this.catalogContext.hasCatalogContext();
  }

  protected get filteredProducts(): ProductListItem[] {
    const term = this.searchControl.value.trim().toLowerCase();
    if (!term) {
      return this.products;
    }

    return this.products.filter((product) =>
      product.code.toLowerCase().includes(term) ||
      product.name.toLowerCase().includes(term) ||
      (product.categoryName ?? '').toLowerCase().includes(term));
  }

  protected loadProducts(): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();
    this.products = [];

    if (!tenantId || !businessUnitId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.productsApi.list(tenantId, businessUnitId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          this.products = result.items;
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
  }

  protected loadCategories(): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();
    this.categories = [];

    if (!tenantId || !businessUnitId) {
      return;
    }

    this.productCategoriesApi.list(tenantId, businessUnitId).subscribe({
      next: (result) => {
        this.categories = result.items.filter((category) => category.status === 'Active');
      },
      error: (failure: ApiFailure) => {
        this.errorMessage = failure.error.message;
      }
    });
  }

  protected addVariant(value?: ProductVariantRequest): void {
    this.variants.push(this.createVariantForm(value ?? {
      code: '',
      name: '',
      price: this.form.controls.price.value,
      isAvailable: this.form.controls.isAvailable.value,
      displayOrder: this.variants.length + 1
    }));
  }

  protected removeVariant(index: number): void {
    this.variants.removeAt(index);
    this.variants.controls.forEach((variant, variantIndex) => {
      variant.controls.displayOrder.setValue(variantIndex + 1);
    });
  }

  protected submit(): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();
    if (!tenantId || !businessUnitId) {
      this.errorMessage = 'Selecione empresa e unidade antes de salvar o produto.';
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
    const save = this.editingProductId
      ? this.productsApi.update(tenantId, businessUnitId, this.editingProductId, request)
      : this.productsApi.create(tenantId, businessUnitId, request);

    save.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.successMessage = this.editingProductId ? 'Produto atualizado com sucesso.' : 'Produto cadastrado com sucesso.';
        this.cancelEdit();
        this.loadProducts();
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

  protected startEdit(product: ProductListItem): void {
    this.editingProductId = product.id;
    this.variants.clear();
    product.variants.forEach((variant) => {
      this.addVariant({
        code: variant.code,
        name: variant.name,
        price: variant.price,
        isAvailable: variant.isAvailable,
        displayOrder: variant.displayOrder
      });
    });
    this.form.patchValue({
      categoryId: product.categoryId,
      code: product.code,
      name: product.name,
      description: product.description ?? null,
      price: product.price,
      isAvailable: product.isAvailable,
      status: product.status
    });
    this.isEditorOpen = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  protected cancelEdit(): void {
    this.editingProductId = null;
    this.isEditorOpen = false;
    this.variants.clear();
    this.form.reset({
      code: '',
      categoryId: null,
      name: '',
      description: null,
      price: 0,
      isAvailable: true,
      status: 'Active'
    });
  }

  protected isInvalid(controlName: Exclude<keyof typeof this.form.controls, 'variants'>): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  protected statusLabel(status: EntityStatus): string {
    return status === 'Active' ? 'Ativo' : 'Inativo';
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  private createVariantForm(value: ProductVariantRequest): VariantForm {
    return new FormGroup({
      code: new FormControl(value.code, { nonNullable: true, validators: [Validators.required, Validators.maxLength(32)] }),
      name: new FormControl(value.name, { nonNullable: true, validators: [Validators.required, Validators.maxLength(160)] }),
      price: new FormControl(value.price, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      isAvailable: new FormControl(value.isAvailable, { nonNullable: true }),
      displayOrder: new FormControl(value.displayOrder, { nonNullable: true, validators: [Validators.required, Validators.min(1)] })
    });
  }

  private buildRequest(): ProductCreateRequest {
    const value = this.form.getRawValue();
    const description = value.description?.trim();

    return {
      categoryId: value.categoryId,
      code: value.code.trim(),
      name: value.name.trim(),
      description: description ? description : null,
      price: Number(value.price),
      isAvailable: value.isAvailable,
      status: value.status,
      variants: value.variants.map((variant) => ({
        code: variant.code.trim(),
        name: variant.name.trim(),
        price: Number(variant.price),
        isAvailable: variant.isAvailable,
        displayOrder: Number(variant.displayOrder)
      }))
    };
  }
}


import { signal } from '@angular/core';
