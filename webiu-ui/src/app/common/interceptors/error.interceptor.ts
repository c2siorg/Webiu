import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

function getUserMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Network error — please check your connection and try again.';
  }

  switch (error.status) {
    case 400:
      return 'Bad request. Please check your input and try again.';
    case 401:
      return 'Unauthorized. Please log in and try again.';
    case 403:
      return 'Access denied.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests — please wait a moment and try again.';
    case 500:
      return 'Internal server error. Please try again later.';
    case 502:
      return 'Bad gateway. The server is temporarily unavailable.';
    case 503:
      return 'Service unavailable. Please try again later.';
    default:
      return error.status >= 500
        ? 'A server error occurred. Please try again later.'
        : 'An unexpected error occurred. Please try again.';
  }
}

export const globalErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const userMessage = getUserMessage(error);

      // HTTP error - error message attached to response for UI display
      return throwError(() => Object.assign(error, { userMessage }));
    }),
  );
};

export const errorInterceptor = globalErrorInterceptor;
