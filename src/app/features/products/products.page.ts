import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { BusinessUnitsApiService } from '@core/api/business-units-api.service';
import { ProductsApiService } from '@core/api/products-api.service';
import { TenantsApiService } from '@core/api/tenants-api.service';
import {
  BusinessUnitListItem,
  ProductCreateRequest,
  ProductListItem,
  TenantListItem
} from '@shared/models/catalog.models';
import { ApiFailure, EntityStatus } from '@shared/models/common.models';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Catálogo por unidade</p>
          <h1 class="page-title">Produtos</h1>
          <p class="page-description">Cadastre produtos com códigos persistidos, preços e disponibilidade.</p>
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
        <h2>{{ editingProductId ? 'Editar produto' : 'Novo produto' }}</h2>

        <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Código</span>
            <input type="text" formControlName="code" placeholder="P001" />
            @if (isInvalid('code')) {
              <small>Informe o código persistido do produto.</small>
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
            <span>Preço base</span>
            <input type="number" min="0" step="0.01" formControlName="price" />
            @if (isInvalid('price')) {
              <small>Informe um preço maior ou igual a zero.</small>
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
            <span>Descrição</span>
            <textarea rows="3" formControlName="description"></textarea>
          </label>

          <label class="check-field">
            <input type="checkbox" formControlName="isAvailable" />
            <span>Disponível para venda</span>
          </label>

          <div class="button-row form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="saving || !canUseCatalogContext">
              {{ saving ? 'Salvando...' : editingProductId ? 'Salvar edição' : 'Cadastrar produto' }}
            </button>
            @if (editingProductId) {
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
            <h2>Produtos cadastrados</h2>
            <p>Filtro ativo: {{ selectedTenantName || 'empresa não selecionada' }} / {{ selectedBusinessUnitName || 'unidade não selecionada' }}.</p>
          </div>
          <button class="btn" type="button" (click)="loadProducts()" [disabled]="loading || !canUseCatalogContext">
            Atualizar
          </button>
        </div>

        @if (!canUseCatalogContext) {
          <p class="muted">Selecione empresa e unidade para listar produtos.</p>
        } @else if (loading) {
          <p class="muted">Carregando produtos...</p>
        } @else if (products.length === 0) {
          <p class="muted">Nenhum produto cadastrado para este contexto.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Produto</th>
                <th>Preço</th>
                <th>Disponível</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              @for (product of products; track product.id) {
                <tr>
                  <td>{{ product.code }}</td>
                  <td>{{ product.name }}</td>
                  <td>{{ formatCurrency(product.price) }}</td>
                  <td>{{ product.isAvailable ? 'Sim' : 'Não' }}</td>
                  <td><span class="status-pill">{{ statusLabel(product.status) }}</span></td>
                  <td>
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
  protected readonly tenantControl = new FormControl('', { nonNullable: true });
  protected readonly businessUnitControl = new FormControl('', { nonNullable: true });
  protected readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(32)] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(160)] }),
    description: new FormControl<string | null>(null, { validators: [Validators.maxLength(500)] }),
    price: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    isAvailable: new FormControl(true, { nonNullable: true }),
    status: new FormControl<EntityStatus>('Active', { nonNullable: true, validators: [Validators.required] })
  });

  protected tenants: TenantListItem[] = [];
  protected businessUnits: BusinessUnitListItem[] = [];
  protected products: ProductListItem[] = [];
  protected editingProductId: string | null = null;
  protected loading = false;
  protected saving = false;
  protected successMessage = '';
  protected errorMessage = '';

  constructor(
    private readonly tenantsApi: TenantsApiService,
    private readonly businessUnitsApi: BusinessUnitsApiService,
    private readonly productsApi: ProductsApiService
  ) {
    this.loadTenants();
    this.tenantControl.valueChanges.subscribe(() => {
      this.businessUnitControl.setValue('');
      this.businessUnits = [];
      this.products = [];
      this.cancelEdit();
      this.loadBusinessUnits();
    });
    this.businessUnitControl.valueChanges.subscribe(() => {
      this.cancelEdit();
      this.loadProducts();
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

  protected loadProducts(): void {
    const tenantId = this.tenantControl.value;
    const businessUnitId = this.businessUnitControl.value;
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

  protected submit(): void {
    const tenantId = this.tenantControl.value;
    const businessUnitId = this.businessUnitControl.value;
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

  protected startEdit(product: ProductListItem): void {
    this.editingProductId = product.id;
    this.form.setValue({
      code: product.code,
      name: product.name,
      description: product.description ?? null,
      price: product.price,
      isAvailable: product.isAvailable,
      status: product.status
    });
    this.successMessage = '';
    this.errorMessage = '';
  }

  protected cancelEdit(): void {
    this.editingProductId = null;
    this.form.reset({
      code: '',
      name: '',
      description: null,
      price: 0,
      isAvailable: true,
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

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  private buildRequest(): ProductCreateRequest {
    const value = this.form.getRawValue();
    const description = value.description?.trim();

    return {
      code: value.code.trim(),
      name: value.name.trim(),
      description: description ? description : null,
      price: Number(value.price),
      isAvailable: value.isAvailable,
      status: value.status
    };
  }
}
