import { Component, effect } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  ProductOptionGroup,
  ProductOptionGroupOptionRequest,
  ProductOptionGroupRequest,
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

type OptionGroupOptionForm = FormGroup<{
  code: FormControl<string>;
  name: FormControl<string>;
  additionalPrice: FormControl<number>;
  isAvailable: FormControl<boolean>;
  displayOrder: FormControl<number>;
}>;

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
            <p>Configure perguntas como tamanho, tipo de pao, tipo de hamburguer e adicionais.</p>
          </div>
          <button class="btn" type="button" (click)="resetOptionGroupForm()" [disabled]="!canUseProductContext">
            Novo grupo
          </button>
        </div>

        @if (!canUseProductContext) {
          <p class="muted">Selecione empresa, unidade e produto para configurar grupos.</p>
        } @else if (loading) {
          <p class="muted">Carregando grupos...</p>
        } @else {
          <div class="split-grid">
            <div>
              <h3>Grupos configurados</h3>
              @if (optionGroups.length === 0) {
                <p class="muted">Nenhum grupo configurado para este produto.</p>
              } @else {
                <table class="table">
                  <thead>
                    <tr>
                      <th>Grupo</th>
                      <th>Selecao</th>
                      <th>Opcoes</th>
                      <th>Acoes</th>
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
                        </td>
                        <td>{{ group.minSelected }} a {{ group.maxSelected }}</td>
                        <td>
                          @for (option of group.options; track option.id) {
                            <span class="inline-chip">{{ option.code }} - {{ option.name }}</span>
                          }
                        </td>
                        <td>
                          <div class="button-row compact">
                            <button class="btn" type="button" (click)="editOptionGroup(group)">Editar</button>
                            <button class="btn btn-danger" type="button" (click)="deleteOptionGroup(group)" [disabled]="savingGroup">
                              Remover
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>

            <form [formGroup]="optionGroupForm" (ngSubmit)="saveOptionGroup()" class="panel-form">
              <div class="section-heading compact-heading">
                <div>
                  <h3>{{ optionGroupForm.controls.id.value ? 'Editar grupo' : 'Novo grupo' }}</h3>
                  <p>O nome do grupo aparece na pergunta ao cliente.</p>
                </div>
              </div>

              <div class="form-grid">
                <label class="field">
                  <span>Nome do grupo</span>
                  <input type="text" formControlName="name" placeholder="Tipo de pao" />
                </label>

                <label class="field compact-field">
                  <span>Minimo</span>
                  <input type="number" min="0" formControlName="minSelected" />
                </label>

                <label class="field compact-field">
                  <span>Maximo</span>
                  <input type="number" min="0" formControlName="maxSelected" />
                </label>

                <label class="check-field">
                  <input type="checkbox" formControlName="isRequired" />
                  <span>Obrigatorio</span>
                </label>
              </div>

              <div class="section-heading compact-heading">
                <div>
                  <h3>Opcoes do grupo</h3>
                </div>
                <button class="btn" type="button" (click)="addOptionRow()">Adicionar opcao</button>
              </div>

              <div formArrayName="options" class="option-editor">
                @for (optionControl of optionRows.controls; track $index) {
                  <div class="option-row" [formGroup]="optionControl">
                    <label class="field">
                      <span>Codigo</span>
                      <input type="text" formControlName="code" placeholder="PAO-FR" />
                    </label>
                    <label class="field">
                      <span>Nome</span>
                      <input type="text" formControlName="name" placeholder="Pao frances" />
                    </label>
                    <label class="field compact-field">
                      <span>Preco</span>
                      <input type="number" min="0" step="0.01" formControlName="additionalPrice" />
                    </label>
                    <label class="field compact-field">
                      <span>Ordem</span>
                      <input type="number" min="0" formControlName="displayOrder" />
                    </label>
                    <label class="check-field">
                      <input type="checkbox" formControlName="isAvailable" />
                      <span>Disponivel</span>
                    </label>
                    <button class="btn btn-danger icon-button" type="button" (click)="removeOptionRow($index)" title="Remover opcao">
                      X
                    </button>
                  </div>
                }
              </div>

              <div class="button-row">
                <button class="btn btn-primary" type="submit" [disabled]="savingGroup || !canUseProductContext">
                  {{ savingGroup ? 'Salvando...' : 'Salvar grupo' }}
                </button>
                <button class="btn" type="button" (click)="resetOptionGroupForm()">
                  Limpar
                </button>
              </div>
            </form>
          </div>
        }
      </section>
    </section>
  `
})
export class ProductCompositionPage {
  protected readonly productControl = new FormControl('', { nonNullable: true });
  protected readonly optionGroupForm = new FormGroup({
    id: new FormControl<string | null>(null),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    minSelected: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
    maxSelected: new FormControl(1, { nonNullable: true, validators: [Validators.min(0)] }),
    isRequired: new FormControl(false, { nonNullable: true }),
    options: new FormArray<OptionGroupOptionForm>([])
  });

  protected products: ProductListItem[] = [];
  protected ingredientSelections: IngredientSelection[] = [];
  protected optionSelections: OptionSelection[] = [];
  protected optionGroups: ProductOptionGroup[] = [];
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
    const product = this.products.find((item) => item.id === this.productControl.value);
    return product ? `${product.code} - ${product.name}` : '';
  }

  protected get optionRows(): FormArray<OptionGroupOptionForm> {
    return this.optionGroupForm.controls.options;
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

    if (!tenantId || !businessUnitId || !productId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      composition: this.compositionApi.get(tenantId, businessUnitId, productId),
      ingredients: this.ingredientsApi.list(tenantId, businessUnitId),
      options: this.optionsApi.list(tenantId, businessUnitId),
      optionGroups: this.compositionApi.listOptionGroups(tenantId, businessUnitId, productId)
    }).pipe(finalize(() => (this.loading = false))).subscribe({
      next: ({ composition, ingredients, options, optionGroups }) => {
        this.mergeComposition(composition, ingredients.items, options.items);
        this.optionGroups = optionGroups.items;
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

  protected resetOptionGroupForm(): void {
    this.optionRows.clear();
    this.optionGroupForm.reset({
      id: null,
      name: '',
      minSelected: 0,
      maxSelected: 1,
      isRequired: false
    });
    this.addOptionRow();
  }

  protected addOptionRow(option?: ProductOptionGroupOptionRequest): void {
    this.optionRows.push(new FormGroup({
      code: new FormControl(option?.code ?? '', { nonNullable: true, validators: [Validators.required] }),
      name: new FormControl(option?.name ?? '', { nonNullable: true, validators: [Validators.required] }),
      additionalPrice: new FormControl(option?.additionalPrice ?? 0, { nonNullable: true, validators: [Validators.min(0)] }),
      isAvailable: new FormControl(option?.isAvailable ?? true, { nonNullable: true }),
      displayOrder: new FormControl(option?.displayOrder ?? this.optionRows.length + 1, { nonNullable: true, validators: [Validators.min(0)] })
    }));
  }

  protected removeOptionRow(index: number): void {
    this.optionRows.removeAt(index);
    if (this.optionRows.length === 0) {
      this.addOptionRow();
    }
  }

  protected editOptionGroup(group: ProductOptionGroup): void {
    this.optionRows.clear();
    this.optionGroupForm.reset({
      id: group.id,
      name: group.name,
      minSelected: group.minSelected,
      maxSelected: group.maxSelected,
      isRequired: group.isRequired
    });

    for (const option of group.options) {
      this.addOptionRow({
        code: option.code,
        name: option.name,
        additionalPrice: option.additionalPrice,
        isAvailable: option.isAvailable,
        displayOrder: option.displayOrder
      });
    }

    if (group.options.length === 0) {
      this.addOptionRow();
    }
  }

  protected saveOptionGroup(): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();
    const productId = this.productControl.value;

    if (!tenantId || !businessUnitId || !productId) {
      this.errorMessage = 'Selecione empresa, unidade e produto antes de salvar o grupo.';
      return;
    }

    if (this.optionGroupForm.invalid) {
      this.optionGroupForm.markAllAsTouched();
      this.errorMessage = 'Preencha nome do grupo, codigos, nomes e precos validos.';
      return;
    }

    const request = this.buildOptionGroupRequest();
    if (request.maxSelected < request.minSelected) {
      this.errorMessage = 'O maximo de escolhas nao pode ser menor que o minimo.';
      return;
    }

    if (request.isRequired && request.minSelected === 0) {
      this.errorMessage = 'Grupo obrigatorio deve exigir pelo menos uma escolha.';
      return;
    }

    const optionGroupId = this.optionGroupForm.controls.id.value;
    const operation = optionGroupId
      ? this.compositionApi.updateOptionGroup(tenantId, businessUnitId, productId, optionGroupId, request)
      : this.compositionApi.createOptionGroup(tenantId, businessUnitId, productId, request);

    this.savingGroup = true;
    this.errorMessage = '';
    this.successMessage = '';

    operation.pipe(finalize(() => (this.savingGroup = false))).subscribe({
      next: () => {
        this.successMessage = 'Grupo de escolha salvo com sucesso.';
        this.resetOptionGroupForm();
        this.loadComposition();
      },
      error: (failure: ApiFailure) => {
        this.errorMessage = failure.error.message;
      }
    });
  }

  protected deleteOptionGroup(group: ProductOptionGroup): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();
    const productId = this.productControl.value;

    if (!tenantId || !businessUnitId || !productId) {
      return;
    }

    if (!window.confirm(`Remover o grupo "${group.name}" deste produto?`)) {
      return;
    }

    this.savingGroup = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.compositionApi.deleteOptionGroup(tenantId, businessUnitId, productId, group.id)
      .pipe(finalize(() => (this.savingGroup = false)))
      .subscribe({
        next: () => {
          this.successMessage = 'Grupo de escolha removido.';
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
    this.optionGroups = [];
    this.resetOptionGroupForm();
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

  private buildOptionGroupRequest(): ProductOptionGroupRequest {
    return {
      name: this.optionGroupForm.controls.name.value.trim(),
      minSelected: this.optionGroupForm.controls.minSelected.value,
      maxSelected: this.optionGroupForm.controls.maxSelected.value,
      isRequired: this.optionGroupForm.controls.isRequired.value,
      options: this.optionRows.controls.map((control) => ({
        code: control.controls.code.value.trim(),
        name: control.controls.name.value.trim(),
        additionalPrice: control.controls.additionalPrice.value,
        isAvailable: control.controls.isAvailable.value,
        displayOrder: control.controls.displayOrder.value
      }))
    };
  }

  private eventChecked(event: Event): boolean {
    return event.target instanceof HTMLInputElement ? event.target.checked : false;
  }
}
