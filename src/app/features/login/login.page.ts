import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthSessionService } from '@core/auth/auth-session.service';
import { ApiFailure } from '@shared/models/common.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="auth-page">
      <form class="auth-panel" [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <p class="eyebrow">ComandAI</p>
          <h1 class="page-title">Acesso administrativo</h1>
          <p class="page-description">Entre para manter os dados operacionais da loja.</p>
        </div>

        @if (errorMessage) {
          <p class="feedback error">{{ errorMessage }}</p>
        }

        <label class="field">
          <span>Email</span>
          <input type="email" formControlName="email" autocomplete="username" />
          @if (isInvalid('email')) {
            <small>Informe um email valido.</small>
          }
        </label>

        <label class="field">
          <span>Senha</span>
          <input type="password" formControlName="password" autocomplete="current-password" />
          @if (isInvalid('password')) {
            <small>Informe a senha.</small>
          }
        </label>

        <button class="btn btn-primary" type="submit" [disabled]="saving">
          {{ saving ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>
    </section>
  `
})
export class LoginPage {
  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  protected saving = false;
  protected errorMessage = '';

  constructor(
    private readonly authSession: AuthSessionService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    this.authSession.login(this.form.getRawValue())
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
          void this.router.navigateByUrl(returnUrl);
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message || 'Nao foi possivel entrar.';
        }
      });
  }

  protected isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }
}
