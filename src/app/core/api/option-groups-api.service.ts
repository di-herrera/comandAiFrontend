import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';
import { OptionGroup, OptionGroupRequest } from '@shared/models/catalog.models';
import { PagedResult } from '@shared/models/common.models';

import { ApiEndpoints } from './api-endpoints';

@Injectable({ providedIn: 'root' })
export class OptionGroupsApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  list(tenantId: string, businessUnitId: string): Observable<PagedResult<OptionGroup>> {
    return this.http.get<PagedResult<OptionGroup>>(
      this.url(ApiEndpoints.optionGroups.list(tenantId, businessUnitId))
    );
  }

  create(tenantId: string, businessUnitId: string, request: OptionGroupRequest): Observable<OptionGroup> {
    return this.http.post<OptionGroup>(
      this.url(ApiEndpoints.optionGroups.list(tenantId, businessUnitId)),
      request
    );
  }

  update(
    tenantId: string,
    businessUnitId: string,
    optionGroupId: string,
    request: OptionGroupRequest
  ): Observable<OptionGroup> {
    return this.http.put<OptionGroup>(
      this.url(ApiEndpoints.optionGroups.detail(tenantId, businessUnitId, optionGroupId)),
      request
    );
  }

  delete(tenantId: string, businessUnitId: string, optionGroupId: string): Observable<void> {
    return this.http.delete<void>(
      this.url(ApiEndpoints.optionGroups.detail(tenantId, businessUnitId, optionGroupId))
    );
  }

  private url(path: string): string {
    return this.config.buildUrl(path);
  }
}
