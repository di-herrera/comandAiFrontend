import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';
import {
  ProductCategoryCreateRequest,
  ProductCategoryListItem,
  ProductCategoryUpdateRequest
} from '@shared/models/catalog.models';
import { PagedResult } from '@shared/models/common.models';

import { ApiEndpoints } from './api-endpoints';

@Injectable({ providedIn: 'root' })
export class ProductCategoriesApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  list(tenantId: string, businessUnitId: string): Observable<PagedResult<ProductCategoryListItem>> {
    return this.http.get<PagedResult<ProductCategoryListItem>>(this.url(ApiEndpoints.productCategories.list(tenantId, businessUnitId)));
  }

  create(tenantId: string, businessUnitId: string, request: ProductCategoryCreateRequest): Observable<ProductCategoryListItem> {
    return this.http.post<ProductCategoryListItem>(this.url(ApiEndpoints.productCategories.list(tenantId, businessUnitId)), request);
  }

  update(
    tenantId: string,
    businessUnitId: string,
    categoryId: string,
    request: ProductCategoryUpdateRequest
  ): Observable<ProductCategoryListItem> {
    return this.http.put<ProductCategoryListItem>(
      this.url(ApiEndpoints.productCategories.detail(tenantId, businessUnitId, categoryId)),
      request
    );
  }

  private url(path: string): string {
    return this.config.buildUrl(path);
  }
}
