import { CookieOptions } from 'express';
import { ConfigService } from '@nestjs/config';

/**
 * Returns centralized cookie configuration options based on ConfigService values.
 */
export function getCookieOptions(configService: ConfigService): CookieOptions {
  const secureVal = configService.get<string>('COOKIE_SECURE');
  const sameSiteVal = configService.get<string>('COOKIE_SAMESITE');
  const nodeEnv = configService.get<string>('NODE_ENV');

  const secure =
    secureVal !== undefined ? secureVal === 'true' : nodeEnv === 'production';

  const sameSite = (sameSiteVal || 'lax').toLowerCase() as
    | 'lax'
    | 'strict'
    | 'none';

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
  };
}
