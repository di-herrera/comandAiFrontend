import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';
import { AiInteractionFilters, AiInteractionListItem } from '@shared/models/ai-audit.models';
import { PagedResult } from '@shared/models/common.models';

import { ApiEndpoints } from './api-endpoints';

@Injectable({ providedIn: 'root' })
export class AiAuditApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  list(
    tenantId: string,
    businessUnitId: string,
    filters: AiInteractionFilters = {}
  ): Observable<PagedResult<AiInteractionListItem>> {
    return this.http.get<PagedResult<AiInteractionListItem>>(
      this.config.buildUrl(ApiEndpoints.aiAudit.list(tenantId, businessUnitId)),
      { params: this.buildParams(filters) }
    );
  }

  private buildParams(filters: AiInteractionFilters): HttpParams {
    let params = new HttpParams();

    if (filters.conversationId) {
      params = params.set('conversationId', filters.conversationId.trim());
    }

    if (filters.incomingMessageId) {
      params = params.set('incomingMessageId', filters.incomingMessageId.trim());
    }

    if (filters.parsedSuccessfully !== null && filters.parsedSuccessfully !== undefined) {
      params = params.set('parsedSuccessfully', String(filters.parsedSuccessfully));
    }

    if (filters.createdFromUtc) {
      params = params.set('createdFromUtc', filters.createdFromUtc);
    }

    if (filters.createdToUtc) {
      params = params.set('createdToUtc', filters.createdToUtc);
    }

    if (filters.page) {
      params = params.set('page', String(filters.page));
    }

    if (filters.pageSize) {
      params = params.set('pageSize', String(filters.pageSize));
    }

    return params;
  }
}
