import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminUsersApiService } from '@core/api/admin-users-api.service';
import { BusinessUnitsApiService } from '@core/api/business-units-api.service';
import { TenantsApiService } from '@core/api/tenants-api.service';
import { AuthSessionService } from '@core/auth/auth-session.service';
import {
  AdminRole,
  AdminUser,
  CreateAdminUserRequest,
  UpdateAdminUserRequest
} from '@shared/models/auth.models';
import { BusinessUnitListItem, TenantListItem } from '@shared/models/catalog.models';
import { ApiFailure } from '@shared/models/common.models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Administracao</p>
          <h1 class="page-title">Usuarios</h1>
          <p class="page-description">Mantenha os acessos administrativos internos.</p>
        </div>
        <button class="btn" type="button" (click)="loadUsers()" [disabled]="loading">Atualizar</button>
      </header>

      @if (successMessage) {
        <p class="feedback success">{{ successMessage }}</p>
      }

      @if (errorMessage) {
        <p class="feedback error">{{ errorMessage }}</p>
      }

      <section class="card">
        <h2>{{ editingUserId ? 'Editar usuario' : 'Novo usuario' }}</h2>

        <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Nome</span>
            <input type="text" formControlName="displayName" autocomplete="name" />
            @if (isInvalid('displayName')) {
              <small>Informe o nome.</small>
            }
          </label>

          <label class="field">
            <span>Email</span>
            <input type="email" formControlName="email" autocomplete="email" />
            @if (isInvalid('email')) {
              <small>Informe um email valido.</small>
            }
          </label>

          @if (!editingUserId) {
            <label class="field">
              <span>Senha inicial</span>
              <input type="password" formControlName="password" autocomplete="new-password" />
              @if (isInvalid('password')) {
                <small>Informe uma senha com pelo menos 8 caracteres.</small>
              }
            </label>
          }

          <label class="field">
            <span>Role</span>
            <select formControlName="role">
              @for (role of availableRoleOptions(); track role) {
                <option [value]="role">{{ roleLabel(role) }}</option>
              }
            </select>
          </label>

          @if (requiresTenantScope()) {
            <label class="field">
              <span>Empresa</span>
              <select formControlName="tenantId" [disabled]="hasScopedTenant()">
                <option value="">Selecione uma empresa</option>
                @for (tenant of tenants; track tenant.id) {
                  <option [value]="tenant.id">{{ tenant.tradeName || tenant.name }}</option>
                }
              </select>
              @if (isInvalid('tenantId')) {
                <small>Selecione uma empresa.</small>
              }
            </label>
          }

          @if (requiresBusinessUnitScope()) {
            <label class="field">
              <span>Unidade</span>
              <select formControlName="businessUnitId" [disabled]="hasScopedBusinessUnit()">
                <option value="">Selecione uma unidade</option>
                @for (unit of businessUnits; track unit.id) {
                  <option [value]="unit.id">{{ unit.name }}</option>
                }
              </select>
              @if (isInvalid('businessUnitId')) {
                <small>Selecione uma unidade.</small>
              }
            </label>
          }

          <label class="check-field">
            <input type="checkbox" formControlName="isActive" />
            Usuario ativo
          </label>

          <div class="button-row form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="saving">
              {{ saving ? 'Salvando...' : editingUserId ? 'Salvar edicao' : 'Criar usuario' }}
            </button>
            @if (editingUserId) {
              <button class="btn" type="button" (click)="cancelEdit()" [disabled]="saving">
                Cancelar edicao
              </button>
            }
          </div>
        </form>
      </section>

      @if (editingUserId) {
        <section class="card">
          <h2>Alterar senha</h2>

          <form class="form-grid" [formGroup]="passwordForm" (ngSubmit)="setPassword()">
            <label class="field">
              <span>Nova senha</span>
              <input type="password" formControlName="password" autocomplete="new-password" />
              @if (isPasswordInvalid()) {
                <small>Informe uma senha com pelo menos 8 caracteres.</small>
              }
            </label>

            <div class="button-row form-actions">
              <button class="btn" type="submit" [disabled]="savingPassword">
                {{ savingPassword ? 'Alterando...' : 'Alterar senha' }}
              </button>
            </div>
          </form>
        </section>
      }

      <section class="card">
        <div class="section-heading">
          <div>
            <h2>Usuarios cadastrados</h2>
            <p>{{ users.length }} usuario(s) retornado(s) pela API.</p>
          </div>
        </div>

        @if (loading) {
          <p class="muted">Carregando usuarios...</p>
        } @else if (users.length === 0) {
          <p class="muted">Nenhum usuario cadastrado ainda.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Role</th>
                <th>Escopo</th>
                <th>Status</th>
                <th>Criado em</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users; track user.id) {
                <tr>
                  <td>{{ user.displayName }}</td>
                  <td>{{ user.email }}</td>
                  <td>{{ roleLabel(primaryRole(user)) }}</td>
                  <td>{{ scopeLabel(user) }}</td>
                  <td><span class="status-pill">{{ user.isActive ? 'Ativo' : 'Inativo' }}</span></td>
                  <td>{{ formatDate(user.createdAt) }}</td>
                  <td>
                    <div class="button-row">
                      <button class="btn btn-small" type="button" (click)="startEdit(user)">Editar</button>
                      <button class="btn btn-small" type="button" (click)="deactivate(user)" [disabled]="!user.isActive">
                        Desativar
                      </button>
                    </div>
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
export class UsersPage {
  protected readonly roleOptions: AdminRole[] = ['SystemAdmin', 'CompanyAdmin', 'UnitAdmin'];
  protected readonly form = new FormGroup({
    displayName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email, Validators.maxLength(256)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
    role: new FormControl<AdminRole>('SystemAdmin', { nonNullable: true, validators: [Validators.required] }),
    tenantId: new FormControl('', { nonNullable: true }),
    businessUnitId: new FormControl('', { nonNullable: true }),
    isActive: new FormControl(true, { nonNullable: true })
  });

  protected readonly passwordForm = new FormGroup({
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] })
  });

  protected users: AdminUser[] = [];
  protected tenants: TenantListItem[] = [];
  protected businessUnits: BusinessUnitListItem[] = [];
  protected editingUserId: string | null = null;
  protected loading = false;
  protected saving = false;
  protected savingPassword = false;
  protected successMessage = '';
  protected errorMessage = '';

  constructor(
    private readonly usersApi: AdminUsersApiService,
    private readonly tenantsApi: TenantsApiService,
    private readonly businessUnitsApi: BusinessUnitsApiService,
    protected readonly authSession: AuthSessionService
  ) {
    this.loadTenants();
    this.loadUsers();
    this.form.controls.role.valueChanges.subscribe(() => this.syncScopeControls());
    this.form.controls.tenantId.valueChanges.subscribe((tenantId) => {
      if (this.requiresBusinessUnitScope()) {
        this.loadBusinessUnits(tenantId);
      }
    });
  }

  protected loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.usersApi.list()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          this.users = this.filterUsersByScope(result.items);
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

    const save = this.editingUserId
      ? this.usersApi.update(this.editingUserId, this.buildUpdateRequest())
      : this.usersApi.create(this.buildCreateRequest());

    save.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.successMessage = this.editingUserId ? 'Usuario atualizado com sucesso.' : 'Usuario criado com sucesso.';
        this.cancelEdit();
        this.loadUsers();
      },
      error: (failure: ApiFailure) => {
        this.errorMessage = failure.error.message;
      }
    });
  }

  protected startEdit(user: AdminUser): void {
    this.editingUserId = user.id;
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
    this.form.setValue({
      displayName: user.displayName,
      email: user.email,
      password: '',
      role: this.primaryRole(user),
      tenantId: user.tenantId ?? '',
      businessUnitId: user.businessUnitId ?? '',
      isActive: user.isActive
    });
    this.syncScopeControls(user.businessUnitId ?? '');
    this.passwordForm.reset({ password: '' });
    this.successMessage = '';
    this.errorMessage = '';
  }

  protected cancelEdit(): void {
    this.editingUserId = null;
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
    this.form.reset({
      displayName: '',
      email: '',
      password: '',
      role: this.authSession.isSystemAdmin() ? 'SystemAdmin' : 'UnitAdmin',
      tenantId: '',
      businessUnitId: '',
      isActive: true
    });
    this.form.controls.password.updateValueAndValidity();
    this.syncScopeControls();
    this.passwordForm.reset({ password: '' });
  }

  protected setPassword(): void {
    if (!this.editingUserId || this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.savingPassword = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.usersApi.setPassword(this.editingUserId, this.passwordForm.getRawValue())
      .pipe(finalize(() => (this.savingPassword = false)))
      .subscribe({
        next: () => {
          this.successMessage = 'Senha alterada com sucesso.';
          this.passwordForm.reset({ password: '' });
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
  }

  protected deactivate(user: AdminUser): void {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.usersApi.deactivate(user.id)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.successMessage = 'Usuario desativado com sucesso.';
          this.loadUsers();
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

  protected isPasswordInvalid(): boolean {
    const control = this.passwordForm.controls.password;
    return control.invalid && (control.dirty || control.touched);
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  protected requiresTenantScope(): boolean {
    return this.form.controls.role.value !== 'SystemAdmin';
  }

  protected requiresBusinessUnitScope(): boolean {
    return this.form.controls.role.value === 'UnitAdmin';
  }

  protected primaryRole(user: AdminUser): AdminRole {
    return user.roles[0] ?? 'SystemAdmin';
  }

  protected roleLabel(role: AdminRole): string {
    return {
      SystemAdmin: 'Admin do sistema',
      CompanyAdmin: 'Admin da empresa',
      UnitAdmin: 'Admin da unidade'
    }[role];
  }

  protected scopeLabel(user: AdminUser): string {
    const role = this.primaryRole(user);
    if (role === 'SystemAdmin') {
      return 'Todas';
    }

    if (role === 'CompanyAdmin') {
      return `Empresa ${user.tenantId ?? '-'}`;
    }

    return `Unidade ${user.businessUnitId ?? '-'}`;
  }

  protected availableRoleOptions(): AdminRole[] {
    return this.authSession.isSystemAdmin()
      ? this.roleOptions
      : ['CompanyAdmin', 'UnitAdmin'];
  }

  protected hasScopedTenant(): boolean {
    return Boolean(this.authSession.user()?.tenantId);
  }

  protected hasScopedBusinessUnit(): boolean {
    return Boolean(this.authSession.user()?.businessUnitId);
  }

  private buildCreateRequest(): CreateAdminUserRequest {
    const value = this.form.getRawValue();
    return {
      displayName: value.displayName.trim(),
      email: value.email.trim(),
      password: value.password,
      role: value.role,
      tenantId: this.resolveRequestTenantId(value.tenantId),
      businessUnitId: this.requiresBusinessUnitScope() ? value.businessUnitId : null,
      isActive: value.isActive
    };
  }

  private buildUpdateRequest(): UpdateAdminUserRequest {
    const value = this.form.getRawValue();
    return {
      displayName: value.displayName.trim(),
      email: value.email.trim(),
      role: value.role,
      tenantId: this.resolveRequestTenantId(value.tenantId),
      businessUnitId: this.requiresBusinessUnitScope() ? value.businessUnitId : null,
      isActive: value.isActive
    };
  }

  private loadTenants(): void {
    this.tenantsApi.list().subscribe({
      next: (result) => {
        this.tenants = this.filterTenantsByScope(result.items);
        this.syncTenantControl();
      },
      error: (failure: ApiFailure) => {
        this.errorMessage = failure.error.message;
      }
    });
  }

  private loadBusinessUnits(tenantId: string, selectedBusinessUnitId = ''): void {
    this.businessUnits = [];
    this.form.controls.businessUnitId.setValue('');

    if (!tenantId) {
      return;
    }

    this.businessUnitsApi.list(tenantId).subscribe({
      next: (result) => {
        this.businessUnits = this.filterBusinessUnitsByScope(result.items);
        if (selectedBusinessUnitId && this.businessUnits.some((unit) => unit.id === selectedBusinessUnitId)) {
          this.form.controls.businessUnitId.setValue(selectedBusinessUnitId);
        }
      },
      error: (failure: ApiFailure) => {
        this.errorMessage = failure.error.message;
      }
    });
  }

  private syncScopeControls(selectedBusinessUnitId = ''): void {
    const tenantControl = this.form.controls.tenantId;
    const businessUnitControl = this.form.controls.businessUnitId;

    tenantControl.clearValidators();
    businessUnitControl.clearValidators();

    if (!this.requiresTenantScope()) {
      tenantControl.setValue('');
      businessUnitControl.setValue('');
      this.businessUnits = [];
    } else {
      tenantControl.setValidators([Validators.required]);
      this.syncTenantControl();
    }

    if (!this.requiresBusinessUnitScope()) {
      businessUnitControl.setValue('');
    } else {
      businessUnitControl.setValidators([Validators.required]);
      this.loadBusinessUnits(tenantControl.value, selectedBusinessUnitId || businessUnitControl.value);
    }

    tenantControl.updateValueAndValidity();
    businessUnitControl.updateValueAndValidity();
  }

  private filterUsersByScope(users: AdminUser[]): AdminUser[] {
    if (this.authSession.isSystemAdmin()) {
      return users;
    }

    const scopedTenantId = this.authSession.user()?.tenantId;
    return users.filter((user) =>
      user.tenantId === scopedTenantId &&
      !user.roles.includes('SystemAdmin'));
  }

  private filterTenantsByScope(tenants: TenantListItem[]): TenantListItem[] {
    const scopedTenantId = this.authSession.user()?.tenantId;
    return scopedTenantId ? tenants.filter((tenant) => tenant.id === scopedTenantId) : tenants;
  }

  private filterBusinessUnitsByScope(units: BusinessUnitListItem[]): BusinessUnitListItem[] {
    const scopedBusinessUnitId = this.authSession.user()?.businessUnitId;
    return scopedBusinessUnitId ? units.filter((unit) => unit.id === scopedBusinessUnitId) : units;
  }

  private syncTenantControl(): void {
    const scopedTenantId = this.authSession.user()?.tenantId;
    if (scopedTenantId && this.form.controls.tenantId.value !== scopedTenantId) {
      this.form.controls.tenantId.setValue(scopedTenantId);
    }
  }

  private resolveRequestTenantId(selectedTenantId: string): string | null {
    if (!this.requiresTenantScope()) {
      return null;
    }

    return this.authSession.user()?.tenantId ?? selectedTenantId;
  }
}
