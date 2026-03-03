import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import { RequestContextService } from './request-context.service';

const correlationIdFormat = winston.format((info) => {
  const correlationId = RequestContextService.getCorrelationId();
  if (correlationId) {
    info.correlationId = correlationId;
  }
  return info;
});

export function createWinstonLoggerOptions(
  isProduction: boolean,
): winston.LoggerOptions {
  const baseFormats = [
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    correlationIdFormat(),
  ];

  return {
    level: isProduction ? 'info' : 'debug',
    defaultMeta: { service: 'webiu-server' },
    // Emit JSON in production for log aggregators; keep nest-like output in dev.
    format: isProduction
      ? winston.format.combine(...baseFormats, winston.format.json())
      : winston.format.combine(
          ...baseFormats,
          nestWinstonModuleUtilities.format.nestLike('WebiuServer', {
            colors: true,
            prettyPrint: true,
          }),
        ),
    transports: [new winston.transports.Console()],
  };
}
