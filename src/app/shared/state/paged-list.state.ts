import { signal } from '@angular/core';
import { Observable, catchError, finalize, of, take, timeout } from 'rxjs';

import { PagedResult } from '@shared/models/common.models';

export interface PagedListStateOptions<T> {
  timeoutMs?: number;
  errorMessage?: string;
  onError?: (message: string) => void;
  mapItems?: (items: T[]) => T[];
}

/**
 * Estado compartilhado para listagens HTTP paginadas ou retornadas em lote.
 * A tela continua responsável por filtros e formulários; esta classe cuida
 * apenas do ciclo de vida da leitura e da atualização reativa da lista.
 */
export class PagedListState<T> {
  private static readonly DefaultTimeoutMs = 15000;

  readonly items = signal<T[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal('');
  private requestId = 0;

  load(request: Observable<PagedResult<T>>, options: PagedListStateOptions<T> = {}): void {
    const requestId = ++this.requestId;
    const timeoutMs = options.timeoutMs ?? PagedListState.DefaultTimeoutMs;
    const fallbackMessage = options.errorMessage ?? 'Nao foi possivel carregar os dados. Tente novamente.';

    this.loading.set(true);
    this.error.set('');

    request.pipe(
      timeout(timeoutMs),
      take(1),
      catchError((failure: unknown) => {
        if (requestId === this.requestId) {
          const message = this.failureMessage(failure, fallbackMessage);
          this.error.set(message);
          options.onError?.(message);
        }

        return of(null);
      }),
      finalize(() => {
        if (requestId === this.requestId) {
          this.loading.set(false);
        }
      })
    ).subscribe((result) => {
      if (!result || requestId !== this.requestId) {
        return;
      }

      const items = options.mapItems?.(Array.isArray(result.items) ? result.items : [])
        ?? (Array.isArray(result.items) ? result.items : []);
      this.items.set(items);
      this.total.set(result.total ?? items.length);
    });
  }

  reset(): void {
    this.requestId += 1;
    this.items.set([]);
    this.total.set(0);
    this.loading.set(false);
    this.error.set('');
  }

  private failureMessage(failure: unknown, fallbackMessage: string): string {
    if (failure && typeof failure === 'object') {
      const candidate = failure as { error?: { message?: unknown } };
      if (typeof candidate.error?.message === 'string') {
        return candidate.error.message;
      }
    }

    return fallbackMessage;
  }
}
