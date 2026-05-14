import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';
import {
  SimulateMessageRequest,
  SimulateMessageResult
} from '@shared/models/chat-simulator.models';

import { ApiEndpoints } from './api-endpoints';

@Injectable({ providedIn: 'root' })
export class ChatSimulatorApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  send(request: SimulateMessageRequest): Observable<SimulateMessageResult> {
    return this.http.post<SimulateMessageResult>(
      this.config.buildUrl(ApiEndpoints.dev.simulateMessage),
      request
    );
  }
}
