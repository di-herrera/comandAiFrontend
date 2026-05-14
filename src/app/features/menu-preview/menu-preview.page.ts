import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { BusinessUnitsApiService } from '@core/api/business-units-api.service';
import { ProductCompositionApiService } from '@core/api/product-composition-api.service';
import { ProductsApiService } from '@core/api/products-api.service';
import { TenantsApiService } from '@core/api/tenants-api.service';
import {
  BusinessUnitListItem,
  ProductComposition,
  ProductListItem,
  TenantListItem
} from '@shared/models/catalog.models';
import { ApiFailure } from '@shared/models/common.models';

interface MenuProduct {
  product: ProductListItem;
  composition: ProductComposition;
}

@Component({
  selector: 'app-menu-preview',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Cardapio operacional</p>
          <h1 class="page-title">Visualizacao do cardapio</h1>
          <p class="page-description">Confira como produtos, variantes, ingredientes e adicionais ficam organizados para atendimento.</p>
        </div>
      </header>

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
        <div class="section-heading">
          <div>
            <h2>Itens do cardapio</h2>
            <p>Produtos agrupados pela categoria retornada pela API.</p>
          </div>
          <button class="btn" type="button" (click)="loadMenu()" [disabled]="loading || !canUseCatalogContext">
            Atualizar
          </button>
        </div>

        @if (!canUseCatalogContext) {
          <p class="muted">Selecione empresa e unidade para visualizar o cardapio.</p>
        } @else if (loading) {
          <p class="muted">Carregando cardapio...</p>
        } @else if (menuProducts.length === 0) {
          <p class="muted">Nenhum produto cadastrado para este contexto.</p>
        } @else {
          <div class="menu-preview">
            @for (group of groupedMenu; track group.categoryName) {
              <section class="menu-category">
                <button
                  class="category-toggle"
                  type="button"
                  [attr.aria-expanded]="!isCategoryCollapsed(group.categoryName)"
                  (click)="toggleCategory(group.categoryName)">
                  <span>
                    <strong>{{ group.categoryName }}</strong>
                    <small>{{ group.items.length }} {{ group.items.length === 1 ? 'produto' : 'produtos' }}</small>
                  </span>
                  <span class="toggle-indicator">{{ isCategoryCollapsed(group.categoryName) ? '+' : '-' }}</span>
                </button>

                @if (!isCategoryCollapsed(group.categoryName)) {
                  <div class="menu-items">
                    @for (item of group.items; track item.product.id) {
                      <article class="menu-item">
                        <div class="menu-item-header">
                          <div>
                            <strong>{{ item.product.code }} - {{ item.product.name }}</strong>
                            @if (item.product.description) {
                              <p>{{ item.product.description }}</p>
                            }
                          </div>
                          <span class="status-pill">{{ item.product.isAvailable ? 'Disponivel' : 'Indisponivel' }}</span>
                        </div>

                        <dl class="result-grid">
                          <div>
                            <dt>Preco base</dt>
                            <dd>{{ formatCurrency(item.product.price) }}</dd>
                          </div>
                          <div>
                            <dt>Status</dt>
                            <dd>{{ item.product.status === 'Active' ? 'Ativo' : 'Inativo' }}</dd>
                          </div>
                        </dl>

                        <div class="menu-columns">
                          <div>
                            <h4>Variantes</h4>
                            @if (item.product.variants.length === 0) {
                              <p class="muted">Sem variantes cadastradas.</p>
                            } @else {
                              <ul class="compact-list">
                                @for (variant of item.product.variants; track variant.id) {
                                  <li>
                                    {{ variant.code }} - {{ variant.name }}:
                                    {{ formatCurrency(variant.price) }}
                                    @if (!variant.isAvailable) {
                                      <span class="muted">(indisponivel)</span>
                                    }
                                  </li>
                                }
                              </ul>
                            }
                          </div>

                          <div>
                            <h4>Ingredientes</h4>
                            @if (item.composition.ingredients.length === 0) {
                              <p class="muted">Sem ingredientes vinculados.</p>
                            } @else {
                              <ul class="compact-list">
                                @for (ingredient of item.composition.ingredients; track ingredient.ingredientId) {
                                  <li>
                                    {{ ingredient.ingredientCode }} - {{ ingredient.ingredientName }}
                                    @if (ingredient.canBeRemoved) {
                                      <span class="muted">(removivel)</span>
                                    }
                                  </li>
                                }
                              </ul>
                            }
                          </div>

                          <div>
                            <h4>Adicionais</h4>
                            @if (item.composition.options.length === 0) {
                              <p class="muted">Sem adicionais vinculados.</p>
                            } @else {
                              <ul class="compact-list">
                                @for (option of item.composition.options; track option.optionId) {
                                  <li>
                                    {{ option.optionCode }} - {{ option.optionName }}:
                                    {{ formatCurrency(option.additionalPrice) }}
                                    @if (!option.isAvailable) {
                                      <span class="muted">(indisponivel)</span>
                                    }
                                  </li>
                                }
                              </ul>
                            }
                          </div>
                        </div>
                      </article>
                    }
                  </div>
                }
              </section>
            }
          </div>
        }
      </section>
    </section>
  `
})
export class MenuPreviewPage {
  protected readonly tenantControl = new FormControl('', { nonNullable: true });
  protected readonly businessUnitControl = new FormControl('', { nonNullable: true });

  protected tenants: TenantListItem[] = [];
  protected businessUnits: BusinessUnitListItem[] = [];
  protected menuProducts: MenuProduct[] = [];
  protected collapsedCategories = new Set<string>();
  protected loading = false;
  protected errorMessage = '';

  constructor(
    private readonly tenantsApi: TenantsApiService,
    private readonly businessUnitsApi: BusinessUnitsApiService,
    private readonly productsApi: ProductsApiService,
    private readonly compositionApi: ProductCompositionApiService
  ) {
    this.loadTenants();
    this.tenantControl.valueChanges.subscribe(() => {
      this.businessUnitControl.setValue('');
      this.businessUnits = [];
      this.menuProducts = [];
      this.loadBusinessUnits();
    });
    this.businessUnitControl.valueChanges.subscribe(() => {
      this.loadMenu();
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

  protected get groupedMenu(): { categoryName: string; items: MenuProduct[] }[] {
    const groups = new Map<string, MenuProduct[]>();
    for (const item of this.menuProducts) {
      const categoryName = item.product.categoryName || 'Geral';
      groups.set(categoryName, [...(groups.get(categoryName) ?? []), item]);
    }

    return Array.from(groups.entries())
      .map(([categoryName, items]) => ({ categoryName, items }))
      .sort((left, right) => left.categoryName.localeCompare(right.categoryName, 'pt-BR'));
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

  protected loadMenu(): void {
    const tenantId = this.tenantControl.value;
    const businessUnitId = this.businessUnitControl.value;
    this.menuProducts = [];
    this.collapsedCategories.clear();

    if (!tenantId || !businessUnitId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.productsApi.list(tenantId, businessUnitId).subscribe({
      next: (result) => {
        this.loadCompositions(tenantId, businessUnitId, result.items);
      },
      error: (failure: ApiFailure) => {
        this.loading = false;
        this.errorMessage = failure.error.message;
      }
    });
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  protected isCategoryCollapsed(categoryName: string): boolean {
    return this.collapsedCategories.has(this.categoryKey(categoryName));
  }

  protected toggleCategory(categoryName: string): void {
    const key = this.categoryKey(categoryName);
    if (this.collapsedCategories.has(key)) {
      this.collapsedCategories.delete(key);
      return;
    }

    this.collapsedCategories.add(key);
  }

  private loadCompositions(tenantId: string, businessUnitId: string, products: ProductListItem[]): void {
    if (products.length === 0) {
      this.loading = false;
      return;
    }

    forkJoin(products.map((product) => this.compositionApi.get(tenantId, businessUnitId, product.id)))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (compositions) => {
          this.menuProducts = products.map((product, index) => ({
            product,
            composition: compositions[index]
          }));
          this.collapsedCategories.clear();
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
  }

  private categoryKey(categoryName: string): string {
    return categoryName.trim().toLocaleLowerCase('pt-BR');
  }
}
