import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiConfigService } from '@core/config/api-config.service';
import { CompositionGroup, CompositionGroupRequest } from '@shared/models/catalog.models';
import { PagedResult } from '@shared/models/common.models';
import { ApiEndpoints } from './api-endpoints';

@Injectable({ providedIn: 'root' })
export class CompositionGroupsApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);
  list(tenantId: string, businessUnitId: string): Observable<PagedResult<CompositionGroup>> {
    return this.http.get<PagedResult<CompositionGroup>>(this.config.buildUrl(ApiEndpoints.compositionGroups.list(tenantId, businessUnitId)));
  }
  create(tenantId: string, businessUnitId: string, request: CompositionGroupRequest): Observable<CompositionGroup> {
    return this.http.post<CompositionGroup>(this.config.buildUrl(ApiEndpoints.compositionGroups.list(tenantId, businessUnitId)), request);
  }
  update(tenantId: string, businessUnitId: string, id: string, request: CompositionGroupRequest): Observable<CompositionGroup> {
    return this.http.put<CompositionGroup>(this.config.buildUrl(ApiEndpoints.compositionGroups.detail(tenantId, businessUnitId, id)), request);
  }
}
