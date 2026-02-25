import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Maps an HTTP error response to a concise, user-readable message.
 * Status 0 means the request never reached the server (offline / CORS / timeout).
 */
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

/**
 * Global HTTP error interceptor.
 *
 * Intercepts every failing HTTP response and:
 *  1. Derives a user-friendly message from the status code.
 *  2. Logs a structured entry to the console for debugging.
 *  3. Attaches `userMessage` to the error object so any component can
 *     display it without duplicating status-code logic:
 *
 *     ```ts
 *     this.http.get(...).subscribe({
 *       error: (err) => this.errorMsg = err.userMessage ?? 'Something went wrong.',
 *     });
 *     ```
 *
 * Existing component-level error callbacks continue to work unchanged —
 * this interceptor does not swallow errors, it only enriches them.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const userMessage = getUserMessage(error);

      console.error(
        `[HTTP ${error.status}] ${req.method} ${req.urlWithParams} — ${userMessage}`,
      );

      return throwError(() => Object.assign(error, { userMessage }));
    }),
  );
};
