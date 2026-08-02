import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';
import { AiPrompt, UpdateAiPromptRequest } from '@shared/models/ai-prompts.models';

import { ApiEndpoints } from './api-endpoints';

@Injectable({ providedIn: 'root' })
export class AiPromptsApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  getOrderInterpretation(): Observable<AiPrompt> {
    return this.http.get<AiPrompt>(
      this.config.buildUrl(ApiEndpoints.aiPrompts.orderInterpretation)
    );
  }

  updateOrderInterpretation(request: UpdateAiPromptRequest): Observable<AiPrompt> {
    return this.http.put<AiPrompt>(
      this.config.buildUrl(ApiEndpoints.aiPrompts.orderInterpretation),
      request
    );
  }
}
