import { Injectable, signal } from '@angular/core';
import { PostLoginValues } from '../models/auth.model';

/**
 * Service for storing login-related state
 */
@Injectable({
  providedIn: 'root'
})
export class LoginStoreService {
  private postLoginValuesSignal = signal<PostLoginValues | null>(null);
  private lastVisitorSignal = signal<string | null>(null);

  /**
   * Read-only signal of PostLoginValues
   */
  readonly postLoginValues = this.postLoginValuesSignal.asReadonly();

  /**
   * Read-only signal of last visitor username
   */
  readonly lastVisitor = this.lastVisitorSignal.asReadonly();

  /**
   * Set PostLoginValues (used by LoginResponseHandler)
   */
  setPostLoginValues(values: PostLoginValues | null): void {
    this.postLoginValuesSignal.set(values);
  }

  /**
   * Set last visitor username
   */
  setLastVisitor(username: string): void {
    this.lastVisitorSignal.set(username);
  }

  /**
   * Clear all login state
   */
  clear(): void {
    this.postLoginValuesSignal.set(null);
    this.lastVisitorSignal.set(null);
  }
}
