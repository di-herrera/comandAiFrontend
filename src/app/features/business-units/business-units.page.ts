import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { BusinessUnitsApiService } from '@core/api/business-units-api.service';
import { TenantsApiService } from '@core/api/tenants-api.service';
import { AuthSessionService } from '@core/auth/auth-session.service';
import {
  BusinessUnitCreateRequest,
  BusinessUnitListItem,
  BusinessUnitWhatsAppChannel,
  StorefrontTheme,
  WhatsAppReturnMessageCadence,
  TenantListItem
} from '@shared/models/catalog.models';
import { ApiFailure, EntityStatus } from '@shared/models/common.models';

@Component({
  selector: 'app-business-units',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Empresa e unidades</p>
          <h1 class="page-title">Unidades de negócio</h1>
          <p class="page-description">Cadastre unidades operacionais vinculadas a uma empresa.</p>
        </div>
        <div class="crud-toolbar">
          @if (canEditBusinessUnits()) {
            <button class="btn btn-primary" type="button" (click)="openCreate()" [disabled]="!tenantControl.value">
              Nova unidade
            </button>
          }
          <button class="btn" type="button" (click)="loadBusinessUnits()" [disabled]="loading || !tenantControl.value">
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
        <div class="form-grid">
          <label class="field">
            <span>Empresa</span>
            <select [formControl]="tenantControl" [disabled]="tenantSelectionLocked()">
              <option value="">Selecione uma empresa</option>
              @for (tenant of tenants; track tenant.id) {
                <option [value]="tenant.id">{{ tenant.tradeName || tenant.name }}</option>
              }
            </select>
            <small>As unidades abaixo são filtradas pela empresa selecionada.</small>
          </label>

          <div class="context-panel">
            <strong>Contexto atual</strong>
            <span>Empresa: {{ selectedTenantName || 'nenhuma selecionada' }}</span>
          </div>
        </div>
      </section>

      @if (isEditorOpen && canEditBusinessUnits()) {
      <div class="editor-backdrop">
        <section class="editor-panel">
          <div class="editor-header">
            <div>
              <h2>{{ editingBusinessUnitId ? 'Editar unidade' : 'Nova unidade' }}</h2>
              <p>Empresa: {{ selectedTenantName || 'nenhuma selecionada' }}</p>
            </div>
            <button class="btn editor-close" type="button" (click)="cancelEdit()" [disabled]="saving" title="Fechar">X</button>
          </div>

          <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Nome da unidade</span>
            <input type="text" formControlName="name" />
            @if (isInvalid('name')) {
              <small>Informe o nome da unidade.</small>
            }
          </label>

          <label class="field">
            <span>Telefone WhatsApp</span>
            <input type="text" formControlName="phone" placeholder="+5517999999999" />
          </label>

          <label class="field">
            <span>Nome do link publico</span>
            <input type="text" formControlName="publicSlug" placeholder="unidade-centro" />
            @if (isInvalid('publicSlug')) {
              <small>Use 3 a 63 caracteres: letras minusculas, numeros e hifens.</small>
            } @else {
              <small class="field-hint">{{ publicSlugPreview }}</small>
            }
          </label>

          <label class="field">
            <span>Endereço</span>
            <input type="text" formControlName="address" />
          </label>

          <label class="field">
            <span>Taxa fixa de entrega</span>
            <input type="number" min="0" step="0.01" formControlName="fixedDeliveryFee" />
            @if (isInvalid('fixedDeliveryFee')) {
              <small>Informe uma taxa maior ou igual a zero.</small>
            }
          </label>

          <label class="field full-span">
            <span>Mensagem inicial no WhatsApp</span>
            <span
              class="info-hover"
              tabindex="0"
              [title]="'Se não for preenchida, será enviada a mensagem padrão: ' + defaultWhatsAppWelcomeMessage"
            >?</span>
            <textarea rows="5" formControlName="whatsAppWelcomeMessage"></textarea>
            @if (isInvalid('whatsAppWelcomeMessage')) {
              <small>Use no máximo 1000 caracteres.</small>
            } @else {
              <small class="field-hint">Enviada automaticamente apenas no primeiro contato do cliente. Deixe em branco para usar a mensagem padrão.</small>
            }
          </label>

          <label class="field full-span">
            <span>Mensagem de retorno no WhatsApp</span>
            <textarea rows="5" formControlName="whatsAppReturnMessage"></textarea>
            @if (isInvalid('whatsAppReturnMessage')) {
              <small>Use no máximo 1000 caracteres.</small>
            } @else {
              <small class="field-hint">Se não for preenchida, nenhuma mensagem de retorno será enviada.</small>
            }
          </label>

          <label class="field">
            <span>Recorrência da mensagem de retorno</span>
            <select formControlName="whatsAppReturnMessageCadence">
              <option value="Daily">Diária</option>
              <option value="Weekly">Semanal</option>
              <option value="Monthly">Mensal</option>
            </select>
            <small>Considera sempre o último pedido confirmado do cliente na unidade.</small>
          </label>

          <section class="theme-picker full-span">
            <div class="theme-picker__heading">
              <div>
                <span>Tema do cardápio</span>
                <small>Escolha uma paleta pronta para o cardápio público desta unidade.</small>
              </div>
            </div>
            <div class="theme-grid">
              @for (theme of storefrontThemes; track theme.id) {
                <button
                  type="button"
                  class="theme-option"
                  [class.selected]="form.controls.storefrontTheme.value === theme.id"
                  [style.--theme-primary]="theme.primary"
                  [style.--theme-hover]="theme.hover"
                  [style.--theme-soft]="theme.soft"
                  (click)="selectStorefrontTheme(theme.id)"
                >
                  <span class="theme-option__topline">
                    <strong>{{ theme.name }}</strong>
                    <span class="theme-swatches" aria-hidden="true">
                      <i [style.background]="theme.primary"></i>
                      <i [style.background]="theme.hover"></i>
                      <i [style.background]="theme.soft"></i>
                    </span>
                  </span>
                  <span class="theme-option__description">{{ theme.description }}</span>
                  <span class="theme-preview" aria-hidden="true">
                    <span class="theme-preview__tab">Lanches</span>
                    <span class="theme-preview__card">
                      <span>
                        <strong>Produto destaque</strong>
                        <small>A partir de R$ 24,00</small>
                      </span>
                      <span class="theme-preview__button">Adicionar</span>
                    </span>
                  </span>
                </button>
              }
            </div>
          </section>

          <label class="field">
            <span>Status</span>
            <select formControlName="status">
              <option value="Active">Ativa</option>
              <option value="Inactive">Inativa</option>
            </select>
          </label>

          <div class="button-row form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="saving || !tenantControl.value">
              {{ saving ? 'Salvando...' : editingBusinessUnitId ? 'Salvar edição' : 'Cadastrar unidade' }}
            </button>
            <button class="btn" type="button" (click)="cancelEdit()" [disabled]="saving">
              Cancelar
            </button>
          </div>
        </form>
        </section>
      </div>
      }

      <section class="card">
        <div class="section-heading">
          <div>
            <h2>Unidades cadastradas</h2>
            <p>Filtro ativo: {{ selectedTenantName || 'selecione uma empresa' }}.</p>
          </div>
          <label class="field list-search">
            <span>Buscar</span>
            <input type="search" [formControl]="searchControl" placeholder="Unidade, cardapio, telefone ou endereco" />
          </label>
        </div>

        @if (!tenantControl.value) {
          <p class="muted">Selecione uma empresa para listar unidades.</p>
        } @else if (loading) {
          <p class="muted">Carregando unidades...</p>
        } @else if (businessUnits.length === 0) {
          <p class="muted">Nenhuma unidade cadastrada para esta empresa.</p>
        } @else if (filteredBusinessUnits.length === 0) {
          <p class="muted">Nenhuma unidade encontrada para a busca.</p>
        } @else {
          <table class="table responsive-table">
            <thead>
              <tr>
                <th>Unidade</th>
                <th>Telefone</th>
                <th>Endereço</th>
                <th>Cardapio</th>
                <th>Tema</th>
                <th>Taxa entrega</th>
                <th>Boas-vindas</th>
                <th>Retorno</th>
                <th>Status</th>
                <th>WhatsApp</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              @for (unit of filteredBusinessUnits; track unit.id) {
                <tr>
                  <td data-label="Unidade">{{ unit.name }}</td>
                  <td data-label="Telefone">{{ unit.phone || '-' }}</td>
                  <td data-label="Endereco">{{ unit.address || '-' }}</td>
                  <td data-label="Cardapio">
                    @if (publicMenuUrl(unit)) {
                      <a [href]="publicMenuUrl(unit)" target="_blank" rel="noopener">{{ publicMenuHost(unit) }}</a>
                    } @else {
                      <span class="muted">Nao publicado</span>
                    }
                  </td>
                  <td data-label="Tema"><span class="status-pill">{{ themeName(unit.storefrontTheme) }}</span></td>
                  <td data-label="Taxa entrega">{{ formatCurrency(unit.fixedDeliveryFee) }}</td>
                  <td data-label="Boas-vindas">
                    @if (hasCustomWelcomeMessage(unit)) {
                      <span class="status-pill">Personalizada</span>
                    } @else {
                      <span class="muted">Padrão</span>
                    }
                  </td>
                  <td data-label="Retorno">
                    @if (hasReturnMessage(unit)) {
                      <span class="status-pill">{{ cadenceLabel(unit.whatsAppReturnMessageCadence) }}</span>
                    } @else {
                      <span class="muted">Desativada</span>
                    }
                  </td>
                  <td data-label="Status"><span class="status-pill">{{ statusLabel(unit.status) }}</span></td>
                  <td data-label="WhatsApp">
                    <div class="whatsapp-cell">
                      <span class="status-pill">{{ whatsappStatusLabel(unit.id) }}</span>
                      @if (whatsappChannels[unit.id]?.instanceId) {
                        <small>{{ whatsappChannels[unit.id]?.instanceId }}</small>
                      }
                      @if (whatsappQrCodeSource(unit.id)) {
                        <img class="qr-code" [src]="whatsappQrCodeSource(unit.id)" alt="QR Code do WhatsApp" />
                      } @else if (hasWhatsAppQrCode(unit.id)) {
                        <small class="qr-code-error">QR Code recebido em formato não suportado para imagem.</small>
                      }
                    </div>
                  </td>
                  <td data-label="Acao">
                    <div class="button-row">
                      <button class="btn btn-small" type="button" (click)="startEdit(unit)">
                        Editar
                      </button>
                      <button
                        class="btn btn-small"
                        type="button"
                        (click)="connectWhatsApp(unit)"
                        [disabled]="connectingWhatsAppId === unit.id"
                      >
                        {{ connectingWhatsAppId === unit.id ? 'Gerando...' : 'Conectar WhatsApp' }}
                      </button>
                      <button
                        class="btn btn-small"
                        type="button"
                        (click)="refreshWhatsAppStatus(unit)"
                        [disabled]="loadingWhatsAppStatusId === unit.id || !whatsappChannels[unit.id]"
                      >
                        Status
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </section>
  `
})
export class BusinessUnitsPage {
  protected readonly defaultWhatsAppWelcomeMessage = 'Ola! Este e o atendimento automatico da loja. Eu posso ajudar a montar seu pedido, validar itens do cardapio, anotar entrega ou retirada e chamar uma pessoa da equipe quando for necessario. Me diga o que voce gostaria de pedir.';
  private readonly publicMenuBaseDomain = 'comandia.com.br';
  protected readonly storefrontThemes: StorefrontThemeOption[] = [
    {
      id: 'indigo',
      name: 'Índigo',
      description: 'Destaque azul-violeta, moderno e versátil.',
      primary: '#4F46E5',
      hover: '#4338CA',
      soft: '#EEF2FF'
    },
    {
      id: 'rubi',
      name: 'Rubi',
      description: 'Rosa avermelhado com presença forte.',
      primary: '#E11D48',
      hover: '#BE123C',
      soft: '#FFF1F2'
    },
    {
      id: 'ambar',
      name: 'Âmbar',
      description: 'Dourado quente com sensação acolhedora.',
      primary: '#B45309',
      hover: '#92400E',
      soft: '#FFFBEB'
    },
    {
      id: 'esmeralda',
      name: 'Esmeralda',
      description: 'Verde fresco, leve e natural.',
      primary: '#059669',
      hover: '#047857',
      soft: '#ECFDF5'
    },
    {
      id: 'oceano',
      name: 'Oceano',
      description: 'Azul claro, limpo e confiável.',
      primary: '#0284C7',
      hover: '#0369A1',
      soft: '#F0F9FF'
    },
    {
      id: 'violeta',
      name: 'Violeta',
      description: 'Roxo vibrante com toque contemporâneo.',
      primary: '#7C3AED',
      hover: '#6D28D9',
      soft: '#F5F3FF'
    }
  ];
  protected readonly tenantControl = new FormControl('', { nonNullable: true });
  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    phone: new FormControl<string | null>(null, { validators: [Validators.maxLength(32)] }),
    publicSlug: new FormControl<string | null>(null, {
      validators: [
        Validators.minLength(3),
        Validators.maxLength(63),
        Validators.pattern(/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/)
      ]
    }),
    address: new FormControl<string | null>(null, { validators: [Validators.maxLength(240)] }),
    fixedDeliveryFee: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    whatsAppWelcomeMessage: new FormControl<string | null>(null, { validators: [Validators.maxLength(1000)] }),
    whatsAppReturnMessage: new FormControl<string | null>(null, { validators: [Validators.maxLength(1000)] }),
    whatsAppReturnMessageCadence: new FormControl<WhatsAppReturnMessageCadence>('Monthly', { nonNullable: true, validators: [Validators.required] }),
    storefrontTheme: new FormControl<StorefrontTheme>('indigo', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<EntityStatus>('Active', { nonNullable: true, validators: [Validators.required] })
  });
  protected readonly searchControl = new FormControl('', { nonNullable: true });

  protected tenants: TenantListItem[] = [];
  protected businessUnits: BusinessUnitListItem[] = [];
  protected whatsappChannels: Record<string, BusinessUnitWhatsAppChannel> = {};
  protected editingBusinessUnitId: string | null = null;
  protected isEditorOpen = false;
  protected loading = false;
  protected saving = false;
  protected connectingWhatsAppId: string | null = null;
  protected loadingWhatsAppStatusId: string | null = null;
  protected successMessage = '';
  protected errorMessage = '';

  constructor(
    private readonly tenantsApi: TenantsApiService,
    private readonly businessUnitsApi: BusinessUnitsApiService,
    protected readonly authSession: AuthSessionService
  ) {
    this.loadTenants();
    this.tenantControl.valueChanges.subscribe(() => {
      this.cancelEdit();
      this.loadBusinessUnits();
    });
  }

  protected get selectedTenantName(): string {
    const tenant = this.tenants.find((item) => item.id === this.tenantControl.value);
    return tenant?.tradeName || tenant?.name || '';
  }

  protected loadTenants(): void {
    this.tenantsApi.list().subscribe({
      next: (result) => {
        this.tenants = this.filterTenantsByScope(result.items);
        this.syncTenantSelection();
      },
      error: (failure: ApiFailure) => {
        this.errorMessage = failure.error.message;
      }
    });
  }

  protected loadBusinessUnits(): void {
    const tenantId = this.tenantControl.value;
    this.businessUnits = [];
    this.whatsappChannels = {};

    if (!tenantId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.businessUnitsApi.list(tenantId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          this.businessUnits = this.filterBusinessUnitsByScope(result.items);
          this.loadWhatsAppChannels(this.businessUnits);
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
  }

  protected submit(): void {
    if (!this.canEditBusinessUnits()) {
      this.errorMessage = 'Seu usuario nao tem permissao para alterar unidades.';
      return;
    }

    const tenantId = this.tenantControl.value;
    if (!tenantId) {
      this.errorMessage = 'Selecione uma empresa antes de salvar a unidade.';
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request = this.buildRequest();
    const save = this.editingBusinessUnitId
      ? this.businessUnitsApi.update(tenantId, this.editingBusinessUnitId, request)
      : this.businessUnitsApi.create(tenantId, request);

    save.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.successMessage = this.editingBusinessUnitId ? 'Unidade atualizada com sucesso.' : 'Unidade cadastrada com sucesso.';
        this.cancelEdit();
        this.loadBusinessUnits();
      },
      error: (failure: ApiFailure) => {
        this.errorMessage = failure.error.message;
      }
    });
  }

  protected openCreate(): void {
    this.cancelEdit();
    this.isEditorOpen = true;
  }

  protected get filteredBusinessUnits(): BusinessUnitListItem[] {
    const term = this.searchControl.value.trim().toLowerCase();
    if (!term) {
      return this.businessUnits;
    }

    return this.businessUnits.filter((unit) =>
      unit.name.toLowerCase().includes(term) ||
      (unit.publicSlug ?? '').toLowerCase().includes(term) ||
      (unit.phone ?? '').toLowerCase().includes(term) ||
      (unit.address ?? '').toLowerCase().includes(term));
  }

  protected startEdit(unit: BusinessUnitListItem): void {
    if (!this.canEditBusinessUnits()) {
      this.errorMessage = 'Seu usuario nao tem permissao para editar unidades.';
      return;
    }

    this.editingBusinessUnitId = unit.id;
    this.form.setValue({
      name: unit.name,
      phone: unit.phone ?? null,
      publicSlug: unit.publicSlug ?? null,
      address: unit.address ?? null,
      fixedDeliveryFee: unit.fixedDeliveryFee,
      whatsAppWelcomeMessage: unit.whatsAppWelcomeMessage ?? null,
      whatsAppReturnMessage: unit.whatsAppReturnMessage ?? null,
      whatsAppReturnMessageCadence: unit.whatsAppReturnMessageCadence ?? 'Monthly',
      storefrontTheme: unit.storefrontTheme ?? 'indigo',
      status: unit.status
    });
    this.isEditorOpen = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  protected cancelEdit(): void {
    this.editingBusinessUnitId = null;
    this.isEditorOpen = false;
    this.form.reset({
      name: '',
      phone: null,
      publicSlug: null,
      address: null,
      fixedDeliveryFee: 0,
      whatsAppWelcomeMessage: null,
      whatsAppReturnMessage: null,
      whatsAppReturnMessageCadence: 'Monthly',
      storefrontTheme: 'indigo',
      status: 'Active'
    });
  }

  protected isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  protected statusLabel(status: EntityStatus): string {
    return status === 'Active' ? 'Ativa' : 'Inativa';
  }

  protected selectStorefrontTheme(theme: StorefrontTheme): void {
    this.form.controls.storefrontTheme.setValue(theme);
    this.form.controls.storefrontTheme.markAsDirty();
  }

  protected themeName(theme: StorefrontTheme | null | undefined): string {
    return this.storefrontThemes.find((option) => option.id === theme)?.name ?? 'Índigo';
  }

  protected connectWhatsApp(unit: BusinessUnitListItem): void {
    const tenantId = this.tenantControl.value;
    if (!tenantId) {
      return;
    }

    this.connectingWhatsAppId = unit.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.businessUnitsApi.connectWhatsApp(tenantId, unit.id)
      .pipe(finalize(() => (this.connectingWhatsAppId = null)))
      .subscribe({
        next: (channel) => {
          this.whatsappChannels = {
            ...this.whatsappChannels,
            [unit.id]: channel
          };
          this.successMessage = this.isWhatsAppOpen(channel)
            ? 'WhatsApp conectado para a unidade.'
            : 'Instância criada. Escaneie o QR Code para conectar o WhatsApp.';
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
  }

  protected refreshWhatsAppStatus(unit: BusinessUnitListItem): void {
    const tenantId = this.tenantControl.value;
    if (!tenantId) {
      return;
    }

    this.loadingWhatsAppStatusId = unit.id;
    this.errorMessage = '';

    this.businessUnitsApi.getWhatsAppStatus(tenantId, unit.id)
      .pipe(finalize(() => (this.loadingWhatsAppStatusId = null)))
      .subscribe({
        next: (channel) => {
          this.whatsappChannels = {
            ...this.whatsappChannels,
            [unit.id]: this.mergeWhatsAppChannel(unit.id, channel)
          };
        },
        error: (failure: ApiFailure) => {
          this.errorMessage = failure.error.message;
        }
      });
  }

  protected whatsappStatusLabel(unitId: string): string {
    const channel = this.whatsappChannels[unitId];
    if (!channel) {
      return 'Não configurado';
    }

    if (this.isWhatsAppOpen(channel)) {
      return 'Conectado';
    }

    if (channel.qrCode) {
      return 'Aguardando QR Code';
    }

    return channel.connectionStatus || 'Pendente';
  }

  protected hasWhatsAppQrCode(unitId: string): boolean {
    return Boolean(this.whatsappChannels[unitId]?.qrCode?.trim());
  }

  protected whatsappQrCodeSource(unitId: string): string | null {
    const qrCode = this.whatsappChannels[unitId]?.qrCode;
    if (!qrCode) {
      return null;
    }

    return this.normalizeQrCodeImageSource(qrCode);
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  protected get publicSlugPreview(): string {
    const slug = this.form.controls.publicSlug.value?.trim();
    return slug ? `${slug}.${this.publicMenuBaseDomain}` : `exemplo.${this.publicMenuBaseDomain}`;
  }

  protected publicMenuHost(unit: BusinessUnitListItem): string {
    return unit.publicSlug ? `${unit.publicSlug}.${this.publicMenuBaseDomain}` : '';
  }

  protected publicMenuUrl(unit: BusinessUnitListItem): string {
    const host = this.publicMenuHost(unit);
    return host ? `https://${host}` : '';
  }

  private buildRequest(): BusinessUnitCreateRequest {
    const value = this.form.getRawValue();
    const phone = value.phone?.trim();
    const publicSlug = value.publicSlug?.trim();
    const address = value.address?.trim();
    const whatsAppWelcomeMessage = value.whatsAppWelcomeMessage?.trim();
    const whatsAppReturnMessage = value.whatsAppReturnMessage?.trim();

    return {
      name: value.name.trim(),
      phone: phone ? phone : null,
      publicSlug: publicSlug ? publicSlug : null,
      address: address ? address : null,
      fixedDeliveryFee: Number(value.fixedDeliveryFee),
      whatsAppWelcomeMessage: whatsAppWelcomeMessage ? whatsAppWelcomeMessage : null,
      whatsAppReturnMessage: whatsAppReturnMessage ? whatsAppReturnMessage : null,
      whatsAppReturnMessageCadence: value.whatsAppReturnMessageCadence,
      storefrontTheme: value.storefrontTheme,
      status: value.status
    };
  }

  protected hasCustomWelcomeMessage(unit: BusinessUnitListItem): boolean {
    return Boolean(unit.whatsAppWelcomeMessage?.trim());
  }

  protected hasReturnMessage(unit: BusinessUnitListItem): boolean {
    return Boolean(unit.whatsAppReturnMessage?.trim());
  }

  protected cadenceLabel(cadence: WhatsAppReturnMessageCadence): string {
    switch (cadence) {
      case 'Daily':
        return 'Diária';
      case 'Weekly':
        return 'Semanal';
      default:
        return 'Mensal';
    }
  }

  private loadWhatsAppChannels(units: BusinessUnitListItem[]): void {
    const tenantId = this.tenantControl.value;
    if (!tenantId) {
      return;
    }

    for (const unit of units) {
      this.businessUnitsApi.getWhatsApp(tenantId, unit.id).subscribe({
        next: (channel) => {
          this.whatsappChannels = {
            ...this.whatsappChannels,
            [unit.id]: channel
          };
        },
        error: () => {
          // Unidade sem canal configurado ainda.
        }
      });
    }
  }

  protected tenantSelectionLocked(): boolean {
    return Boolean(this.authSession.user()?.tenantId);
  }

  protected canEditBusinessUnits(): boolean {
    return this.authSession.isSystemAdmin() || this.authSession.isCompanyAdmin();
  }

  private syncTenantSelection(): void {
    const scopedTenantId = this.authSession.user()?.tenantId;
    if (scopedTenantId) {
      this.tenantControl.setValue(scopedTenantId);
      return;
    }

    if (!this.tenantControl.value && this.tenants.length === 1) {
      this.tenantControl.setValue(this.tenants[0].id);
    }
  }

  private filterTenantsByScope(tenants: TenantListItem[]): TenantListItem[] {
    const scopedTenantId = this.authSession.user()?.tenantId;
    return scopedTenantId ? tenants.filter((tenant) => tenant.id === scopedTenantId) : tenants;
  }

  private filterBusinessUnitsByScope(units: BusinessUnitListItem[]): BusinessUnitListItem[] {
    const scopedBusinessUnitId = this.authSession.user()?.businessUnitId;
    return scopedBusinessUnitId ? units.filter((unit) => unit.id === scopedBusinessUnitId) : units;
  }

  private isWhatsAppOpen(channel: BusinessUnitWhatsAppChannel): boolean {
    return channel.connectionStatus.toLowerCase() === 'open';
  }

  private mergeWhatsAppChannel(unitId: string, channel: BusinessUnitWhatsAppChannel): BusinessUnitWhatsAppChannel {
    const previous = this.whatsappChannels[unitId];
    if (!previous || channel.qrCode || this.isWhatsAppOpen(channel)) {
      return channel;
    }

    return {
      ...channel,
      qrCode: previous.qrCode
    };
  }

  private normalizeQrCodeImageSource(qrCode: string): string | null {
    const value = qrCode.trim().replace(/^["']|["']$/g, '');
    if (!value) {
      return null;
    }

    if (/^data:image\//i.test(value) || /^(https?:|blob:)/i.test(value)) {
      return value;
    }

    if (value.startsWith('<svg')) {
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(value)}`;
    }

    const base64Value = value.replace(/^base64,/i, '').replace(/\s/g, '');
    if (!this.looksLikeBase64Image(base64Value)) {
      return null;
    }

    return `data:image/${this.detectBase64ImageType(base64Value)};base64,${base64Value}`;
  }

  private looksLikeBase64Image(value: string): boolean {
    return value.length > 24 &&
      value.length % 4 === 0 &&
      /^[A-Za-z0-9+/]+={0,2}$/.test(value) &&
      /^(iVBORw0KGgo|\/9j\/|R0lGOD|UklGR)/.test(value);
  }

  private detectBase64ImageType(value: string): 'png' | 'jpeg' | 'gif' | 'webp' {
    if (value.startsWith('/9j/')) {
      return 'jpeg';
    }

    if (value.startsWith('R0lGOD')) {
      return 'gif';
    }

    if (value.startsWith('UklGR')) {
      return 'webp';
    }

    return 'png';
  }
}

interface StorefrontThemeOption {
  id: StorefrontTheme;
  name: string;
  description: string;
  primary: string;
  hover: string;
  soft: string;
}
