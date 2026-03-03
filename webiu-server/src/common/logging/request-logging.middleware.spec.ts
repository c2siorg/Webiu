import type { NextFunction, Request, Response } from 'express';
import type { Logger as WinstonLogger } from 'winston';
import { RequestContextService } from './request-context.service';
import { RequestLoggingMiddleware } from './request-logging.middleware';

describe('RequestLoggingMiddleware', () => {
  const createMockResponse = () => {
    const listeners: Record<string, Array<() => void>> = {};
    const res = {
      statusCode: 200,
      setHeader: jest.fn(),
      on: jest.fn((event: string, callback: () => void) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(callback);
        return res;
      }),
    } as unknown as Response;

    return { res, listeners };
  };

  const createMockRequest = (correlationId?: string, xForwardedFor?: string) =>
    ({
      method: 'GET',
      url: '/api/v1/projects/projects',
      originalUrl: '/api/v1/projects/projects?page=1',
      ip: '127.0.0.1',
      headers: xForwardedFor ? { 'x-forwarded-for': xForwardedFor } : {},
      header: jest.fn((name: string) => {
        if (name.toLowerCase() === 'x-correlation-id') {
          return correlationId;
        }
        return undefined;
      }),
      get: jest.fn((name: string) => {
        if (name.toLowerCase() === 'user-agent') {
          return 'jest-agent';
        }
        return undefined;
      }),
    }) as unknown as Request;

  it('should preserve incoming correlation id and log request metadata', () => {
    const winstonLogger = {
      info: jest.fn(),
    } as unknown as WinstonLogger;
    const middleware = new RequestLoggingMiddleware(winstonLogger);
    const req = createMockRequest('incoming-correlation-id');
    const { res, listeners } = createMockResponse();

    let correlationIdInsideNext: string | undefined;
    const next: NextFunction = () => {
      correlationIdInsideNext = RequestContextService.getCorrelationId();
    };

    middleware.use(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'x-correlation-id',
      'incoming-correlation-id',
    );
    expect(correlationIdInsideNext).toBe('incoming-correlation-id');

    listeners.finish[0]();

    expect(winstonLogger.info).toHaveBeenCalledWith(
      'HTTP request completed',
      expect.objectContaining({
        correlationId: 'incoming-correlation-id',
        method: 'GET',
        path: '/api/v1/projects/projects?page=1',
        statusCode: 200,
        userAgent: 'jest-agent',
        ip: '127.0.0.1',
      }),
    );
  });

  it('should generate correlation id when header is missing', () => {
    const winstonLogger = {
      info: jest.fn(),
    } as unknown as WinstonLogger;
    const middleware = new RequestLoggingMiddleware(winstonLogger);
    const req = createMockRequest();
    const { res } = createMockResponse();

    const next: NextFunction = jest.fn();
    middleware.use(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'x-correlation-id',
      expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
    );
    expect(next).toHaveBeenCalled();
  });

  it('should use x-forwarded-for first hop as client IP', () => {
    const winstonLogger = { info: jest.fn() } as unknown as WinstonLogger;
    const middleware = new RequestLoggingMiddleware(winstonLogger);
    const req = createMockRequest('corr-123', '203.0.113.5, 10.0.0.1');
    const { res, listeners } = createMockResponse();

    middleware.use(req, res, jest.fn());
    listeners.finish[0]();

    expect(winstonLogger.info).toHaveBeenCalledWith(
      'HTTP request completed',
      expect.objectContaining({ ip: '203.0.113.5' }),
    );
  });

  it('should fall back to req.ip when x-forwarded-for is absent', () => {
    const winstonLogger = { info: jest.fn() } as unknown as WinstonLogger;
    const middleware = new RequestLoggingMiddleware(winstonLogger);
    const req = createMockRequest('corr-456');
    const { res, listeners } = createMockResponse();

    middleware.use(req, res, jest.fn());
    listeners.finish[0]();

    expect(winstonLogger.info).toHaveBeenCalledWith(
      'HTTP request completed',
      expect.objectContaining({ ip: '127.0.0.1' }),
    );
  });

  it('should log only once when both finish and close fire', () => {
    const winstonLogger = { info: jest.fn() } as unknown as WinstonLogger;
    const middleware = new RequestLoggingMiddleware(winstonLogger);
    const req = createMockRequest('corr-789');
    const { res, listeners } = createMockResponse();

    middleware.use(req, res, jest.fn());
    listeners.finish[0]();
    listeners.close[0]();

    expect(winstonLogger.info).toHaveBeenCalledTimes(1);
  });
});
