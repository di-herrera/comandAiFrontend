import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';
import {
  ProductOptionCreateRequest,
  ProductOptionListItem,
  ProductOptionUpdateRequest
} from '@shared/models/catalog.models';
import { PagedResult } from '@shared/models/common.models';

import { ApiEndpoints } from './api-endpoints';

@Injectable({ providedIn: 'root' })
export class OptionsApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  list(tenantId: string, businessUnitId: string): Observable<PagedResult<ProductOptionListItem>> {
    return this.http.get<PagedResult<ProductOptionListItem>>(this.url(ApiEndpoints.options.list(tenantId, businessUnitId)));
  }

  create(tenantId: string, businessUnitId: string, request: ProductOptionCreateRequest): Observable<ProductOptionListItem> {
    return this.http.post<ProductOptionListItem>(this.url(ApiEndpoints.options.list(tenantId, businessUnitId)), request);
  }

  update(
    tenantId: string,
    businessUnitId: string,
    optionId: string,
    request: ProductOptionUpdateRequest
  ): Observable<ProductOptionListItem> {
    return this.http.put<ProductOptionListItem>(
      this.url(ApiEndpoints.options.detail(tenantId, businessUnitId, optionId)),
      request
    );
  }

  private url(path: string): string {
    return this.config.buildUrl(path);
  }
}
