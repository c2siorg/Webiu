export interface SSLConfigOptions {
  databaseUrl?: string;
  databaseSsl?: string;
  nodeEnv?: string;
  rejectUnauthorized?: string;
}

/**
 * Returns TypeORM SSL configuration options based on environment variables.
 * Decouples SSL logic from NestJS ConfigService to allow CLI & runtime consistency.
 */
export function getSSLConfig(options: SSLConfigOptions = {}): any {
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL ?? '';
  const databaseSsl = options.databaseSsl ?? process.env.DATABASE_SSL;
  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV;
  const rejectUnauthorized =
    options.rejectUnauthorized ?? process.env.DATABASE_REJECT_UNAUTHORIZED;

  let sslEnabled = false;
  if (databaseSsl !== undefined) {
    sslEnabled = databaseSsl === 'true';
  } else {
    // Default fallback: enable SSL on Render or in production
    sslEnabled = databaseUrl.includes('render.com') || nodeEnv === 'production';
  }

  if (!sslEnabled) {
    return false;
  }

  // Explicit rejectUnauthorized override if configured
  if (rejectUnauthorized !== undefined) {
    return {
      rejectUnauthorized: rejectUnauthorized === 'true',
    };
  }

  // Default rejectUnauthorized to false on Render (due to self-signed certs)
  if (databaseUrl.includes('render.com')) {
    return {
      rejectUnauthorized: false,
    };
  }

  // Secure default for other deployments
  return {
    rejectUnauthorized: true,
  };
}
