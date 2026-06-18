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

  if (error.status === 403) {
    return {
      code: 'Forbidden',
      message: 'Seu usuario nao tem permissao para acessar este recurso.'
    };
  }

  if (isSimpleError(error.error)) {
    return {
      code: error.status ? `Http${error.status}` : 'RequestError',
      message: error.error.error
    };
  }

  return {
    code: error.status ? `Http${error.status}` : 'NetworkError',
    message: error.message || 'Nao foi possivel concluir a requisicao.'
  };
}

function isApiError(value: unknown): value is ApiError {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ApiError>;
  return typeof candidate.code === 'string' && typeof candidate.message === 'string';
}

function isSimpleError(value: unknown): value is { error: string } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return typeof (value as { error?: unknown }).error === 'string';
}
