import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  let authService: {
    isAuthenticated: boolean;
    isAdmin: boolean;
  };
  let router: Router;

  beforeEach(() => {
    authService = {
      isAuthenticated: false,
      isAdmin: false,
    };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    });

    router = TestBed.inject(Router);
  });

  it('redirects unauthenticated users to login with returnUrl', () => {
    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as never, { url: '/admin' } as never),
    );

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fadmin');
  });

  it('redirects authenticated non-admin users to home', () => {
    authService.isAuthenticated = true;
    authService.isAdmin = false;

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as never, { url: '/admin' } as never),
    );

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });

  it('allows admin users', () => {
    authService.isAuthenticated = true;
    authService.isAdmin = true;

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as never, { url: '/admin' } as never),
    );

    expect(result).toBeTrue();
  });
});
