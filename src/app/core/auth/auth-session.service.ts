import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';

import { AuthApiService } from '@core/api/auth-api.service';
import { AdminLoginRequest, AdminSession } from '@shared/models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly authApi = inject(AuthApiService);
  private readonly sessionState = signal<AdminSession | null>(null);
  private readonly checkedState = signal(false);

  readonly session = this.sessionState.asReadonly();
  readonly user = computed(() => this.sessionState()?.user ?? null);
  readonly isAuthenticated = computed(() => !!this.sessionState()?.user);
  readonly hasCheckedSession = this.checkedState.asReadonly();

  loadSession(): Observable<boolean> {
    return this.authApi.session().pipe(
      tap((session) => this.setSession(session)),
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      })
    );
  }

  login(request: AdminLoginRequest): Observable<AdminSession> {
    return this.authApi.login(request).pipe(tap((session) => this.setSession(session)));
  }

  logout(): Observable<void> {
    return this.authApi.logout().pipe(tap(() => this.clearSession()));
  }

  clearSession(): void {
    this.sessionState.set(null);
    this.checkedState.set(true);
  }

  private setSession(session: AdminSession): void {
    this.sessionState.set(session);
    this.checkedState.set(true);
  }
}
