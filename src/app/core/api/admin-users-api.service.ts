import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';
import {
  AdminUser,
  CreateAdminUserRequest,
  SetAdminUserPasswordRequest,
  UpdateAdminUserRequest
} from '@shared/models/auth.models';
import { PagedResult } from '@shared/models/common.models';

import { ApiEndpoints } from './api-endpoints';

@Injectable({ providedIn: 'root' })
export class AdminUsersApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  list(): Observable<PagedResult<AdminUser>> {
    return this.http.get<PagedResult<AdminUser>>(this.url(ApiEndpoints.adminUsers.list));
  }

  create(request: CreateAdminUserRequest): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.url(ApiEndpoints.adminUsers.list), request);
  }

  update(userId: string, request: UpdateAdminUserRequest): Observable<AdminUser> {
    return this.http.put<AdminUser>(this.url(ApiEndpoints.adminUsers.detail(userId)), request);
  }

  setPassword(userId: string, request: SetAdminUserPasswordRequest): Observable<void> {
    return this.http.put<void>(this.url(ApiEndpoints.adminUsers.password(userId)), request);
  }

  deactivate(userId: string): Observable<void> {
    return this.http.delete<void>(this.url(ApiEndpoints.adminUsers.detail(userId)));
  }

  private url(path: string): string {
    return this.config.buildUrl(path);
  }
}
