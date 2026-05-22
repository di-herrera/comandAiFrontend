import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthSessionService } from '@core/auth/auth-session.service';
import { ApiConfigService } from '@core/config/api-config.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const config = inject(ApiConfigService);
  const auth = inject(AuthSessionService);
  const router = inject(Router);
  const isApiRequest = request.url.startsWith(config.baseUrl);
  const authRequest = isApiRequest ? request.clone({ withCredentials: true }) : request;

  return next(authRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (isApiRequest && isUnauthorized(error.status) && !request.url.includes('/api/auth/login')) {
        auth.clearSession();
        void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }

      return throwError(() => error);
    })
  );
};

function isUnauthorized(status: number): boolean {
  return status === 401 || status === 403;
}
