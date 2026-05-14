export type EntityStatus = 'Active' | 'Inactive';

export interface PagedResult<T> {
  items: T[];
  total: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiFailure {
  status: number;
  url?: string | null;
  error: ApiError;
}
