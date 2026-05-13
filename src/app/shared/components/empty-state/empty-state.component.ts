import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <section class="empty">
      <h2>{{ title() }}</h2>
      <p>{{ description() }}</p>
    </section>
  `,
  styles: [`
    .empty {
      border: 1px dashed var(--border);
      background: var(--surface);
      border-radius: var(--radius);
      padding: 2rem;
      text-align: center;
    }
    .empty h2 { margin: 0 0 .35rem; font-size: 1.1rem; }
    .empty p { margin: 0; color: var(--muted); }
  `]
})
export class EmptyStateComponent {
  title = input.required<string>();
  description = input.required<string>();
}
