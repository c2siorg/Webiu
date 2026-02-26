import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function flushError(status: number, statusText = 'Error') {
    let capturedError: any;
    http.get('/test').subscribe({ error: (e) => (capturedError = e) });
    httpMock.expectOne('/test').flush(null, { status, statusText });
    return capturedError;
  }

  it('attaches userMessage on 401', () => {
    const err = flushError(401, 'Unauthorized');
    expect(err.userMessage).toContain('Unauthorized');
  });

  it('attaches userMessage on 403', () => {
    const err = flushError(403, 'Forbidden');
    expect(err.userMessage).toContain('Access denied');
  });

  it('attaches userMessage on 404', () => {
    const err = flushError(404, 'Not Found');
    expect(err.userMessage).toContain('not found');
  });

  it('attaches userMessage on 429', () => {
    const err = flushError(429, 'Too Many Requests');
    expect(err.userMessage).toContain('Too many requests');
  });

  it('attaches userMessage on 500', () => {
    const err = flushError(500, 'Internal Server Error');
    expect(err.userMessage).toContain('Internal server error');
  });

  it('attaches userMessage on 503', () => {
    const err = flushError(503, 'Service Unavailable');
    expect(err.userMessage).toContain('unavailable');
  });

  it('preserves the original HttpErrorResponse fields', () => {
    const err = flushError(404, 'Not Found');
    expect(err instanceof HttpErrorResponse).toBeTrue();
    expect(err.status).toBe(404);
  });

  it('does not interfere with successful responses', (done) => {
    http.get('/test').subscribe({
      next: (res) => {
        expect(res).toEqual({ ok: true });
        done();
      },
      error: () => fail('should not error'),
    });
    httpMock.expectOne('/test').flush({ ok: true });
  });
});
