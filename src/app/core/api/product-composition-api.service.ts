import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';
import {
  ProductComposition,
  ProductCompositionUpdateRequest
} from '@shared/models/catalog.models';

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

  private url(path: string): string {
    return this.config.buildUrl(path);
  }
}
