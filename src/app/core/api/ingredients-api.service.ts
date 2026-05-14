import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';
import {
  IngredientCreateRequest,
  IngredientListItem,
  IngredientUpdateRequest
} from '@shared/models/catalog.models';
import { PagedResult } from '@shared/models/common.models';

import { ApiEndpoints } from './api-endpoints';

@Injectable({ providedIn: 'root' })
export class IngredientsApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  list(tenantId: string, businessUnitId: string): Observable<PagedResult<IngredientListItem>> {
    return this.http.get<PagedResult<IngredientListItem>>(this.url(ApiEndpoints.ingredients.list(tenantId, businessUnitId)));
  }

  create(tenantId: string, businessUnitId: string, request: IngredientCreateRequest): Observable<IngredientListItem> {
    return this.http.post<IngredientListItem>(this.url(ApiEndpoints.ingredients.list(tenantId, businessUnitId)), request);
  }

  update(
    tenantId: string,
    businessUnitId: string,
    ingredientId: string,
    request: IngredientUpdateRequest
  ): Observable<IngredientListItem> {
    return this.http.put<IngredientListItem>(
      this.url(ApiEndpoints.ingredients.detail(tenantId, businessUnitId, ingredientId)),
      request
    );
  }

  private url(path: string): string {
    return this.config.buildUrl(path);
  }
}
