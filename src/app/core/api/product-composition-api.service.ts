import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';
import {
  ProductComposition,
  ProductCompositionUpdateRequest,
  ProductOptionGroup,
  ProductOptionGroupRequest
} from '@shared/models/catalog.models';
import { PagedResult } from '@shared/models/common.models';

import { ApiEndpoints } from './api-endpoints';

@Injectable({ providedIn: 'root' })
export class ProductCompositionApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  get(tenantId: string, businessUnitId: string, productId: string): Observable<ProductComposition> {
    return this.http.get<ProductComposition>(
      this.url(ApiEndpoints.products.composition(tenantId, businessUnitId, productId))
    );
  }

  update(
    tenantId: string,
    businessUnitId: string,
    productId: string,
    request: ProductCompositionUpdateRequest
  ): Observable<ProductComposition> {
    return this.http.put<ProductComposition>(
      this.url(ApiEndpoints.products.composition(tenantId, businessUnitId, productId)),
      request
    );
  }

  listOptionGroups(tenantId: string, businessUnitId: string, productId: string): Observable<PagedResult<ProductOptionGroup>> {
    return this.http.get<PagedResult<ProductOptionGroup>>(
      this.url(ApiEndpoints.products.optionGroups(tenantId, businessUnitId, productId))
    );
  }

  listCategoryOptionGroups(tenantId: string, businessUnitId: string, categoryId: string): Observable<PagedResult<ProductOptionGroup>> {
    return this.http.get<PagedResult<ProductOptionGroup>>(
      this.url(ApiEndpoints.productCategories.optionGroups(tenantId, businessUnitId, categoryId))
    );
  }

  listReusableOptionGroups(tenantId: string, businessUnitId: string): Observable<PagedResult<ProductOptionGroup>> {
    return this.http.get<PagedResult<ProductOptionGroup>>(
      this.url(ApiEndpoints.optionGroups.list(tenantId, businessUnitId))
    );
  }

  createOptionGroup(
    tenantId: string,
    businessUnitId: string,
    request: ProductOptionGroupRequest
  ): Observable<ProductOptionGroup> {
    return this.http.post<ProductOptionGroup>(
      this.url(ApiEndpoints.optionGroups.list(tenantId, businessUnitId)),
      request
    );
  }

  updateOptionGroup(
    tenantId: string,
    businessUnitId: string,
    optionGroupId: string,
    request: ProductOptionGroupRequest
  ): Observable<ProductOptionGroup> {
    return this.http.put<ProductOptionGroup>(
      this.url(ApiEndpoints.optionGroups.detail(tenantId, businessUnitId, optionGroupId)),
      request
    );
  }

  linkOptionGroup(tenantId: string, businessUnitId: string, productId: string, optionGroupId: string): Observable<ProductOptionGroup> {
    return this.http.post<ProductOptionGroup>(
      this.url(ApiEndpoints.products.optionGroup(tenantId, businessUnitId, productId, optionGroupId)),
      null
    );
  }

  linkCategoryOptionGroup(
    tenantId: string,
    businessUnitId: string,
    categoryId: string,
    optionGroupId: string
  ): Observable<ProductOptionGroup> {
    return this.http.post<ProductOptionGroup>(
      this.url(ApiEndpoints.productCategories.optionGroup(tenantId, businessUnitId, categoryId, optionGroupId)),
      null
    );
  }

  deleteOptionGroup(tenantId: string, businessUnitId: string, productId: string, optionGroupId: string): Observable<void> {
    return this.http.delete<void>(
      this.url(ApiEndpoints.products.optionGroup(tenantId, businessUnitId, productId, optionGroupId))
    );
  }

  deleteCategoryOptionGroup(tenantId: string, businessUnitId: string, categoryId: string, optionGroupId: string): Observable<void> {
    return this.http.delete<void>(
      this.url(ApiEndpoints.productCategories.optionGroup(tenantId, businessUnitId, categoryId, optionGroupId))
    );
  }

  private url(path: string): string {
    return this.config.buildUrl(path);
  }
}
