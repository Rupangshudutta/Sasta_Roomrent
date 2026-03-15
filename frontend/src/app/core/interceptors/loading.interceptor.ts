import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

/**
 * HTTP interceptor that automatically calls LoadingService.startLoading()
 * before every request and stopLoading() when the response arrives (or errors).
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  loading.startLoading();
  return next(req).pipe(
    finalize(() => loading.stopLoading())
  );
};
