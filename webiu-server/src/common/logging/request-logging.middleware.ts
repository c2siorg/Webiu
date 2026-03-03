import {
  Inject,
  Injectable,
  Logger,
  type NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger as WinstonLogger } from 'winston';
import { RequestContextService } from './request-context.service';

type CorrelatedRequest = Request & { correlationId?: string };

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly winstonLogger: WinstonLogger,
  ) {}

  use(req: CorrelatedRequest, res: Response, next: NextFunction): void {
    // High-resolution timer avoids millisecond rounding issues for short requests.
    const startedAt = process.hrtime.bigint();
    const correlationId = this.getCorrelationId(req);

    req.correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);

    RequestContextService.run(correlationId, () => {
      // Resolve real client IP — behind a reverse proxy the actual IP is in
      // x-forwarded-for (first hop); fall back to req.ip when the header is absent.
      const clientIp =
        (req.headers['x-forwarded-for'] as string | undefined)
          ?.split(',')[0]
          .trim() ?? req.ip;

      // Guard against duplicate log entries: 'finish' fires on a normal response
      // completion; 'close' fires if the client disconnects before the response
      // is fully sent. We listen to both but only write the log once.
      let logged = false;
      const logRequest = () => {
        if (logged) return;
        logged = true;

        const durationMs =
          Number(process.hrtime.bigint() - startedAt) / 1_000_000;

        this.winstonLogger.info('HTTP request completed', {
          correlationId,
          method: req.method,
          path: req.originalUrl || req.url,
          statusCode: res.statusCode,
          durationMs: Number(durationMs.toFixed(2)),
          userAgent: req.get('user-agent') || 'unknown',
          ip: clientIp,
        });
      };

      res.on('finish', logRequest);
      res.on('close', logRequest);

      next();
    });
  }

  private getCorrelationId(req: Request): string {
    const headerValue = req.header('x-correlation-id')?.trim();
    if (headerValue) {
      return headerValue;
    }

    this.logger.debug(
      'Missing x-correlation-id header. Generating a new correlation ID.',
    );
    return randomUUID();
  }
}
