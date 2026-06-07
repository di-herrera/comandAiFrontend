import { Component, effect } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { IngredientsApiService } from '@core/api/ingredients-api.service';
import { OptionsApiService } from '@core/api/options-api.service';
import { ProductCompositionApiService } from '@core/api/product-composition-api.service';
import { ProductsApiService } from '@core/api/products-api.service';
import { CatalogContextService } from '@core/context/catalog-context.service';
import { CatalogContextSelectorComponent } from '@shared/components/catalog-context-selector/catalog-context-selector.component';
import {
  IngredientListItem,
  ProductComposition,
  ProductCompositionUpdateRequest,
  ProductListItem,
  OptionGroup,
  ProductOptionListItem
} from '@shared/models/catalog.models';
import { ApiFailure } from '@shared/models/common.models';

interface IngredientSelection {
  ingredient: IngredientListItem;
  selected: boolean;
  isDefault: boolean;
  canBeRemoved: boolean;
}

interface OptionSelection {
  option: ProductOptionListItem;
  selected: boolean;
}

@Component({
  selector: 'app-product-composition',
  standalone: true,
  imports: [ReactiveFormsModule, CatalogContextSelectorComponent],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Composição do catálogo</p>
          <h1 class="page-title">Composição do produto</h1>
          <p class="page-description">Relacione produtos com ingredientes removíveis e opções aplicáveis.</p>
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
        <div class="form-grid">
          <label class="field">
            <span>Produto</span>
            <select [formControl]="productControl" [disabled]="!catalogContext.hasCatalogContext()">
              <option value="">Selecione um produto</option>
              @for (product of products; track product.id) {
                <option [value]="product.id">{{ product.code }} - {{ product.name }}</option>
              }
            </select>
          </label>

          <div class="context-panel">
            <strong>Produto ativo</strong>
            <span>{{ selectedProductName || 'nenhum selecionado' }}</span>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="section-heading">
          <div>
            <h2>Composição atual</h2>
            <p>Os itens marcados serão enviados para o produto selecionado.</p>
          </div>
          <div class="button-row">
            <button class="btn" type="button" (click)="loadComposition()" [disabled]="loading || !canUseProductContext">
              Atualizar
            </button>
            <button class="btn btn-primary" type="button" (click)="saveComposition()" [disabled]="saving || !canUseProductContext">
              {{ saving ? 'Salvando...' : 'Salvar composição' }}
            </button>
          </div>
        </div>

        @if (!canUseProductContext) {
          <p class="muted">Selecione empresa, unidade e produto para editar a composição.</p>
        } @else if (loading) {
          <p class="muted">Carregando composição...</p>
        } @else {
          <div class="split-grid">
            <div>
              <h3>Ingredientes aplicáveis</h3>
              @if (ingredientSelections.length === 0) {
                <p class="muted">Nenhum ingrediente cadastrado para esta unidade.</p>
              } @else {
                <table class="table">
                  <thead>
                    <tr>
                      <th>Usar</th>
                      <th>Ingrediente</th>
                      <th>Padrão</th>
                      <th>Removível</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of ingredientSelections; track item.ingredient.id) {
                      <tr>
                        <td>
                          <input type="checkbox" [checked]="item.selected" (change)="toggleIngredient(item, $event)" />
                        </td>
                        <td>{{ item.ingredient.code }} - {{ item.ingredient.name }}</td>
                        <td>
                          <input type="checkbox" [checked]="item.isDefault" [disabled]="!item.selected" (change)="toggleIngredientDefault(item, $event)" />
                        </td>
                        <td>
                          <input type="checkbox" [checked]="item.canBeRemoved" [disabled]="!item.selected" (change)="toggleIngredientRemovable(item, $event)" />
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>

            <div>
              <h3>Opções aplicáveis</h3>
              @if (optionSelections.length === 0) {
                <p class="muted">Nenhuma opção cadastrada para esta unidade.</p>
              } @else {
                <table class="table">
                  <thead>
                    <tr>
                      <th>Usar</th>
                      <th>Opção</th>
                      <th>Preço adicional</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of optionSelections; track item.option.id) {
                      <tr>
                        <td>
                          <input type="checkbox" [checked]="item.selected" (change)="toggleOption(item, $event)" />
                        </td>
                        <td>{{ item.option.code }} - {{ item.option.name }}</td>
                        <td>{{ formatCurrency(item.option.additionalPrice) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>
          </div>
        }
      </section>

      <section class="card">
        <div class="section-heading">
          <div>
            <h2>Grupos de escolha</h2>
            <p>Vincule grupos ja cadastrados ao produto. O cadastro do grupo fica em Grupos.</p>
          </div>
        </div>

        @if (!canUseProductContext) {
          <p class="muted">Selecione empresa, unidade e produto para configurar grupos.</p>
        } @else if (loading) {
          <p class="muted">Carregando grupos...</p>
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
            <p class="muted">Nenhum grupo especifico vinculado a este produto.</p>
          } @else {
            <table class="table">
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
                    <td>
                      <strong>{{ group.name }}</strong>
                      @if (group.isRequired) {
                        <span class="status-chip active">obrigatorio</span>
                      }
                      <span class="status-chip">{{ linkSourceLabel(group) }}</span>
                    </td>
                    <td>{{ group.minSelected }} a {{ group.maxSelected }}</td>
                    <td>
                      @for (option of group.options; track option.id) {
                        <span class="inline-chip">{{ option.code }} - {{ option.name }}</span>
                      }
                    </td>
                    <td>
                      <button class="btn btn-danger" type="button" (click)="deleteOptionGroup(group)" [disabled]="savingGroup">
                        Desvincular
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
          @if (categoryOptionGroups.length > 0) {
            <h3>Grupos herdados da categoria</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Grupo</th>
                  <th>Selecao</th>
                  <th>Opcoes</th>
                </tr>
              </thead>
              <tbody>
                @for (group of categoryOptionGroups; track group.id) {
                  <tr>
                    <td>
                      <strong>{{ group.name }}</strong>
                      @if (group.isRequired) {
                        <span class="status-chip active">obrigatorio</span>
                      }
                      <span class="status-chip">categoria</span>
                    </td>
                    <td>{{ group.minSelected }} a {{ group.maxSelected }}</td>
                    <td>
                      @for (option of group.options; track option.id) {
                        <span class="inline-chip">{{ option.code }} - {{ option.name }}</span>
                      }
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
export class ProductCompositionPage {
  protected readonly productControl = new FormControl('', { nonNullable: true });
  protected readonly existingGroupControl = new FormControl('', { nonNullable: true });

  protected products: ProductListItem[] = [];
  protected ingredientSelections: IngredientSelection[] = [];
  protected optionSelections: OptionSelection[] = [];
  protected availableOptions: ProductOptionListItem[] = [];
  protected optionGroups: OptionGroup[] = [];
  protected categoryOptionGroups: OptionGroup[] = [];
  protected reusableOptionGroups: OptionGroup[] = [];
  protected loading = false;
  protected saving = false;
  protected savingGroup = false;
  protected successMessage = '';
  protected errorMessage = '';

  constructor(
    protected readonly catalogContext: CatalogContextService,
    private readonly productsApi: ProductsApiService,
    private readonly ingredientsApi: IngredientsApiService,
    private readonly optionsApi: OptionsApiService,
    private readonly compositionApi: ProductCompositionApiService
  ) {
    effect(() => {
      this.catalogContext.selectedTenantId();
      this.catalogContext.selectedBusinessUnitId();
      this.productControl.setValue('');
      this.products = [];
      this.clearComposition();
      this.loadProducts();
    });
    this.productControl.valueChanges.subscribe(() => {
      this.clearComposition();
      this.loadComposition();
    });
  }

  protected get canUseProductContext(): boolean {
    return Boolean(this.catalogContext.hasCatalogContext() && this.productControl.value);
  }

  protected get selectedProductName(): string {
    const product = this.selectedProduct;
    return product ? `${product.code} - ${product.name}` : '';
  }

  protected get selectedProductCategoryName(): string {
    return this.selectedProduct?.categoryName ?? '';
  }

  protected get linkableOptionGroups(): OptionGroup[] {
    const linkedIds = new Set(
      this.optionGroups
        .map((group) => group.id)
    );
    return this.reusableOptionGroups.filter((group) => !linkedIds.has(group.id));
  }

  private get selectedProduct(): ProductListItem | undefined {
    return this.products.find((item) => item.id === this.productControl.value);
  }

  protected loadProducts(): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();
    if (!tenantId || !businessUnitId) {
      return;
    }

    this.productsApi.list(tenantId, businessUnitId).subscribe({
      next: (result) => {
        this.products = result.items;
      },
      error: (failure: ApiFailure) => {
        this.errorMessage = failure.error.message;
      }
    });
  }

  protected loadComposition(): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();
    const productId = this.productControl.value;
    const categoryId = this.selectedProduct?.categoryId;

    if (!tenantId || !businessUnitId || !productId || !categoryId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      composition: this.compositionApi.get(tenantId, businessUnitId, productId),
      ingredients: this.ingredientsApi.list(tenantId, businessUnitId),
      options: this.optionsApi.list(tenantId, businessUnitId),
      optionGroups: this.compositionApi.listOptionGroups(tenantId, businessUnitId, productId),
      categoryOptionGroups: this.compositionApi.listCategoryOptionGroups(tenantId, businessUnitId, categoryId),
      reusableOptionGroups: this.compositionApi.listReusableOptionGroups(tenantId, businessUnitId)
    }).pipe(finalize(() => (this.loading = false))).subscribe({
      next: ({ composition, ingredients, options, optionGroups, categoryOptionGroups, reusableOptionGroups }) => {
        this.mergeComposition(composition, ingredients.items, options.items);
        this.optionGroups = optionGroups.items.filter((group) => group.linkSource === 'Product' || group.linkSource === 'ProductAndCategory');
        this.categoryOptionGroups = categoryOptionGroups.items;
        this.reusableOptionGroups = reusableOptionGroups.items;
        this.existingGroupControl.setValue('');
      },
      error: (failure: ApiFailure) => {
        this.errorMessage = failure.error.message;
      }
    });
  }

  protected saveComposition(): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();
    const productId = this.productControl.value;

    if (!tenantId || !businessUnitId || !productId) {
      this.errorMessage = 'Selecione empresa, unidade e produto antes de salvar a composição.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.compositionApi.update(tenantId, businessUnitId, productId, this.buildRequest())
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.successMessage = 'Composição salva com sucesso.';
          this.loadComposition();
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
  }

  protected toggleIngredient(item: IngredientSelection, event: Event): void {
    item.selected = this.eventChecked(event);
    if (!item.selected) {
      item.isDefault = false;
      item.canBeRemoved = false;
    }
  }

  protected toggleIngredientDefault(item: IngredientSelection, event: Event): void {
    item.isDefault = this.eventChecked(event);
  }

  protected toggleIngredientRemovable(item: IngredientSelection, event: Event): void {
    item.canBeRemoved = this.eventChecked(event);
  }

  protected toggleOption(item: OptionSelection, event: Event): void {
    item.selected = this.eventChecked(event);
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  protected linkSourceLabel(group: OptionGroup): string {
    switch (group.linkSource) {
      case 'Category':
        return 'categoria';
      case 'Product':
        return 'produto';
      case 'ProductAndCategory':
        return 'produto + categoria';
      default:
        return 'cadastro';
    }
  }

  protected deleteOptionGroup(group: OptionGroup): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();
    const productId = this.productControl.value;

    if (!tenantId || !businessUnitId || !productId) {
      return;
    }

    if (group.linkSource !== 'Product' && group.linkSource !== 'ProductAndCategory') {
      return;
    }

    if (!window.confirm(`Desvincular o grupo "${group.name}" deste produto?`)) {
      return;
    }

    this.savingGroup = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.compositionApi.deleteOptionGroup(tenantId, businessUnitId, productId, group.id)
      .pipe(finalize(() => (this.savingGroup = false)))
      .subscribe({
        next: () => {
          this.successMessage = 'Grupo desvinculado do produto.';
          this.loadComposition();
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
  }

  protected linkExistingOptionGroup(): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();
    const productId = this.productControl.value;
    const optionGroupId = this.existingGroupControl.value;

    if (!tenantId || !businessUnitId || !productId || !optionGroupId) {
      return;
    }

    this.savingGroup = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.compositionApi.linkOptionGroup(tenantId, businessUnitId, productId, optionGroupId)
      .pipe(finalize(() => (this.savingGroup = false)))
      .subscribe({
        next: () => {
          this.successMessage = 'Grupo vinculado ao produto.';
          this.loadComposition();
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
  }

  private clearComposition(): void {
    this.ingredientSelections = [];
    this.optionSelections = [];
    this.availableOptions = [];
    this.optionGroups = [];
    this.categoryOptionGroups = [];
    this.reusableOptionGroups = [];
    this.existingGroupControl.setValue('');
    this.successMessage = '';
    this.errorMessage = '';
  }

  private mergeComposition(
    composition: ProductComposition,
    ingredients: IngredientListItem[],
    options: ProductOptionListItem[]
  ): void {
    const linkedIngredients = new Map(composition.ingredients.map((item) => [item.ingredientId, item]));
    const linkedOptions = new Set(composition.options.map((item) => item.optionId));

    this.ingredientSelections = ingredients.map((ingredient) => {
      const linked = linkedIngredients.get(ingredient.id);
      return {
        ingredient,
        selected: Boolean(linked),
        isDefault: linked?.isDefault ?? false,
        canBeRemoved: linked?.canBeRemoved ?? false
      };
    });

    this.optionSelections = options.map((option) => ({
      option,
      selected: linkedOptions.has(option.id)
    }));
    this.availableOptions = options;
  }

  private buildRequest(): ProductCompositionUpdateRequest {
    return {
      ingredients: this.ingredientSelections
        .filter((item) => item.selected)
        .map((item) => ({
          ingredientId: item.ingredient.id,
          isDefault: item.isDefault,
          canBeRemoved: item.canBeRemoved
        })),
      optionIds: this.optionSelections
        .filter((item) => item.selected)
        .map((item) => item.option.id)
    };
  }

  private eventChecked(event: Event): boolean {
    return event.target instanceof HTMLInputElement ? event.target.checked : false;
  }
}
