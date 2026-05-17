import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';
import { PagedResult } from '@shared/models/common.models';
import { OrderDetail, OrderListFilters, OrderSummary } from '@shared/models/orders.models';

import { ApiEndpoints } from './api-endpoints';

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  list(
    tenantId: string,
    businessUnitId: string,
    filters: OrderListFilters = {}
  ): Observable<PagedResult<OrderSummary>> {
    return this.http.get<PagedResult<OrderSummary>>(
      this.url(ApiEndpoints.orders.list(tenantId, businessUnitId)),
      { params: this.buildParams(filters) }
    );
  }

  detail(tenantId: string, businessUnitId: string, orderId: string): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(this.url(ApiEndpoints.orders.detail(tenantId, businessUnitId, orderId)));
  }

  private buildParams(filters: OrderListFilters): HttpParams {
    let params = new HttpParams();

    if (filters.status) {
      params = params.set('status', filters.status);
    }

    if (filters.createdFromUtc) {
      params = params.set('createdFromUtc', filters.createdFromUtc);
    }

    if (filters.createdToUtc) {
      params = params.set('createdToUtc', filters.createdToUtc);
    }

    const search = filters.search?.trim();
    if (search) {
      params = params.set('search', search);
    }

    return params;
  }

  private url(path: string): string {
    return this.config.buildUrl(path);
  }
}
