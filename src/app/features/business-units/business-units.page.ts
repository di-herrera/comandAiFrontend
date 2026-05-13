import { Component } from '@angular/core';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-business-units',
  standalone: true,
  imports: [EmptyStateComponent],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Unidades de negócio</h1>
          <p class="page-description">Cadastre unidades operacionais vinculadas a uma empresa.</p>
        </div>
      </header>

      <app-empty-state
        title="Tela preparada"
        description="Implemente esta tela conforme a tarefa correspondente do backlog."
      />
    </section>
  `
})
export class BusinessUnitsPage {}
