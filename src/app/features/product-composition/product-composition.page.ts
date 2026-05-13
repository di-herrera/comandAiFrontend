import { Component } from '@angular/core';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-product-composition',
  standalone: true,
  imports: [EmptyStateComponent],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Composição do produto</h1>
          <p class="page-description">Relacione produtos com ingredientes removíveis e opções aplicáveis.</p>
        </div>
      </header>

      <app-empty-state
        title="Tela preparada"
        description="Implemente esta tela conforme a tarefa correspondente do backlog."
      />
    </section>
  `
})
export class ProductCompositionPage {}
