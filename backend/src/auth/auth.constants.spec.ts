import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ConfigService } from '@nestjs/config';
import { authCookieOptions } from './auth.constants';

function configFor(nodeEnvironment: string): ConfigService {
  return {
    getOrThrow: (key: string) => ({
      NODE_ENV: nodeEnvironment,
      JWT_EXPIRES_IN: '24h',
    })[key],
  } as unknown as ConfigService;
}

describe('authCookieOptions', () => {
  it('allows secure cross-site cookies in production', () => {
    const options = authCookieOptions(configFor('production'));

    assert.equal(options.secure, true);
    assert.equal(options.sameSite, 'none');
  });

  it('keeps local development cookies on the lax policy', () => {
    const options = authCookieOptions(configFor('development'));

    assert.equal(options.secure, false);
    assert.equal(options.sameSite, 'lax');
  });
});
