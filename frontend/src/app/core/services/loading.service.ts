import { Injectable, signal } from '@angular/core';

/**
 * Service for managing global loading state
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSignal = signal(false);
  private requestCount = 0;

  /**
   * Read-only signal of loading state
   */
  readonly isLoading = this.loadingSignal.asReadonly();

  /**
   * Show loading indicator
   */
  show(): void {
    this.requestCount++;
    this.loadingSignal.set(true);
  }

  /**
   * Hide loading indicator
   */
  hide(): void {
    this.requestCount = Math.max(0, this.requestCount - 1);
    if (this.requestCount === 0) {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Force hide loading indicator
   */
  forceHide(): void {
    this.requestCount = 0;
    this.loadingSignal.set(false);
  }
}
