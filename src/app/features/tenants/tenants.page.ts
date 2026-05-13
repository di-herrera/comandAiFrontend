import { Component } from '@angular/core';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-tenants',
  standalone: true,
  imports: [EmptyStateComponent],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Empresas</h1>
          <p class="page-description">Cadastre e mantenha as empresas atendidas pela ComandAI.</p>
        </div>
      </header>

      <app-empty-state
        title="Tela preparada"
        description="Implemente esta tela conforme a tarefa correspondente do backlog."
      />
    </section>
  `
})
export class TenantsPage {}
