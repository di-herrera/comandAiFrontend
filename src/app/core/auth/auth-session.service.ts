import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';

import { AuthApiService } from '@core/api/auth-api.service';
import { AdminLoginRequest, AdminRole, AdminSession } from '@shared/models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly authApi = inject(AuthApiService);
  private readonly sessionState = signal<AdminSession | null>(null);
  private readonly checkedState = signal(false);

  readonly session = this.sessionState.asReadonly();
  readonly user = computed(() => this.sessionState()?.user ?? null);
  readonly isAuthenticated = computed(() => !!this.sessionState()?.user);
  readonly roles = computed(() => this.user()?.roles ?? []);
  readonly isSystemAdmin = computed(() => this.hasRole('SystemAdmin'));
  readonly isCompanyAdmin = computed(() => this.hasRole('CompanyAdmin'));
  readonly isUnitAdmin = computed(() => this.hasRole('UnitAdmin'));
  readonly canManageTenants = computed(() => this.isSystemAdmin() || this.isCompanyAdmin());
  readonly canManageBusinessUnits = computed(() => this.isSystemAdmin() || this.isCompanyAdmin() || this.isUnitAdmin());
  readonly canManageUsers = computed(() => this.isSystemAdmin() || this.isCompanyAdmin());
  readonly canUseChatSimulator = computed(() => this.isSystemAdmin());
  readonly hasCheckedSession = this.checkedState.asReadonly();

  hasRole(role: AdminRole): boolean {
    return this.roles().includes(role);
  }

  hasAnyRole(roles: AdminRole[]): boolean {
    if (roles.length === 0) {
      return true;
    }

    return roles.some((role) => this.hasRole(role));
  }

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
