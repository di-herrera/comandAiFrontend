import { Component } from '@angular/core';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [EmptyStateComponent],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Início</h1>
          <p class="page-description">Painel administrativo simples para manter os dados mínimos da ComandAI.</p>
        </div>
      </header>

      <app-empty-state
        title="Tela preparada"
        description="Implemente esta tela conforme a tarefa correspondente do backlog."
      />
    </section>
  `
})
export class DashboardPage {}
