import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { map } from 'rxjs';

import { AdminRole } from '@shared/models/auth.models';

import { AuthSessionService } from './auth-session.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthSessionService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return roleResult(auth, router, route.data['roles'] as AdminRole[] | undefined);
  }

  if (auth.hasCheckedSession()) {
    return loginTree(router, state.url);
  }

  return auth.loadSession().pipe(
    map((isAuthenticated) => (
      isAuthenticated
        ? roleResult(auth, router, route.data['roles'] as AdminRole[] | undefined)
        : loginTree(router, state.url)
    ))
  );
};

function loginTree(router: Router, returnUrl: string): UrlTree {
  return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
}

function roleResult(auth: AuthSessionService, router: Router, roles: AdminRole[] | undefined): true | UrlTree {
  return auth.hasAnyRole(roles ?? []) ? true : router.createUrlTree(['/']);
}
