import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { TenantsApiService } from '@core/api/tenants-api.service';
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
          <p class="page-description">Cadastre e mantenha as empresas atendidas pela ComandAI.</p>
        </div>
        <button class="btn" type="button" (click)="loadTenants()" [disabled]="loading">
          Atualizar
        </button>
      </header>

      @if (successMessage) {
        <p class="feedback success">{{ successMessage }}</p>
      }

      @if (errorMessage) {
        <p class="feedback error">{{ errorMessage }}</p>
      }

      <section class="card">
        <h2>{{ editingTenantId ? 'Editar empresa' : 'Nova empresa' }}</h2>

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
            @if (editingTenantId) {
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
            <h2>Empresas cadastradas</h2>
            <p>{{ tenants.length }} empresa(s) retornada(s) pela API.</p>
          </div>
        </div>

        @if (loading) {
          <p class="muted">Carregando empresas...</p>
        } @else if (tenants.length === 0) {
          <p class="muted">Nenhuma empresa cadastrada ainda.</p>
        } @else {
          <table class="table">
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
              @for (tenant of tenants; track tenant.id) {
                <tr>
                  <td>{{ tenant.name }}</td>
                  <td>{{ tenant.tradeName }}</td>
                  <td>{{ tenant.document || '-' }}</td>
                  <td><span class="status-pill">{{ statusLabel(tenant.status) }}</span></td>
                  <td>
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

  protected tenants: TenantListItem[] = [];
  protected editingTenantId: string | null = null;
  protected loading = false;
  protected saving = false;
  protected successMessage = '';
  protected errorMessage = '';

  constructor(private readonly tenantsApi: TenantsApiService) {
    this.loadTenants();
  }

  protected loadTenants(): void {
    this.loading = true;
    this.errorMessage = '';

    this.tenantsApi.list()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          this.tenants = result.items;
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
  }

  protected submit(): void {
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

  protected startEdit(tenant: TenantListItem): void {
    this.editingTenantId = tenant.id;
    this.form.setValue({
      name: tenant.name,
      tradeName: tenant.tradeName,
      document: tenant.document ?? null,
      status: tenant.status
    });
    this.successMessage = '';
    this.errorMessage = '';
  }

  protected cancelEdit(): void {
    this.editingTenantId = null;
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
}
