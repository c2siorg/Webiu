import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService, UserRole } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Check if user is authenticated
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Get required roles from route data
    const requiredRoles: UserRole[] = route.data['roles'] || [];

    // If no specific roles are required, allow access
    if (requiredRoles.length === 0) {
      return true;
    }

    // Check if user has one of the required roles
    if (this.authService.hasRole(requiredRoles)) {
      return true;
    }

    // User doesn't have required role
    this.router.navigate(['/unauthorized']);
    return false;
  }
}
