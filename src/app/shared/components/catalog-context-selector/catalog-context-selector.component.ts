import { Component, EventEmitter, Input, Output, effect } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { CatalogContextService } from '@core/context/catalog-context.service';

@Component({
  selector: 'app-catalog-context-selector',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="context-selector" [class.context-selector-card]="asCard">
      <div class="form-grid">
        <label class="field">
          <span>Empresa</span>
          <select [formControl]="tenantControl" [disabled]="context.tenantSelectionLocked()">
            <option value="">Selecione uma empresa</option>
            @for (tenant of context.tenants(); track tenant.id) {
              <option [value]="tenant.id">{{ tenant.tradeName || tenant.name }}</option>
            }
          </select>
        </label>

        <label class="field">
          <span>Unidade</span>
          <select
            [formControl]="businessUnitControl"
            [disabled]="!context.hasTenant() || context.loadingBusinessUnits() || context.businessUnitSelectionLocked()"
          >
            <option value="">Selecione uma unidade</option>
            @for (unit of context.businessUnits(); track unit.id) {
              <option [value]="unit.id">{{ unit.name }}</option>
            }
          </select>
        </label>

        <div class="context-panel">
          <strong>Filtro ativo</strong>
          <span>Empresa: {{ context.selectedTenantName() || 'nenhuma selecionada' }}</span>
          <span>Unidade: {{ context.selectedBusinessUnitName() || 'nenhuma selecionada' }}</span>
        </div>
      </div>

      @if (context.errorMessage()) {
        <p class="muted context-message">{{ context.errorMessage() }}</p>
      }

      @if (showActions) {
        <div class="button-row context-actions">
          <button class="btn btn-primary" type="button" (click)="confirmed.emit()" [disabled]="!context.hasCatalogContext()">
            Usar filtro
          </button>
          <button class="btn" type="button" (click)="cancelled.emit()">
            Fechar
          </button>
        </div>
      }
    </section>
  `
})
export class CatalogContextSelectorComponent {
  @Input() asCard = true;
  @Input() showActions = false;
  @Output() readonly confirmed = new EventEmitter<void>();
  @Output() readonly cancelled = new EventEmitter<void>();

  protected readonly tenantControl = new FormControl('', { nonNullable: true });
  protected readonly businessUnitControl = new FormControl('', { nonNullable: true });

  constructor(protected readonly context: CatalogContextService) {
    effect(() => {
      this.tenantControl.setValue(this.context.selectedTenantId(), { emitEvent: false });
      this.businessUnitControl.setValue(this.context.selectedBusinessUnitId(), { emitEvent: false });
    });

    this.tenantControl.valueChanges.subscribe((tenantId) => {
      this.context.selectTenant(tenantId);
    });

    this.businessUnitControl.valueChanges.subscribe((businessUnitId) => {
      this.context.selectBusinessUnit(businessUnitId);
    });
  }
}
