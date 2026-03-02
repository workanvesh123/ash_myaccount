import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { SessionStoreService } from '../services/session-store.service';

/**
 * Route guard to protect authenticated routes
 */
export const authGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const sessionStore = inject(SessionStoreService);
  const router = inject(Router);
  
  // Check if user is authenticated
  const isAuthenticated = userService.isAuthenticated();
  const sessionToken = sessionStore.get<string>('sessionToken');
  
  if (isAuthenticated || sessionToken) {
    return true;
  }
  
  // Store intended URL for redirect after login
  sessionStore.set('redirectUrl', state.url);
  
  // Redirect to login
  return router.createUrlTree(['/login']);
};
