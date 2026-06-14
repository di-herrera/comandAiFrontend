import { Component, EventEmitter, Input, Output } from '@angular/core';

import { AdminUser } from '@shared/models/auth.models';

@Component({
  selector: 'app-header',
  standalone: true,
  styles: [`
    :host {
      display: block;
      min-width: 0;
    }

    .app-header {
      position: sticky;
      top: 0;
      z-index: 9;
      min-width: 0;
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: center;
      border-bottom: 1px solid var(--border);
      background: rgba(247, 247, 248, .96);
      padding: .85rem 1.25rem;
      backdrop-filter: blur(12px);
    }

    .header-context,
    .header-user {
      min-width: 0;
      display: flex;
      align-items: center;
      gap: .75rem;
    }

    .header-context {
      flex: 1 1 auto;
    }

    .header-user {
      flex: 0 1 auto;
      justify-content: flex-end;
    }

    .header-user div,
    .context-summary {
      min-width: 0;
      display: grid;
      gap: .1rem;
    }

    .header-user strong,
    .context-summary strong {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .header-user span,
    .context-summary span {
      color: var(--muted);
      font-size: .82rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .context-label {
      color: var(--muted);
      font-size: .72rem !important;
      font-weight: 700;
      text-transform: uppercase;
    }

    .context-summary {
      max-width: min(560px, 100%);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface);
      padding: .5rem .75rem;
    }

    .context-summary.context-missing {
      border-color: #fedf89;
      background: #fffaeb;
    }

    @media (max-width: 820px) {
      .app-header {
        position: static;
        display: grid;
        align-items: stretch;
        padding: .85rem 1rem;
      }

      .header-context,
      .header-user {
        display: grid;
        justify-content: stretch;
      }

      .header-context .btn,
      .header-user .btn {
        width: 100%;
      }

      .context-summary {
        max-width: none;
      }
    }
  `],
  template: `
    <header class="app-header">
      <div class="header-context">
        @if (requiresCatalogContext) {
          <div class="context-summary" [class.context-missing]="!hasCatalogContext">
            <span class="context-label">Filtro ativo</span>
            @if (hasCatalogContext) {
              <strong>{{ selectedTenantName }}</strong>
              <span>{{ selectedBusinessUnitName }}</span>
            } @else {
              <strong>Nenhum filtro selecionado</strong>
              <span>Selecione empresa e unidade para usar esta tela.</span>
            }
          </div>

          <button class="btn btn-small" type="button" (click)="openContext.emit()">
            {{ hasCatalogContext ? 'Editar filtro' : 'Selecionar filtro' }}
          </button>
        }
      </div>

      @if (user) {
        <div class="header-user">
          <div>
            <strong>{{ user.displayName }}</strong>
            <span>{{ user.email }}</span>
            <span>{{ user.roles.join(', ') }}</span>
          </div>
          <button class="btn btn-small" type="button" (click)="logout.emit()" [disabled]="loggingOut">
            {{ loggingOut ? 'Saindo...' : 'Sair' }}
          </button>
        </div>
      }
    </header>
  `
})
export class AppHeaderComponent {
  @Input({ required: true }) user: AdminUser | null = null;
  @Input({ required: true }) loggingOut = false;
  @Input({ required: true }) requiresCatalogContext = false;
  @Input({ required: true }) hasCatalogContext = false;
  @Input({ required: true }) selectedTenantName = '';
  @Input({ required: true }) selectedBusinessUnitName = '';

  @Output() readonly openContext = new EventEmitter<void>();
  @Output() readonly logout = new EventEmitter<void>();
}
