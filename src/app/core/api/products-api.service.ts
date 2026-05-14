import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';
import {
  ProductCreateRequest,
  ProductListItem,
  ProductUpdateRequest
} from '@shared/models/catalog.models';
import { PagedResult } from '@shared/models/common.models';

import { ApiEndpoints } from './api-endpoints';

@Injectable({ providedIn: 'root' })
export class ProductsApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  list(tenantId: string, businessUnitId: string): Observable<PagedResult<ProductListItem>> {
    return this.http.get<PagedResult<ProductListItem>>(this.url(ApiEndpoints.products.list(tenantId, businessUnitId)));
  }

  create(tenantId: string, businessUnitId: string, request: ProductCreateRequest): Observable<ProductListItem> {
    return this.http.post<ProductListItem>(this.url(ApiEndpoints.products.list(tenantId, businessUnitId)), request);
  }

  update(
    tenantId: string,
    businessUnitId: string,
    productId: string,
    request: ProductUpdateRequest
  ): Observable<ProductListItem> {
    return this.http.put<ProductListItem>(
      this.url(ApiEndpoints.products.detail(tenantId, businessUnitId, productId)),
      request
    );
  }

  private url(path: string): string {
    return this.config.buildUrl(path);
  }
}
