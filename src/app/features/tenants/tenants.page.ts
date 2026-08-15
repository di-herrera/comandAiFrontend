import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { TenantsApiService } from '@core/api/tenants-api.service';
import { AuthSessionService } from '@core/auth/auth-session.service';
import { PagedListState } from '@shared/state/paged-list.state';
import { TenantCreateRequest, TenantListItem } from '@shared/models/catalog.models';
import { ApiFailure, EntityStatus } from '@shared/models/common.models';

@Component({
  selector: 'app-tenants',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Cadastro operacional</p>
          <h1 class="page-title">Empresas</h1>
          <p class="page-description">Cadastre e mantenha as empresas atendidas pela ComandIA.</p>
        </div>
        <div class="crud-toolbar">
          @if (authSession.isSystemAdmin()) {
            <button class="btn btn-primary" type="button" (click)="openCreate()">
              Nova empresa
            </button>
          }
          <button class="btn" type="button" (click)="loadTenants()" [disabled]="loading">
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

      @if (isEditorOpen && (authSession.isSystemAdmin() || editingTenantId)) {
      <div class="editor-backdrop">
        <section class="editor-panel">
          <div class="editor-header">
            <div>
              <h2>{{ editingTenantId ? 'Editar empresa' : 'Nova empresa' }}</h2>
              <p>{{ editingTenantId ? 'Atualize os dados da empresa selecionada.' : 'Cadastre uma nova empresa para operar no painel.' }}</p>
            </div>
            <button class="btn editor-close" type="button" (click)="cancelEdit()" [disabled]="saving" title="Fechar">X</button>
          </div>

          <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Razão social</span>
            <input type="text" formControlName="name" autocomplete="organization" />
            @if (isInvalid('name')) {
              <small>Informe a razão social.</small>
            }
          </label>

          <label class="field">
            <span>Nome comercial</span>
            <input type="text" formControlName="tradeName" autocomplete="organization-title" />
            @if (isInvalid('tradeName')) {
              <small>Informe o nome comercial.</small>
            }
          </label>

          <label class="field">
            <span>Documento</span>
            <input type="text" formControlName="document" placeholder="00.000.000/0001-00" />
          </label>

          <label class="field">
            <span>Status</span>
            <select formControlName="status">
              <option value="Active">Ativa</option>
              <option value="Inactive">Inativa</option>
            </select>
          </label>

          <div class="button-row form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="saving">
              {{ saving ? 'Salvando...' : editingTenantId ? 'Salvar edição' : 'Cadastrar empresa' }}
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
            <h2>Empresas cadastradas</h2>
            <p>{{ tenants.length }} empresa(s) retornada(s) pela API.</p>
          </div>
          <label class="field list-search">
            <span>Buscar</span>
            <input type="search" [formControl]="searchControl" placeholder="Empresa ou documento" />
          </label>
        </div>

        @if (loading) {
          <p class="muted">Carregando empresas...</p>
        } @else if (tenants.length === 0) {
          <p class="muted">Nenhuma empresa cadastrada ainda.</p>
        } @else if (filteredTenants.length === 0) {
          <p class="muted">Nenhuma empresa encontrada para a busca.</p>
        } @else {
          <table class="table responsive-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Nome comercial</th>
                <th>Documento</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              @for (tenant of filteredTenants; track tenant.id) {
                <tr>
                  <td data-label="Empresa">{{ tenant.name }}</td>
                  <td data-label="Nome comercial">{{ tenant.tradeName }}</td>
                  <td data-label="Documento">{{ tenant.document || '-' }}</td>
                  <td data-label="Status"><span class="status-pill">{{ statusLabel(tenant.status) }}</span></td>
                  <td data-label="Ação">
                    <button class="btn btn-small" type="button" (click)="startEdit(tenant)">
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
export class TenantsPage {
  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(160)] }),
    tradeName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    document: new FormControl<string | null>(null, { validators: [Validators.maxLength(32)] }),
    status: new FormControl<EntityStatus>('Active', { nonNullable: true, validators: [Validators.required] })
  });
  protected readonly searchControl = new FormControl('', { nonNullable: true });

  private readonly tenantsList = new PagedListState<TenantListItem>();
  private readonly successMessageState = signal('');
  private readonly errorMessageState = signal('');

  protected get tenants(): TenantListItem[] { return this.tenantsList.items(); }
  protected set tenants(value: TenantListItem[]) { this.tenantsList.items.set(value); }
  protected editingTenantId: string | null = null;
  protected isEditorOpen = false;
  protected get loading(): boolean { return this.tenantsList.loading(); }
  protected set loading(value: boolean) { this.tenantsList.loading.set(value); }
  protected saving = false;
  protected get successMessage(): string { return this.successMessageState(); }
  protected set successMessage(value: string) { this.successMessageState.set(value); }
  protected get errorMessage(): string { return this.errorMessageState(); }
  protected set errorMessage(value: string) { this.errorMessageState.set(value); }

  constructor(
    private readonly tenantsApi: TenantsApiService,
    protected readonly authSession: AuthSessionService
  ) {
    this.loadTenants();
  }

  protected loadTenants(): void {
    this.errorMessage = '';
    this.tenantsList.load(this.tenantsApi.list(), {
      errorMessage: 'Nao foi possivel carregar as empresas. Tente atualizar a tela.',
      onError: (message) => this.errorMessage = message,
      mapItems: (items) => this.filterTenantsByScope(items)
      });
  }

  protected submit(): void {
    if (!this.editingTenantId && !this.authSession.isSystemAdmin()) {
      this.errorMessage = 'Seu usuario nao tem permissao para cadastrar empresas.';
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
    const save = this.editingTenantId
      ? this.tenantsApi.update(this.editingTenantId, request)
      : this.tenantsApi.create(request);

    save.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.successMessage = this.editingTenantId ? 'Empresa atualizada com sucesso.' : 'Empresa cadastrada com sucesso.';
        this.cancelEdit();
        this.loadTenants();
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

  protected get filteredTenants(): TenantListItem[] {
    const term = this.searchControl.value.trim().toLowerCase();
    if (!term) {
      return this.tenants;
    }

    return this.tenants.filter((tenant) =>
      tenant.name.toLowerCase().includes(term) ||
      tenant.tradeName.toLowerCase().includes(term) ||
      (tenant.document ?? '').toLowerCase().includes(term));
  }

  protected startEdit(tenant: TenantListItem): void {
    if (!this.canEditTenant(tenant)) {
      this.errorMessage = 'Seu usuario nao tem permissao para editar esta empresa.';
      return;
    }

    this.editingTenantId = tenant.id;
    this.form.setValue({
      name: tenant.name,
      tradeName: tenant.tradeName,
      document: tenant.document ?? null,
      status: tenant.status
    });
    this.isEditorOpen = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  protected cancelEdit(): void {
    this.editingTenantId = null;
    this.isEditorOpen = false;
    this.form.reset({
      name: '',
      tradeName: '',
      document: null,
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

  private buildRequest(): TenantCreateRequest {
    const value = this.form.getRawValue();
    const document = value.document?.trim();

    return {
      name: value.name.trim(),
      tradeName: value.tradeName.trim(),
      document: document ? document : null,
      status: value.status
    };
  }

  private filterTenantsByScope(tenants: TenantListItem[]): TenantListItem[] {
    const scopedTenantId = this.authSession.user()?.tenantId;
    return scopedTenantId ? tenants.filter((tenant) => tenant.id === scopedTenantId) : tenants;
  }

  private canEditTenant(tenant: TenantListItem): boolean {
    return this.authSession.isSystemAdmin() || this.authSession.user()?.tenantId === tenant.id;
  }

}
