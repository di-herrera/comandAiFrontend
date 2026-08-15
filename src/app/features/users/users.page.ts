import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, of, take, timeout } from 'rxjs';

import { AdminUsersApiService } from '@core/api/admin-users-api.service';
import { BusinessUnitsApiService } from '@core/api/business-units-api.service';
import { AuthSessionService } from '@core/auth/auth-session.service';
import { CatalogContextService } from '@core/context/catalog-context.service';
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
        <div class="crud-toolbar">
          <button class="btn btn-primary" type="button" (click)="openCreate()">Novo usuario</button>
          <button class="btn" type="button" (click)="loadUsers()" [disabled]="loading">Atualizar</button>
        </div>
      </header>

      @if (successMessage) {
        <p class="feedback success">{{ successMessage }}</p>
      }

      @if (errorMessage) {
        <p class="feedback error">{{ errorMessage }}</p>
      }

      @if (isEditorOpen) {
      <div class="editor-backdrop">
        <section class="editor-panel">
          <div class="editor-header">
            <div>
              <h2>{{ editingUserId ? 'Editar usuario' : 'Novo usuario' }}</h2>
              <p>{{ editingUserId ? 'Atualize usuario, escopo e status.' : 'Crie um acesso administrativo para o painel.' }}</p>
            </div>
            <button class="btn editor-close" type="button" (click)="cancelEdit()" [disabled]="saving || savingPassword" title="Fechar">X</button>
          </div>

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
            <button class="btn" type="button" (click)="cancelEdit()" [disabled]="saving">
              Cancelar
            </button>
          </div>
        </form>

        @if (editingUserId) {
        <section class="nested-section">
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
        </section>
      </div>
      }

      <section class="card">
        <div class="section-heading">
          <div>
            <h2>Usuarios cadastrados</h2>
            <p>{{ users.length }} usuario(s) retornado(s) pela API.</p>
          </div>
          <label class="field list-search">
            <span>Buscar</span>
            <input type="search" [formControl]="searchControl" placeholder="Nome, email ou escopo" />
          </label>
        </div>

        @if (loading) {
          <p class="muted">Carregando usuarios...</p>
        } @else if (users.length === 0) {
          <p class="muted">Nenhum usuario cadastrado ainda.</p>
        } @else if (filteredUsers.length === 0) {
          <p class="muted">Nenhum usuario encontrado para a busca.</p>
        } @else {
          <table class="table responsive-table">
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
              @for (user of filteredUsers; track user.id) {
                <tr>
                  <td data-label="Usuario">{{ user.displayName }}</td>
                  <td data-label="Email">{{ user.email }}</td>
                  <td data-label="Role">{{ roleLabel(primaryRole(user)) }}</td>
                  <td data-label="Escopo">{{ scopeLabel(user) }}</td>
                  <td data-label="Status"><span class="status-pill">{{ user.isActive ? 'Ativo' : 'Inativo' }}</span></td>
                  <td data-label="Criado em">{{ formatDate(user.createdAt) }}</td>
                  <td data-label="Acoes">
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
  private static readonly RequestTimeoutMs = 15000;

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
  protected readonly searchControl = new FormControl('', { nonNullable: true });

  private readonly usersState = signal<AdminUser[]>([]);
  private readonly businessUnitsState = signal<BusinessUnitListItem[]>([]);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly savingPasswordState = signal(false);
  private readonly successMessageState = signal('');
  private readonly errorMessageState = signal('');
  private usersRequestId = 0;
  private businessUnitsRequestId = 0;

  protected get users(): AdminUser[] { return this.usersState(); }
  protected set users(value: AdminUser[]) { this.usersState.set(value); }
  protected get tenants(): TenantListItem[] { return this.catalogContext.tenants(); }
  protected get businessUnits(): BusinessUnitListItem[] { return this.businessUnitsState(); }
  protected set businessUnits(value: BusinessUnitListItem[]) { this.businessUnitsState.set(value); }
  protected editingUserId: string | null = null;
  protected isEditorOpen = false;
  protected get loading(): boolean { return this.loadingState(); }
  protected set loading(value: boolean) { this.loadingState.set(value); }
  protected get saving(): boolean { return this.savingState(); }
  protected set saving(value: boolean) { this.savingState.set(value); }
  protected get savingPassword(): boolean { return this.savingPasswordState(); }
  protected set savingPassword(value: boolean) { this.savingPasswordState.set(value); }
  protected get successMessage(): string { return this.successMessageState(); }
  protected set successMessage(value: string) { this.successMessageState.set(value); }
  protected get errorMessage(): string { return this.errorMessageState(); }
  protected set errorMessage(value: string) { this.errorMessageState.set(value); }

  constructor(
    private readonly usersApi: AdminUsersApiService,
    private readonly businessUnitsApi: BusinessUnitsApiService,
    protected readonly authSession: AuthSessionService,
    protected readonly catalogContext: CatalogContextService
  ) {
    this.loadUsers();
    this.form.controls.role.valueChanges.subscribe(() => this.syncScopeControls());
    this.form.controls.tenantId.valueChanges.subscribe((tenantId) => {
      if (this.requiresBusinessUnitScope()) {
        this.loadBusinessUnits(tenantId);
      }
    });
  }

  protected loadUsers(): void {
    const requestId = ++this.usersRequestId;
    this.loading = true;
    this.errorMessage = '';

    this.usersApi.list()
      .pipe(
        timeout(UsersPage.RequestTimeoutMs),
        take(1),
        catchError((failure: unknown) => {
          if (requestId === this.usersRequestId) {
            this.errorMessage = this.failureMessage(failure, 'usuarios');
          }

          return of(null);
        }),
        finalize(() => {
          if (requestId === this.usersRequestId) {
            this.loading = false;
          }
        })
      )
      .subscribe({
        next: (result) => {
          if (!result || requestId !== this.usersRequestId) {
            return;
          }

          this.users = this.filterUsersByScope(Array.isArray(result.items) ? result.items : []);
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

  protected openCreate(): void {
    this.cancelEdit();
    this.isEditorOpen = true;
  }

  protected get filteredUsers(): AdminUser[] {
    const term = this.searchControl.value.trim().toLowerCase();
    if (!term) {
      return this.users;
    }

    return this.users.filter((user) =>
      user.displayName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      this.roleLabel(this.primaryRole(user)).toLowerCase().includes(term) ||
      this.scopeLabel(user).toLowerCase().includes(term));
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
    this.isEditorOpen = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  protected cancelEdit(): void {
    this.editingUserId = null;
    this.isEditorOpen = false;
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

  private loadBusinessUnits(tenantId: string, selectedBusinessUnitId = ''): void {
    const requestId = ++this.businessUnitsRequestId;
    this.businessUnits = [];
    this.form.controls.businessUnitId.setValue('');

    if (!tenantId) {
      return;
    }

    this.businessUnitsApi.list(tenantId).pipe(
      timeout(UsersPage.RequestTimeoutMs),
      take(1),
      catchError((failure: unknown) => {
        if (requestId === this.businessUnitsRequestId) {
          this.errorMessage = this.failureMessage(failure, 'unidades');
        }

        return of(null);
      })
    ).subscribe({
      next: (result) => {
        if (!result || requestId !== this.businessUnitsRequestId) {
          return;
        }

        this.businessUnits = this.filterBusinessUnitsByScope(result.items);
        if (selectedBusinessUnitId && this.businessUnits.some((unit) => unit.id === selectedBusinessUnitId)) {
          this.form.controls.businessUnitId.setValue(selectedBusinessUnitId);
        }
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

  private failureMessage(failure: unknown, resource: string): string {
    if (failure && typeof failure === 'object') {
      const candidate = failure as Partial<ApiFailure>;
      if (candidate.error && typeof candidate.error.message === 'string') {
        return candidate.error.message;
      }
    }

    return `Nao foi possivel carregar ${resource}. Tente novamente.`;
  }
}
