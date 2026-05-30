import { Injectable, computed, signal } from '@angular/core';

import { BusinessUnitsApiService } from '@core/api/business-units-api.service';
import { TenantsApiService } from '@core/api/tenants-api.service';
import { BusinessUnitListItem, TenantListItem } from '@shared/models/catalog.models';

const tenantStorageKey = 'comandia.admin.catalogContext.tenantId';
const businessUnitStorageKey = 'comandia.admin.catalogContext.businessUnitId';

@Injectable({ providedIn: 'root' })
export class CatalogContextService {
  readonly tenants = signal<TenantListItem[]>([]);
  readonly businessUnits = signal<BusinessUnitListItem[]>([]);
  readonly selectedTenantId = signal(this.readStorage(tenantStorageKey));
  readonly selectedBusinessUnitId = signal(this.readStorage(businessUnitStorageKey));
  readonly loadingTenants = signal(false);
  readonly loadingBusinessUnits = signal(false);
  readonly errorMessage = signal('');

  readonly selectedTenant = computed(() => {
    const tenantId = this.selectedTenantId();
    return this.tenants().find((tenant) => tenant.id === tenantId) ?? null;
  });

  readonly selectedBusinessUnit = computed(() => {
    const businessUnitId = this.selectedBusinessUnitId();
    return this.businessUnits().find((unit) => unit.id === businessUnitId) ?? null;
  });

  readonly selectedTenantName = computed(() => {
    const tenant = this.selectedTenant();
    return tenant?.tradeName || tenant?.name || '';
  });

  readonly selectedBusinessUnitName = computed(() => this.selectedBusinessUnit()?.name ?? '');
  readonly hasTenant = computed(() => Boolean(this.selectedTenantId()));
  readonly hasCatalogContext = computed(() => Boolean(this.selectedTenantId() && this.selectedBusinessUnitId()));

  constructor(
    private readonly tenantsApi: TenantsApiService,
    private readonly businessUnitsApi: BusinessUnitsApiService
  ) {
    this.loadTenants();
  }

  selectTenant(tenantId: string): void {
    if (tenantId === this.selectedTenantId()) {
      return;
    }

    this.selectedTenantId.set(tenantId);
    this.selectedBusinessUnitId.set('');
    this.writeStorage(tenantStorageKey, tenantId);
    this.writeStorage(businessUnitStorageKey, '');
    this.businessUnits.set([]);

    if (tenantId) {
      this.loadBusinessUnits(tenantId);
    }
  }

  selectBusinessUnit(businessUnitId: string): void {
    this.selectedBusinessUnitId.set(businessUnitId);
    this.writeStorage(businessUnitStorageKey, businessUnitId);
  }

  refresh(): void {
    this.loadTenants();
  }

  private loadTenants(): void {
    this.loadingTenants.set(true);
    this.errorMessage.set('');

    this.tenantsApi.list().subscribe({
      next: (result) => {
        this.tenants.set(result.items);
        this.loadingTenants.set(false);
        this.syncTenantSelection();
      },
      error: () => {
        this.loadingTenants.set(false);
        this.errorMessage.set('Nao foi possivel carregar as empresas.');
      }
    });
  }

  private loadBusinessUnits(tenantId: string): void {
    this.loadingBusinessUnits.set(true);
    this.errorMessage.set('');

    this.businessUnitsApi.list(tenantId).subscribe({
      next: (result) => {
        this.businessUnits.set(result.items);
        this.loadingBusinessUnits.set(false);
        this.syncBusinessUnitSelection();
      },
      error: () => {
        this.loadingBusinessUnits.set(false);
        this.errorMessage.set('Nao foi possivel carregar as unidades.');
      }
    });
  }

  private syncTenantSelection(): void {
    const tenantId = this.selectedTenantId();
    if (!tenantId) {
      this.businessUnits.set([]);
      return;
    }

    const tenantExists = this.tenants().some((tenant) => tenant.id === tenantId);
    if (!tenantExists) {
      this.selectTenant('');
      return;
    }

    this.loadBusinessUnits(tenantId);
  }

  private syncBusinessUnitSelection(): void {
    const businessUnitId = this.selectedBusinessUnitId();
    if (!businessUnitId) {
      return;
    }

    const businessUnitExists = this.businessUnits().some((unit) => unit.id === businessUnitId);
    if (!businessUnitExists) {
      this.selectBusinessUnit('');
    }
  }

  private readStorage(key: string): string {
    return localStorage.getItem(key) ?? '';
  }

  private writeStorage(key: string, value: string): void {
    if (value) {
      localStorage.setItem(key, value);
      return;
    }

    localStorage.removeItem(key);
  }
}
