import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Service for managing session storage in an SSR-safe way
 */
@Injectable({
  providedIn: 'root'
})
export class SessionStoreService {
  private platformId = inject(PLATFORM_ID);

  /**
   * Store a value in session storage
   */
  set<T>(key: string, value: T): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error('Error storing in session storage:', error);
      }
    }
  }

  /**
   * Retrieve a value from session storage
   */
  get<T>(key: string): T | null {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.error('Error reading from session storage:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Remove a value from session storage
   */
  remove(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing from session storage:', error);
      }
    }
  }

  /**
   * Clear all session storage
   */
  clear(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        sessionStorage.clear();
      } catch (error) {
        console.error('Error clearing session storage:', error);
      }
    }
  }
}
