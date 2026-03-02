import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MessageQueueService } from '../services/message-queue.service';

/**
 * HTTP interceptor for global error handling
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageQueue = inject(MessageQueueService);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An error occurred';
      
      // Extract error message from response
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.Message) {
        errorMessage = error.error.Message;
      } else if (error.status === 0) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.status === 401) {
        errorMessage = 'Unauthorized. Please log in.';
      } else if (error.status === 404) {
        errorMessage = 'Resource not found.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Display error message
      messageQueue.addError(errorMessage);
      
      // Re-throw error for component handling
      return throwError(() => error);
    })
  );
};
