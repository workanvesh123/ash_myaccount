import { Injectable, signal } from '@angular/core';

/**
 * Service for managing user state
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private isAuthenticatedSignal = signal(false);
  private workflowTypeSignal = signal(0);
  private accountIdSignal = signal<string | null>(null);
  private sessionTokenSignal = signal<string | null>(null);

  /**
   * Read-only signal of authentication status
   */
  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();

  /**
   * Read-only signal of workflow type
   */
  readonly workflowType = this.workflowTypeSignal.asReadonly();

  /**
   * Read-only signal of account ID
   */
  readonly accountId = this.accountIdSignal.asReadonly();

  /**
   * Read-only signal of session token
   */
  readonly sessionToken = this.sessionTokenSignal.asReadonly();

  /**
   * Set authentication status
   */
  setAuthenticated(value: boolean): void {
    this.isAuthenticatedSignal.set(value);
  }

  /**
   * Set workflow type
   */
  setWorkflowType(type: number): void {
    this.workflowTypeSignal.set(type);
  }

  /**
   * Set account ID
   */
  setAccountId(id: string | null): void {
    this.accountIdSignal.set(id);
  }

  /**
   * Set session token
   */
  setSessionToken(token: string | null): void {
    this.sessionTokenSignal.set(token);
  }

  /**
   * Clear all user state
   */
  clear(): void {
    this.isAuthenticatedSignal.set(false);
    this.workflowTypeSignal.set(0);
    this.accountIdSignal.set(null);
    this.sessionTokenSignal.set(null);
  }
}
