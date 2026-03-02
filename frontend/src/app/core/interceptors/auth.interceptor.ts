import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionStoreService } from '../services/session-store.service';

/**
 * HTTP interceptor to add Bearer token to all API requests
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionStore = inject(SessionStoreService);
  
  // Get session token from storage
  const sessionToken = sessionStore.get<string>('sessionToken');
  
  // If token exists, clone request and add Authorization header
  if (sessionToken) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${sessionToken}`
      }
    });
  }
  
  return next(req);
};
