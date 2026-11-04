import type { CookieOptions } from 'express';
import type { ConfigService } from '@nestjs/config';
import { parseDurationSeconds } from './duration';

export const AUTH_COOKIE_NAME = 'mero_event_access';
export const COOKIE_AUTH_SCHEME = 'cookieAuth';

export function authCookieOptions(config: ConfigService): CookieOptions {
  const expiresIn = parseDurationSeconds(config.getOrThrow<string>('JWT_EXPIRES_IN'));

  return {
    httpOnly: true,
    secure: config.getOrThrow<string>('NODE_ENV') === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: expiresIn * 1000,
  };
}

export function clearAuthCookieOptions(config: ConfigService): CookieOptions {
  const options = authCookieOptions(config);
  delete options.maxAge;
  return options;
}
