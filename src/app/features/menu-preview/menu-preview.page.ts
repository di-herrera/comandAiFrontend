import { Component, effect } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';

import { ProductCompositionApiService } from '@core/api/product-composition-api.service';
import { CompositionGroupsApiService } from '@core/api/composition-groups-api.service';
import { ProductsApiService } from '@core/api/products-api.service';
import { CatalogContextService } from '@core/context/catalog-context.service';
import {
  ProductComposition,
  ProductListItem,
  CompositionGroup
} from '@shared/models/catalog.models';
import { ApiFailure } from '@shared/models/common.models';

interface MenuProduct {
  product: ProductListItem;
  composition: ProductComposition;
}

@Component({
  selector: 'app-menu-preview',
  standalone: true,
  imports: [],
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
          @if (compositionGroups.length > 0) {
            <div class="compact-detail-list"><strong>Itens compostos</strong>
              @for (group of compositionGroups; track group.id) { <span>{{ group.name }}: @for (rule of group.variantRules; track rule.variantId) { {{ rule.variantName }} ({{ rule.minParts }}-{{ rule.maxParts }} partes) } </span> }
            </div>
          }
          <div class="menu-preview">
            @for (group of groupedMenu; track group.categoryName) {
              <section class="menu-category">
                <h3>{{ group.categoryName }}</h3>

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
                                  {{ variant.code }} - {{ variant.name }} neste produto:
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
              </section>
            }
          </div>
        }
      </section>
    </section>
  `
})
export class MenuPreviewPage {
  protected menuProducts: MenuProduct[] = [];
  protected loading = false;
  protected errorMessage = '';
  protected compositionGroups: CompositionGroup[] = [];

  constructor(
    protected readonly catalogContext: CatalogContextService,
    private readonly productsApi: ProductsApiService,
    private readonly compositionApi: ProductCompositionApiService,
    private readonly compositionGroupsApi: CompositionGroupsApiService
  ) {
    effect(() => {
      this.catalogContext.selectedTenantId();
      this.catalogContext.selectedBusinessUnitId();
      this.loadMenu();
    });
  }

  protected get canUseCatalogContext(): boolean {
    return this.catalogContext.hasCatalogContext();
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

  protected loadMenu(): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();
    this.menuProducts = [];
    this.compositionGroups = [];

    if (!tenantId || !businessUnitId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    forkJoin({ products: this.productsApi.list(tenantId, businessUnitId), groups: this.compositionGroupsApi.list(tenantId, businessUnitId) }).subscribe({
      next: (result) => {
        this.compositionGroups = result.groups.items;
        this.loadCompositions(tenantId, businessUnitId, result.products.items);
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
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
  }
}


