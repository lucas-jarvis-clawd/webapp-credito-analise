import { logger } from './logger';

/**
 * Returns the JWT secret. In production, throws if JWT_SECRET is not set.
 * In development/test, falls back to a default (with a warning).
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    logger.error('FATAL: JWT_SECRET environment variable is not set.');
    throw new Error('JWT_SECRET environment variable must be set in production.');
  }

  logger.warn('JWT_SECRET not set - using default secret. Do NOT use this in production.');
  return 'dev_default_secret_change_me';
}

export function getJwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '24h';
}
