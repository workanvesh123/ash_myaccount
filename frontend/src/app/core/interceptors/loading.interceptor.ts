import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

/**
 * HTTP interceptor to show/hide global loading indicator
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  
  // Show loading indicator
  loadingService.show();
  
  // Hide loading indicator when request completes (success or error)
  return next(req).pipe(
    finalize(() => loadingService.hide())
  );
};
