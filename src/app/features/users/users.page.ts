import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminUsersApiService } from '@core/api/admin-users-api.service';
import {
  AdminUser,
  CreateAdminUserRequest,
  UpdateAdminUserRequest
} from '@shared/models/auth.models';
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
  protected readonly form = new FormGroup({
    displayName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email, Validators.maxLength(256)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
    isActive: new FormControl(true, { nonNullable: true })
  });

  protected readonly passwordForm = new FormGroup({
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] })
  });

  protected users: AdminUser[] = [];
  protected editingUserId: string | null = null;
  protected loading = false;
  protected saving = false;
  protected savingPassword = false;
  protected successMessage = '';
  protected errorMessage = '';

  constructor(private readonly usersApi: AdminUsersApiService) {
    this.loadUsers();
  }

  protected loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.usersApi.list()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          this.users = result.items;
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
      isActive: user.isActive
    });
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
      isActive: true
    });
    this.form.controls.password.updateValueAndValidity();
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

  private buildCreateRequest(): CreateAdminUserRequest {
    const value = this.form.getRawValue();
    return {
      displayName: value.displayName.trim(),
      email: value.email.trim(),
      password: value.password,
      isActive: value.isActive
    };
  }

  private buildUpdateRequest(): UpdateAdminUserRequest {
    const value = this.form.getRawValue();
    return {
      displayName: value.displayName.trim(),
      email: value.email.trim(),
      isActive: value.isActive
    };
  }
}
