import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';
import {
  OptionGroup,
  OptionGroupRequest,
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

  listOptionGroups(tenantId: string, businessUnitId: string, categoryId: string): Observable<PagedResult<OptionGroup>> {
    return this.http.get<PagedResult<OptionGroup>>(
      this.url(ApiEndpoints.productCategories.optionGroups(tenantId, businessUnitId, categoryId))
    );
  }

  listReusableOptionGroups(tenantId: string, businessUnitId: string): Observable<PagedResult<OptionGroup>> {
    return this.http.get<PagedResult<OptionGroup>>(
      this.url(ApiEndpoints.optionGroups.list(tenantId, businessUnitId))
    );
  }

  createOptionGroup(
    tenantId: string,
    businessUnitId: string,
    request: OptionGroupRequest
  ): Observable<OptionGroup> {
    return this.http.post<OptionGroup>(
      this.url(ApiEndpoints.optionGroups.list(tenantId, businessUnitId)),
      request
    );
  }

  updateOptionGroup(
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

  linkOptionGroup(tenantId: string, businessUnitId: string, categoryId: string, optionGroupId: string): Observable<OptionGroup> {
    return this.http.post<OptionGroup>(
      this.url(ApiEndpoints.productCategories.optionGroup(tenantId, businessUnitId, categoryId, optionGroupId)),
      null
    );
  }

  deleteOptionGroup(tenantId: string, businessUnitId: string, categoryId: string, optionGroupId: string): Observable<void> {
    return this.http.delete<void>(
      this.url(ApiEndpoints.productCategories.optionGroup(tenantId, businessUnitId, categoryId, optionGroupId))
    );
  }

  private url(path: string): string {
    return this.config.buildUrl(path);
  }
}
