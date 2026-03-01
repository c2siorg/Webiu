import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError } from 'rxjs';

export const globalErrorInterceptor: HttpInterceptorFn = (req, next) => {
    const toastr = inject(ToastrService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'An unknown error occurred!';

            if (error.error instanceof ErrorEvent) {
                // Client-side error
                errorMessage = `Error: ${error.error.message}`;
            } else {
                // Server-side error
                switch (error.status) {
                    case 400:
                        errorMessage = error.error?.message || 'Bad Request (Validation Error)';
                        break;
                    case 401:
                        errorMessage = 'Unauthorized. Please login again.';
                        break;
                    case 403:
                        errorMessage = 'Forbidden. You do not have permission.';
                        break;
                    case 404:
                        errorMessage = 'Resource not found.';
                        break;
                    case 429:
                        errorMessage = 'Too many requests. Please try again later.';
                        break;
                    case 500:
                        errorMessage = 'Internal Server Error. Please try again later.';
                        break;
                    default:
                        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
                }
            }

            toastr.error(errorMessage, 'API Error');
            return throwError(() => error);
        })
    );
};
