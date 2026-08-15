import { Component, effect } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { OptionGroupsApiService } from '@core/api/option-groups-api.service';
import { OptionsApiService } from '@core/api/options-api.service';
import { CatalogContextService } from '@core/context/catalog-context.service';
import {
  OptionGroup,
  OptionGroupOptionRequest,
  OptionGroupRequest,
  ProductOptionListItem
} from '@shared/models/catalog.models';
import { ApiFailure } from '@shared/models/common.models';

type OptionGroupOptionForm = FormGroup<{
  optionId: FormControl<string>;
  isAvailable: FormControl<boolean>;
  displayOrder: FormControl<number>;
}>;

@Component({
  selector: 'app-option-groups',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Catalogo por unidade</p>
          <h1 class="page-title">Grupos</h1>
          <p class="page-description">Cadastre grupos reutilizaveis e suas opcoes antes de vincular em categorias ou produtos.</p>
        </div>
        <div class="crud-toolbar">
          <button class="btn btn-primary" type="button" (click)="openCreate()" [disabled]="!canUseCatalogContext">
            Novo grupo
          </button>
          <button class="btn" type="button" (click)="loadData()" [disabled]="loading || !canUseCatalogContext">
            Atualizar
          </button>
        </div>
      </header>

      @if (successMessage) {
        <p class="feedback success">{{ successMessage }}</p>
      }

      @if (errorMessage) {
        <p class="feedback error">{{ errorMessage }}</p>
      }

      <section class="card">
        <div class="section-heading">
          <div>
            <h2>Grupos cadastrados</h2>
          </div>
          <label class="field list-search">
            <span>Buscar</span>
            <input type="search" [formControl]="searchControl" placeholder="Grupo ou opcao" />
          </label>
        </div>

        @if (!canUseCatalogContext) {
          <p class="muted">Selecione empresa e unidade para listar grupos.</p>
        } @else if (loading) {
          <p class="muted">Carregando grupos...</p>
        } @else if (optionGroups.length === 0) {
          <p class="muted">Nenhum grupo cadastrado para este contexto.</p>
        } @else if (filteredOptionGroups.length === 0) {
          <p class="muted">Nenhum grupo encontrado para a busca.</p>
        } @else {
          <table class="table responsive-table">
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Selecao</th>
                <th>Opcoes</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              @for (group of filteredOptionGroups; track group.id) {
                <tr>
                  <td data-label="Grupo">
                    <strong>{{ group.name }}</strong>
                    @if (group.isRequired) {
                      <span class="status-chip active">obrigatorio</span>
                    }
                  </td>
                  <td data-label="Selecao">{{ group.minSelected }} a {{ group.maxSelected }}</td>
                  <td data-label="Opcoes">
                    @for (option of group.options; track option.id) {
                      <span class="inline-chip">{{ option.code }} - {{ option.name }}</span>
                    }
                  </td>
                  <td data-label="Acoes">
                    <div class="button-row compact">
                      <button class="btn" type="button" (click)="editGroup(group)">Editar</button>
                      <button class="btn btn-danger" type="button" (click)="deleteGroup(group)" [disabled]="saving">
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>

      @if (isEditorOpen) {
      <div class="editor-backdrop">
        <section class="editor-panel editor-panel-wide">
          <form [formGroup]="form" (ngSubmit)="saveGroup()" class="panel-form">
          <div class="section-heading compact-heading">
            <div>
              <h2>{{ form.controls.id.value ? 'Editar grupo' : 'Novo grupo' }}</h2>
              <p>O grupo fica disponivel para vinculo em categorias e produtos.</p>
            </div>
            <button class="btn editor-close" type="button" (click)="closeEditor()" [disabled]="saving" title="Fechar">X</button>
          </div>

          <div class="form-grid">
            <label class="field">
              <span>Nome do grupo</span>
              <input type="text" formControlName="name" placeholder="Adicionais" />
            </label>

            <label class="field compact-field">
              <span>Minimo</span>
              <input type="number" min="0" formControlName="minSelected" />
            </label>

            <label class="field compact-field">
              <span>Maximo</span>
              <input type="number" min="0" formControlName="maxSelected" />
            </label>

            <label class="check-field">
              <input type="checkbox" formControlName="isRequired" />
              <span>Obrigatorio</span>
            </label>
          </div>

          <div class="section-heading compact-heading">
            <div>
              <h3>Opcoes do grupo</h3>
            </div>
            <button class="btn" type="button" (click)="addOptionRow()" [disabled]="availableOptions.length === 0">Adicionar opcao</button>
          </div>

          <div formArrayName="options" class="option-editor">
            @for (optionControl of optionRows.controls; track $index) {
              <div class="option-row" [formGroup]="optionControl">
                <label class="field">
                  <span>Opcao cadastrada</span>
                  <select formControlName="optionId">
                    <option value="">Selecione uma opcao</option>
                    @for (option of availableOptions; track option.id) {
                      <option [value]="option.id">{{ option.code }} - {{ option.name }} - {{ formatCurrency(option.additionalPrice) }}</option>
                    }
                  </select>
                </label>
                <label class="field compact-field">
                  <span>Ordem</span>
                  <input type="number" min="0" formControlName="displayOrder" />
                </label>
                <label class="check-field">
                  <input type="checkbox" formControlName="isAvailable" />
                  <span>Disponivel</span>
                </label>
                <button class="btn btn-danger icon-button" type="button" (click)="removeOptionRow($index)" title="Remover opcao">
                  X
                </button>
              </div>
            }
          </div>

          <div class="button-row">
            <button class="btn btn-primary" type="submit" [disabled]="saving || !canUseCatalogContext">
              {{ saving ? 'Salvando...' : 'Salvar grupo' }}
            </button>
            <button class="btn" type="button" (click)="closeEditor()" [disabled]="saving">
              Cancelar
            </button>
          </div>
        </form>
        </section>
      </div>
      }
    </section>
  `
})
export class OptionGroupsPage {
  protected readonly form = new FormGroup({
    id: new FormControl<string | null>(null),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(160)] }),
    minSelected: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
    maxSelected: new FormControl(1, { nonNullable: true, validators: [Validators.min(0)] }),
    isRequired: new FormControl(false, { nonNullable: true }),
    options: new FormArray<OptionGroupOptionForm>([])
  });
  protected readonly searchControl = new FormControl('', { nonNullable: true });

  private readonly optionGroupsState = signal<OptionGroup[]>([]);
  protected get optionGroups(): OptionGroup[] { return this.optionGroupsState(); }
  protected set optionGroups(value: OptionGroup[]) { this.optionGroupsState.set(value); }
  protected availableOptions: ProductOptionListItem[] = [];
  protected isEditorOpen = false;
  private readonly loadingState = signal(false);
  protected get loading(): boolean { return this.loadingState(); }
  protected set loading(value: boolean) { this.loadingState.set(value); }
  protected saving = false;
  protected successMessage = '';
  protected errorMessage = '';

  constructor(
    protected readonly catalogContext: CatalogContextService,
    private readonly optionGroupsApi: OptionGroupsApiService,
    private readonly optionsApi: OptionsApiService
  ) {
    effect(() => {
      this.catalogContext.selectedTenantId();
      this.catalogContext.selectedBusinessUnitId();
      this.resetForm();
      this.isEditorOpen = false;
      this.loadData();
    });
  }

  protected get canUseCatalogContext(): boolean {
    return this.catalogContext.hasCatalogContext();
  }

  protected get optionRows(): FormArray<OptionGroupOptionForm> {
    return this.form.controls.options;
  }

  protected get filteredOptionGroups(): OptionGroup[] {
    const term = this.searchControl.value.trim().toLowerCase();
    if (!term) {
      return this.optionGroups;
    }

    return this.optionGroups.filter((group) =>
      group.name.toLowerCase().includes(term) ||
      group.options.some((option) =>
        option.code.toLowerCase().includes(term) ||
        option.name.toLowerCase().includes(term)));
  }

  protected loadData(): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();
    this.optionGroups = [];
    this.availableOptions = [];

    if (!tenantId || !businessUnitId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      groups: this.optionGroupsApi.list(tenantId, businessUnitId),
      options: this.optionsApi.list(tenantId, businessUnitId)
    }).pipe(finalize(() => (this.loading = false))).subscribe({
      next: ({ groups, options }) => {
        this.optionGroups = groups.items;
        this.availableOptions = options.items;
      },
      error: (failure: ApiFailure) => {
        this.errorMessage = failure.error.message;
      }
    });
  }

  protected saveGroup(): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();

    if (!tenantId || !businessUnitId) {
      this.errorMessage = 'Selecione empresa e unidade antes de salvar o grupo.';
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Preencha nome do grupo, opcoes e ordem validos.';
      return;
    }

    const request = this.buildRequest();
    if (!this.validateRequest(request)) {
      return;
    }

    const groupId = this.form.controls.id.value;
    const operation = groupId
      ? this.optionGroupsApi.update(tenantId, businessUnitId, groupId, request)
      : this.optionGroupsApi.create(tenantId, businessUnitId, request);

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    operation.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.successMessage = groupId ? 'Grupo atualizado com sucesso.' : 'Grupo cadastrado com sucesso.';
        this.closeEditor();
        this.loadData();
      },
      error: (failure: ApiFailure) => {
        this.errorMessage = failure.error.message;
      }
    });
  }

  protected openCreate(): void {
    this.resetForm();
    this.isEditorOpen = true;
  }

  protected editGroup(group: OptionGroup): void {
    this.optionRows.clear();
    this.form.reset({
      id: group.id,
      name: group.name,
      minSelected: group.minSelected,
      maxSelected: group.maxSelected,
      isRequired: group.isRequired
    });

    for (const option of group.options) {
      this.addOptionRow({
        optionId: option.optionId,
        isAvailable: option.isAvailable,
        displayOrder: option.displayOrder
      });
    }

    if (group.options.length === 0) {
      this.addOptionRow();
    }

    this.isEditorOpen = true;
  }

  protected deleteGroup(group: OptionGroup): void {
    const tenantId = this.catalogContext.selectedTenantId();
    const businessUnitId = this.catalogContext.selectedBusinessUnitId();

    if (!tenantId || !businessUnitId) {
      return;
    }

    if (!window.confirm(`Excluir o grupo "${group.name}"?`)) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.optionGroupsApi.delete(tenantId, businessUnitId, group.id)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.successMessage = 'Grupo excluido com sucesso.';
          this.resetForm();
          this.loadData();
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
  }

  protected resetForm(): void {
    this.optionRows.clear();
    this.form.reset({
      id: null,
      name: '',
      minSelected: 0,
      maxSelected: 1,
      isRequired: false
    });
    this.addOptionRow();
  }

  protected closeEditor(): void {
    this.resetForm();
    this.isEditorOpen = false;
  }

  protected addOptionRow(option?: OptionGroupOptionRequest): void {
    this.optionRows.push(new FormGroup({
      optionId: new FormControl(option?.optionId ?? '', { nonNullable: true, validators: [Validators.required] }),
      isAvailable: new FormControl(option?.isAvailable ?? true, { nonNullable: true }),
      displayOrder: new FormControl(option?.displayOrder ?? this.optionRows.length + 1, { nonNullable: true, validators: [Validators.min(0)] })
    }));
  }

  protected removeOptionRow(index: number): void {
    this.optionRows.removeAt(index);
    if (this.optionRows.length === 0) {
      this.addOptionRow();
    }
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  private buildRequest(): OptionGroupRequest {
    return {
      name: this.form.controls.name.value.trim(),
      minSelected: this.form.controls.minSelected.value,
      maxSelected: this.form.controls.maxSelected.value,
      isRequired: this.form.controls.isRequired.value,
      options: this.optionRows.controls.map((control) => ({
        optionId: control.controls.optionId.value,
        isAvailable: control.controls.isAvailable.value,
        displayOrder: control.controls.displayOrder.value
      }))
    };
  }

  private validateRequest(request: OptionGroupRequest): boolean {
    if (request.maxSelected < request.minSelected) {
      this.errorMessage = 'O maximo de escolhas nao pode ser menor que o minimo.';
      return false;
    }

    if (request.isRequired && request.minSelected === 0) {
      this.errorMessage = 'Grupo obrigatorio deve exigir pelo menos uma escolha.';
      return false;
    }

    const optionIds = request.options.map((option) => option.optionId);
    if (new Set(optionIds).size !== optionIds.length) {
      this.errorMessage = 'A mesma opcao nao pode aparecer duas vezes no grupo.';
      return false;
    }

    return true;
  }
}


import { signal } from '@angular/core';
