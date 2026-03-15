import { Injectable, signal, computed } from '@angular/core';

/**
 * Signal-based global loading service.
 * Tracks concurrent requests via a counter so nested loads don't flash.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _count = signal(0);

  /** True while any HTTP request is in flight */
  readonly isLoading = computed(() => this._count() > 0);

  startLoading(): void {
    this._count.update(n => n + 1);
  }

  stopLoading(): void {
    this._count.update(n => Math.max(0, n - 1));
  }
}
