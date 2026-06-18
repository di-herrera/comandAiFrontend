import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';
import { AdminLoginRequest, AdminSession } from '@shared/models/auth.models';

import { ApiEndpoints } from './api-endpoints';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  login(request: AdminLoginRequest): Observable<AdminSession> {
    return this.http.post<AdminSession>(this.url(ApiEndpoints.auth.login), request);
  }

  session(): Observable<AdminSession> {
    return this.http.get<AdminSession>(this.url(ApiEndpoints.auth.session));
  }

  logout(): Observable<void> {
    return this.http.post<void>(this.url(ApiEndpoints.auth.logout), {});
  }

  private url(path: string): string {
    return this.config.buildUrl(path);
  }
}
