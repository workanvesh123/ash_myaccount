import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoginResponse } from '../models/auth.model';
import { LoginStoreService } from './login-store.service';
import { UserService } from './user.service';
import { SessionStoreService } from './session-store.service';

/**
 * Service for handling login responses and 2FA interceptor logic
 */
@Injectable({
  providedIn: 'root'
})
export class LoginResponseHandlerService {
  private router = inject(Router);
  private loginStore = inject(LoginStoreService);
  private userService = inject(UserService);
  private sessionStore = inject(SessionStoreService);

  /**
   * Handle login response and redirect appropriately
   */
  async handle(response: LoginResponse): Promise<void> {
    // Store PostLoginValues for interceptor
    if (response.postLoginValues) {
      this.loginStore.setPostLoginValues(response.postLoginValues);
      // Also store in session for page refresh
      this.sessionStore.set('two-fa-flowtype', response.postLoginValues);
    }

    // Update user state
    if (response.claims) {
      this.userService.setAccountId(response.claims.accountId);
      this.userService.setSessionToken(response.claims.sessionToken);
      
      // Store accountId as the session token (backend expects userId as Bearer token)
      this.sessionStore.set('sessionToken', response.claims.accountId);
    }

    if (response.user) {
      this.userService.setAuthenticated(response.user.isAuthenticated);
    }

    // Check if login is completed
    if (!response.isCompleted) {
      // Redirect to interceptor (2FA verify)
      if (response.redirectUrl) {
        await this.router.navigateByUrl(response.redirectUrl);
      }
      return;
    }

    // Login completed - redirect to games page
    await this.router.navigate(['/games']);
  }
}
