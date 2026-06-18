import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';
import { PagedResult } from '@shared/models/common.models';
import {
  CloseOperatorConversationRequest,
  EnableConversationHandoffRequest,
  OperatorConversationDetail,
  SendOperatorConversationMessageRequest,
  OperatorConversationSummary
} from '@shared/models/operator-conversations.models';

import { ApiEndpoints } from './api-endpoints';

@Injectable({ providedIn: 'root' })
export class OperatorConversationsApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  list(tenantId: string, businessUnitId: string): Observable<PagedResult<OperatorConversationSummary>> {
    return this.http.get<PagedResult<OperatorConversationSummary>>(
      this.url(ApiEndpoints.operatorConversations.list(tenantId, businessUnitId))
    );
  }

  detail(tenantId: string, businessUnitId: string, conversationId: string): Observable<OperatorConversationDetail> {
    return this.http.get<OperatorConversationDetail>(
      this.url(ApiEndpoints.operatorConversations.detail(tenantId, businessUnitId, conversationId))
    );
  }

  enableHandoff(
    tenantId: string,
    businessUnitId: string,
    conversationId: string,
    request: EnableConversationHandoffRequest = {}
  ): Observable<OperatorConversationSummary> {
    return this.http.post<OperatorConversationSummary>(
      this.url(ApiEndpoints.operatorConversations.handoff(tenantId, businessUnitId, conversationId)),
      request
    );
  }

  disableHandoff(tenantId: string, businessUnitId: string, conversationId: string): Observable<OperatorConversationSummary> {
    return this.http.delete<OperatorConversationSummary>(
      this.url(ApiEndpoints.operatorConversations.handoff(tenantId, businessUnitId, conversationId))
    );
  }

  close(
    tenantId: string,
    businessUnitId: string,
    conversationId: string,
    request: CloseOperatorConversationRequest = {}
  ): Observable<void> {
    return this.http.post<void>(
      this.url(ApiEndpoints.operatorConversations.close(tenantId, businessUnitId, conversationId)),
      request
    );
  }

  sendMessage(
    tenantId: string,
    businessUnitId: string,
    conversationId: string,
    request: SendOperatorConversationMessageRequest
  ): Observable<OperatorConversationDetail> {
    return this.http.post<OperatorConversationDetail>(
      this.url(ApiEndpoints.operatorConversations.messages(tenantId, businessUnitId, conversationId)),
      request
    );
  }

  private url(path: string): string {
    return this.config.buildUrl(path);
  }
}
