import { Component, effect } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CompositionGroupsApiService } from '@core/api/composition-groups-api.service';
import { ProductsApiService } from '@core/api/products-api.service';
import { CatalogContextService } from '@core/context/catalog-context.service';
import { CompositionGroup, CompositionGroupRequest, ProductListItem } from '@shared/models/catalog.models';

type RuleForm = FormGroup<{ variantCode: FormControl<string>; variantName: FormControl<string>; minParts: FormControl<number>; maxParts: FormControl<number> }>;

@Component({
  selector: 'app-composition-groups',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div><p class="eyebrow">Catalogo por unidade</p><h1 class="page-title">Composicoes</h1><p class="page-description">Configure produtos que podem formar um unico item, como pizzas com varios sabores.</p></div>
        <div class="crud-toolbar"><button class="btn btn-primary" type="button" (click)="openCreate()">Nova composicao</button><button class="btn" type="button" (click)="loadData()">Atualizar</button></div>
      </header>
      @if (errorMessage) { <p class="feedback error">{{ errorMessage }}</p> }
      @if (successMessage) { <p class="feedback success">{{ successMessage }}</p> }
      <section class="card">
        <h2>Grupos cadastrados</h2>
        @if (loading) { <p class="muted">Carregando...</p> }
        @else if (groups.length === 0) { <p class="muted">Nenhuma composicao cadastrada.</p> }
        @else {
          <table class="table responsive-table"><thead><tr><th>Grupo</th><th>Produtos</th><th>Limites</th><th></th></tr></thead><tbody>
            @for (group of groups; track group.id) {
              <tr><td><strong>{{ group.name }}</strong><br><span class="muted">{{ group.code }}</span></td><td>{{ group.productIds.length }}</td><td>@for (rule of group.variantRules; track rule.variantId) { <span class="status-pill">{{ rule.variantName }}: {{ rule.minParts }}-{{ rule.maxParts }}</span> }</td><td><button class="btn btn-small" type="button" (click)="edit(group)">Editar</button></td></tr>
            }
          </tbody></table>
        }
      </section>
      @if (editorOpen) {
        <div class="editor-backdrop"><section class="editor-panel"><div class="editor-header"><div><h2>{{ editingId ? 'Editar composicao' : 'Nova composicao' }}</h2><p>O backend valida produtos, tamanhos e limites.</p></div><button class="btn editor-close" type="button" (click)="close()">X</button></div>
          <form class="form-grid" [formGroup]="form" (ngSubmit)="save()">
            <label class="field"><span>Codigo</span><input formControlName="code" placeholder="PIZZAS" /></label>
            <label class="field"><span>Nome</span><input formControlName="name" placeholder="Pizza" /></label>
            <label class="field"><span>Status</span><select formControlName="status"><option value="Active">Ativo</option><option value="Inactive">Inativo</option></select></label>
            <section class="field-wide nested-section"><h3>Produtos participantes</h3><div class="checkbox-grid">
              @for (product of products; track product.id) { <label class="checkbox-field"><input type="checkbox" [checked]="selectedProductIds.has(product.id)" (change)="toggleProduct(product.id, $any($event.target).checked)" /><span>{{ product.name }} ({{ product.categoryName }})</span></label> }
            </div></section>
            <section class="field-wide nested-section" formArrayName="rules"><h3>Limites por tamanho</h3>
              @for (rule of rules.controls; track rule.controls.variantCode.value; let i = $index) {
                <div class="variant-card" [formGroupName]="i"><label class="field"><span>Tamanho</span><input formControlName="variantName" readonly /></label><label class="field"><span>Minimo</span><input type="number" min="1" formControlName="minParts" /></label><label class="field"><span>Maximo</span><input type="number" min="1" formControlName="maxParts" /></label></div>
              }
            </section>
            <div class="field-wide form-actions"><button class="btn" type="button" (click)="close()">Cancelar</button><button class="btn btn-primary" type="submit" [disabled]="saving">{{ saving ? 'Salvando...' : 'Salvar' }}</button></div>
          </form>
        </section></div>
      }
    </section>
  `
})
export class CompositionGroupsPage {
  readonly form = new FormGroup({ code: new FormControl('', { nonNullable: true, validators: [Validators.required] }), name: new FormControl('', { nonNullable: true, validators: [Validators.required] }), status: new FormControl<'Active' | 'Inactive'>('Active', { nonNullable: true }), rules: new FormArray<RuleForm>([]) });
  groups: CompositionGroup[] = []; products: ProductListItem[] = []; selectedProductIds = new Set<string>();
  loading = false; saving = false; editorOpen = false; editingId: string | null = null; errorMessage = ''; successMessage = '';
  private lastContext = '';
  constructor(private readonly api: CompositionGroupsApiService, private readonly productsApi: ProductsApiService, private readonly context: CatalogContextService) {
    effect(() => { const key = `${context.selectedTenantId()}|${context.selectedBusinessUnitId()}`; if (key !== this.lastContext) { this.lastContext = key; this.loadData(); } });
  }
  get rules(): FormArray<RuleForm> { return this.form.controls.rules; }
  loadData(): void {
    const tenantId = this.context.selectedTenantId(); const unitId = this.context.selectedBusinessUnitId();
    if (!tenantId || !unitId) { this.groups = []; this.products = []; return; }
    this.loading = true; forkJoin({ groups: this.api.list(tenantId, unitId), products: this.productsApi.list(tenantId, unitId) }).subscribe({ next: value => { this.groups = value.groups.items; this.products = value.products.items; this.loading = false; }, error: () => { this.errorMessage = 'Nao foi possivel carregar as composicoes.'; this.loading = false; } });
  }
  openCreate(): void { this.editingId = null; this.selectedProductIds.clear(); this.form.reset({ code: '', name: '', status: 'Active' }); this.rules.clear(); this.editorOpen = true; }
  edit(group: CompositionGroup): void { this.editingId = group.id; this.selectedProductIds = new Set(group.productIds); this.form.patchValue({ code: group.code, name: group.name, status: group.status }); this.rules.clear(); for (const rule of group.variantRules) this.rules.push(this.ruleForm(rule.variantCode, rule.variantName, rule.minParts, rule.maxParts)); this.editorOpen = true; }
  close(): void { this.editorOpen = false; }
  toggleProduct(id: string, selected: boolean): void { selected ? this.selectedProductIds.add(id) : this.selectedProductIds.delete(id); this.syncRules(); }
  save(): void {
    if (this.form.invalid || this.selectedProductIds.size === 0 || this.rules.length === 0) { this.errorMessage = 'Informe grupo, produtos e limites.'; return; }
    const tenantId = this.context.selectedTenantId(); const unitId = this.context.selectedBusinessUnitId(); const value = this.form.getRawValue();
    const request: CompositionGroupRequest = { code: value.code.trim(), name: value.name.trim(), status: value.status, productIds: [...this.selectedProductIds], variantRules: value.rules.map(rule => ({ variantCode: rule.variantCode, minParts: rule.minParts, maxParts: rule.maxParts })) };
    this.saving = true; const operation = this.editingId ? this.api.update(tenantId, unitId, this.editingId, request) : this.api.create(tenantId, unitId, request);
    operation.subscribe({ next: () => { this.saving = false; this.editorOpen = false; this.successMessage = 'Composicao salva com sucesso.'; this.loadData(); }, error: () => { this.saving = false; this.errorMessage = 'Nao foi possivel salvar a composicao.'; } });
  }
  private syncRules(): void {
    const current = new Map(this.rules.controls.map(rule => [rule.controls.variantCode.value, rule.getRawValue()]));
    const variants = new Map<string, string>();
    for (const product of this.products.filter(product => this.selectedProductIds.has(product.id))) for (const variant of product.variants) variants.set(variant.code, variant.name);
    this.rules.clear();
    for (const [code, name] of variants) { const value = current.get(code); this.rules.push(this.ruleForm(code, name, value?.minParts ?? 1, value?.maxParts ?? 1)); }
  }
  private ruleForm(code: string, name: string, min: number, max: number): RuleForm { return new FormGroup({ variantCode: new FormControl(code, { nonNullable: true }), variantName: new FormControl(name, { nonNullable: true }), minParts: new FormControl(min, { nonNullable: true, validators: [Validators.min(1)] }), maxParts: new FormControl(max, { nonNullable: true, validators: [Validators.min(1)] }) }); }
}
