import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { ApiError, ApiFailure } from '@shared/models/common.models';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const failure: ApiFailure = {
        status: error.status,
        url: error.url,
        error: normalizeApiError(error)
      };

      return throwError(() => failure);
    })
  );
};

function normalizeApiError(error: HttpErrorResponse): ApiError {
  if (isApiError(error.error)) {
    return error.error;
  }

  return {
    code: error.status ? `Http${error.status}` : 'NetworkError',
    message: error.message || 'Não foi possível concluir a requisição.'
  };
}

function isApiError(value: unknown): value is ApiError {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ApiError>;
  return typeof candidate.code === 'string' && typeof candidate.message === 'string';
}
