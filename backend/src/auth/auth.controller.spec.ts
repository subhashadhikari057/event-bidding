import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { UserRole } from '../generated/prisma/enums';
import { AUTH_COOKIE_NAME } from './auth.constants';
import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';

describe('AuthController', () => {
  let clearedCookie: string | undefined;
  let cacheControl: string | undefined;
  let controller: AuthController;
  let response: Response;

  beforeEach(() => {
    clearedCookie = undefined;
    cacheControl = undefined;
    const auth = {
      changePassword: async () => ({ message: 'Password changed successfully. Please log in again.' }),
      resetVendorPassword: async () => ({
        message: 'Vendor password reset successfully',
        temporaryPassword: 'temporary-password',
      }),
    } as unknown as AuthService;
    const config = {
      getOrThrow: (key: string) => ({
        NODE_ENV: 'test',
        JWT_EXPIRES_IN: '24h',
      })[key],
    } as unknown as ConfigService;
    controller = new AuthController(auth, config);
    response = {
      clearCookie: (name: string) => {
        clearedCookie = name;
        return response;
      },
      setHeader: (name: string, value: string) => {
        if (name === 'Cache-Control') cacheControl = value;
        return response;
      },
    } as unknown as Response;
  });

  it('returns only the current safe profile', () => {
    const profile = controller.me({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Admin',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      vendorId: null,
      isActive: true,
    });
    assert.equal(profile.role, UserRole.ADMIN);
    assert.equal('passwordHash' in profile, false);
  });

  it('makes logout idempotent and clears the auth cookie', () => {
    assert.deepEqual(controller.logout(response), { message: 'Logged out successfully' });
    assert.equal(clearedCookie, AUTH_COOKIE_NAME);
  });

  it('clears the auth cookie after a successful password change', async () => {
    await controller.changePassword(
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Admin',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        vendorId: null,
        isActive: true,
      },
      { currentPassword: 'valid-password-123', newPassword: 'new-password-456' },
      response,
    );
    assert.equal(clearedCookie, AUTH_COOKIE_NAME);
  });

  it('marks temporary-password responses as non-cacheable', async () => {
    await controller.resetVendorPassword('22222222-2222-4222-8222-222222222222', response);
    assert.equal(cacheControl, 'no-store');
  });
});
