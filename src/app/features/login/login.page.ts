import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <section class="auth-page">
      <div class="auth-panel">
        <p class="eyebrow">ComandAI</p>
        <h1 class="page-title">Acesso administrativo</h1>
        <p class="page-description">Informe suas credenciais para continuar.</p>
      </div>
    </section>
  `
})
export class LoginPage {}
