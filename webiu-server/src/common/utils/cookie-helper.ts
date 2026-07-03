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

/**
 * Centralized utility to extract a cookie value from a Cookie header string.
 */
export function extractCookie(
  cookieHeader: string | undefined,
  name: string,
): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map((c) => c.trim());
  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.split('=');
    if (key === name) {
      return valueParts.join('=');
    }
  }
  return null;
}
