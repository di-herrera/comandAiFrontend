import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class ApiConfigService {
  readonly baseUrl = environment.apiBaseUrl;

  buildUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }
}
