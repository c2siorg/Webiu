import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { ApplicationConfig, isDevMode, PLATFORM_ID, inject } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors, HttpInterceptorFn } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { routes } from './app.routes';
import { globalErrorInterceptor } from './common/interceptors/error.interceptor';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { provideServiceWorker } from '@angular/service-worker';

const serverInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  if (isPlatformServer(platformId) && req.url.startsWith('http://localhost:5050')) {
    const newReq = req.clone({
      url: req.url.replace('http://localhost:5050', 'http://webiu-server:5050')
    });
    return next(newReq);
  }
  return next(req);
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideHttpClient(withFetch(), withInterceptors([serverInterceptor, globalErrorInterceptor])),
    provideAnimations(),
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    }),
    provideClientHydration(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
