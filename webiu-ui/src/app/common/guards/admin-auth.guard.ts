import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const adminAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.checkSession().pipe(
    map((res) => {
      if (res.authenticated) {
        return true;
      } else {
        router.navigate(['/admin']);
        return false;
      }
    }),
    catchError(() => {
      router.navigate(['/admin']);
      return of(false);
    }),
  );
};
