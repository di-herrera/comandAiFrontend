import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';
import {
  TenantCreateRequest,
  TenantListItem,
  TenantUpdateRequest
} from '@shared/models/catalog.models';
import { PagedResult } from '@shared/models/common.models';

import { ApiEndpoints } from './api-endpoints';

@Injectable({ providedIn: 'root' })
export class TenantsApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  list(): Observable<PagedResult<TenantListItem>> {
    return this.http.get<PagedResult<TenantListItem>>(this.url(ApiEndpoints.tenants.list));
  }

  get(tenantId: string): Observable<TenantListItem> {
    return this.http.get<TenantListItem>(this.url(ApiEndpoints.tenants.detail(tenantId)));
  }

  create(request: TenantCreateRequest): Observable<TenantListItem> {
    return this.http.post<TenantListItem>(this.url(ApiEndpoints.tenants.list), request);
  }

  update(tenantId: string, request: TenantUpdateRequest): Observable<TenantListItem> {
    return this.http.put<TenantListItem>(this.url(ApiEndpoints.tenants.detail(tenantId)), request);
  }

  private url(path: string): string {
    return this.config.buildUrl(path);
  }
}
