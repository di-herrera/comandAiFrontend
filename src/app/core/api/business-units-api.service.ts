import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';
import {
  BusinessUnitCreateRequest,
  BusinessUnitListItem,
  BusinessUnitWhatsAppChannel,
  BusinessUnitUpdateRequest
} from '@shared/models/catalog.models';
import { PagedResult } from '@shared/models/common.models';

import { ApiEndpoints } from './api-endpoints';

@Injectable({ providedIn: 'root' })
export class BusinessUnitsApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  list(tenantId: string): Observable<PagedResult<BusinessUnitListItem>> {
    return this.http.get<PagedResult<BusinessUnitListItem>>(this.url(ApiEndpoints.businessUnits.list(tenantId)));
  }

  create(tenantId: string, request: BusinessUnitCreateRequest): Observable<BusinessUnitListItem> {
    return this.http.post<BusinessUnitListItem>(this.url(ApiEndpoints.businessUnits.list(tenantId)), request);
  }

  update(tenantId: string, businessUnitId: string, request: BusinessUnitUpdateRequest): Observable<BusinessUnitListItem> {
    return this.http.put<BusinessUnitListItem>(
      this.url(ApiEndpoints.businessUnits.detail(tenantId, businessUnitId)),
      request
    );
  }

  getWhatsApp(tenantId: string, businessUnitId: string): Observable<BusinessUnitWhatsAppChannel> {
    return this.http.get<BusinessUnitWhatsAppChannel>(
      this.url(ApiEndpoints.businessUnits.whatsapp(tenantId, businessUnitId))
    );
  }

  connectWhatsApp(tenantId: string, businessUnitId: string): Observable<BusinessUnitWhatsAppChannel> {
    return this.http.post<BusinessUnitWhatsAppChannel>(
      this.url(ApiEndpoints.businessUnits.whatsappConnect(tenantId, businessUnitId)),
      {}
    );
  }

  getWhatsAppStatus(tenantId: string, businessUnitId: string): Observable<BusinessUnitWhatsAppChannel> {
    return this.http.get<BusinessUnitWhatsAppChannel>(
      this.url(ApiEndpoints.businessUnits.whatsappStatus(tenantId, businessUnitId))
    );
  }

  private url(path: string): string {
    return this.config.buildUrl(path);
  }
}
