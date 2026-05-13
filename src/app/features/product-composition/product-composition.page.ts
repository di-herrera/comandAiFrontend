import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { BusinessUnitsApiService } from '@core/api/business-units-api.service';
import { IngredientsApiService } from '@core/api/ingredients-api.service';
import { OptionsApiService } from '@core/api/options-api.service';
import { ProductCompositionApiService } from '@core/api/product-composition-api.service';
import { ProductsApiService } from '@core/api/products-api.service';
import { TenantsApiService } from '@core/api/tenants-api.service';
import {
  BusinessUnitListItem,
  IngredientListItem,
  ProductComposition,
  ProductCompositionUpdateRequest,
  ProductListItem,
  ProductOptionListItem,
  TenantListItem
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
  imports: [ReactiveFormsModule],
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

          <label class="field">
            <span>Produto</span>
            <select [formControl]="productControl">
              <option value="">Selecione um produto</option>
              @for (product of products; track product.id) {
                <option [value]="product.id">{{ product.code }} - {{ product.name }}</option>
              }
            </select>
          </label>

          <div class="context-panel">
            <strong>Filtro ativo</strong>
            <span>Empresa: {{ selectedTenantName || 'nenhuma selecionada' }}</span>
            <span>Unidade: {{ selectedBusinessUnitName || 'nenhuma selecionada' }}</span>
            <span>Produto: {{ selectedProductName || 'nenhum selecionado' }}</span>
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
    </section>
  `
})
export class ProductCompositionPage {
  protected readonly tenantControl = new FormControl('', { nonNullable: true });
  protected readonly businessUnitControl = new FormControl('', { nonNullable: true });
  protected readonly productControl = new FormControl('', { nonNullable: true });

  protected tenants: TenantListItem[] = [];
  protected businessUnits: BusinessUnitListItem[] = [];
  protected products: ProductListItem[] = [];
  protected ingredientSelections: IngredientSelection[] = [];
  protected optionSelections: OptionSelection[] = [];
  protected loading = false;
  protected saving = false;
  protected successMessage = '';
  protected errorMessage = '';

  constructor(
    private readonly tenantsApi: TenantsApiService,
    private readonly businessUnitsApi: BusinessUnitsApiService,
    private readonly productsApi: ProductsApiService,
    private readonly ingredientsApi: IngredientsApiService,
    private readonly optionsApi: OptionsApiService,
    private readonly compositionApi: ProductCompositionApiService
  ) {
    this.loadTenants();
    this.tenantControl.valueChanges.subscribe(() => {
      this.businessUnitControl.setValue('');
      this.productControl.setValue('');
      this.businessUnits = [];
      this.products = [];
      this.clearComposition();
      this.loadBusinessUnits();
    });
    this.businessUnitControl.valueChanges.subscribe(() => {
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
    return Boolean(this.tenantControl.value && this.businessUnitControl.value && this.productControl.value);
  }

  protected get selectedTenantName(): string {
    const tenant = this.tenants.find((item) => item.id === this.tenantControl.value);
    return tenant?.tradeName || tenant?.name || '';
  }

  protected get selectedBusinessUnitName(): string {
    return this.businessUnits.find((item) => item.id === this.businessUnitControl.value)?.name ?? '';
  }

  protected get selectedProductName(): string {
    const product = this.products.find((item) => item.id === this.productControl.value);
    return product ? `${product.code} - ${product.name}` : '';
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

  protected loadProducts(): void {
    const tenantId = this.tenantControl.value;
    const businessUnitId = this.businessUnitControl.value;
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
    const tenantId = this.tenantControl.value;
    const businessUnitId = this.businessUnitControl.value;
    const productId = this.productControl.value;

    if (!tenantId || !businessUnitId || !productId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      composition: this.compositionApi.get(tenantId, businessUnitId, productId),
      ingredients: this.ingredientsApi.list(tenantId, businessUnitId),
      options: this.optionsApi.list(tenantId, businessUnitId)
    }).pipe(finalize(() => (this.loading = false))).subscribe({
      next: ({ composition, ingredients, options }) => {
        this.mergeComposition(composition, ingredients.items, options.items);
      },
      error: (failure: ApiFailure) => {
        this.errorMessage = failure.error.message;
      }
    });
  }

  protected saveComposition(): void {
    const tenantId = this.tenantControl.value;
    const businessUnitId = this.businessUnitControl.value;
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

  private clearComposition(): void {
    this.ingredientSelections = [];
    this.optionSelections = [];
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
