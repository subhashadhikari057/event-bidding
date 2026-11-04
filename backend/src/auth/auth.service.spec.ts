import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UserRole } from '../generated/prisma/enums';
import type { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

const adminId = '11111111-1111-4111-8111-111111111111';
const vendorId = '22222222-2222-4222-8222-222222222222';
let passwordHash: string;

describe('AuthService', () => {
  let userResult: Record<string, unknown> | null;
  let vendorResult: Record<string, unknown> | null;
  let updatedPasswordHash: string | undefined;
  let service: AuthService;

  before(async () => {
    passwordHash = await bcrypt.hash('valid-password-123', 4);
  });

  beforeEach(() => {
    userResult = {
      id: adminId,
      name: 'Admin',
      email: 'admin@example.com',
      passwordHash,
      role: UserRole.ADMIN,
      vendorId: null,
      isActive: true,
      vendor: null,
    };
    vendorResult = null;
    updatedPasswordHash = undefined;

    const prisma = {
      user: {
        findUnique: async () => userResult,
        update: async (args: { data: { passwordHash: string } }) => {
          updatedPasswordHash = args.data.passwordHash;
          return userResult;
        },
      },
      vendor: {
        findUnique: async () => vendorResult,
      },
    } as unknown as PrismaService;
    const jwt = {
      signAsync: async () => 'signed-token',
    } as unknown as JwtService;
    service = new AuthService(prisma, jwt);
  });

  it('logs in with normalized email and returns a safe user', async () => {
    const result = await service.login({ email: ' ADMIN@EXAMPLE.COM ', password: 'valid-password-123' });
    assert.equal(result.token, 'signed-token');
    assert.deepEqual(result.user, {
      id: adminId,
      name: 'Admin',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      vendorId: null,
    });
    assert.equal('passwordHash' in result.user, false);
  });

  it('rejects an incorrect password with a generic error', async () => {
    await assert.rejects(
      service.login({ email: 'admin@example.com', password: 'incorrect-password' }),
      (error: unknown) => error instanceof UnauthorizedException && error.message === 'Invalid email or password',
    );
  });

  it('rejects an unknown user with the same generic error', async () => {
    userResult = null;
    await assert.rejects(
      service.login({ email: 'unknown@example.com', password: 'valid-password-123' }),
      UnauthorizedException,
    );
  });

  it('rejects an inactive user', async () => {
    userResult = { ...userResult, isActive: false };
    await assert.rejects(
      service.login({ email: 'admin@example.com', password: 'valid-password-123' }),
      UnauthorizedException,
    );
  });

  it('rejects a vendor whose company is inactive', async () => {
    userResult = {
      ...userResult,
      role: UserRole.VENDOR,
      vendorId,
      vendor: { id: vendorId, isActive: false },
    };
    await assert.rejects(
      service.login({ email: 'admin@example.com', password: 'valid-password-123' }),
      UnauthorizedException,
    );
  });

  it('changes a password after verifying the current password', async () => {
    await service.changePassword(
      { id: adminId, name: 'Admin', email: 'admin@example.com', role: UserRole.ADMIN, vendorId: null, isActive: true },
      { currentPassword: 'valid-password-123', newPassword: 'new-password-456' },
    );
    assert.ok(updatedPasswordHash);
    assert.equal(await bcrypt.compare('new-password-456', updatedPasswordHash), true);
  });

  it('rejects a wrong current password', async () => {
    await assert.rejects(
      service.changePassword(
        { id: adminId, name: 'Admin', email: 'admin@example.com', role: UserRole.ADMIN, vendorId: null, isActive: true },
        { currentPassword: 'wrong-password', newPassword: 'new-password-456' },
      ),
      UnauthorizedException,
    );
  });

  it('rejects reusing the current password', async () => {
    await assert.rejects(
      service.changePassword(
        { id: adminId, name: 'Admin', email: 'admin@example.com', role: UserRole.ADMIN, vendorId: null, isActive: true },
        { currentPassword: 'valid-password-123', newPassword: 'valid-password-123' },
      ),
      BadRequestException,
    );
  });

  it('accepts a six-character new password', async () => {
    await service.changePassword(
      { id: adminId, name: 'Admin', email: 'admin@example.com', role: UserRole.ADMIN, vendorId: null, isActive: true },
      { currentPassword: 'valid-password-123', newPassword: 'six123' },
    );
    assert.ok(updatedPasswordHash);
    assert.equal(await bcrypt.compare('six123', updatedPasswordHash), true);
  });

  it('rejects a new password shorter than six UTF-8 bytes', async () => {
    await assert.rejects(
      service.changePassword(
        { id: adminId, name: 'Admin', email: 'admin@example.com', role: UserRole.ADMIN, vendorId: null, isActive: true },
        { currentPassword: 'valid-password-123', newPassword: '12345' },
      ),
      BadRequestException,
    );
  });

  it('rejects a new password exceeding 72 UTF-8 bytes', async () => {
    await assert.rejects(
      service.changePassword(
        { id: adminId, name: 'Admin', email: 'admin@example.com', role: UserRole.ADMIN, vendorId: null, isActive: true },
        { currentPassword: 'valid-password-123', newPassword: '🔐'.repeat(19) },
      ),
      BadRequestException,
    );
  });

  it('generates and hashes a vendor temporary password', async () => {
    vendorResult = {
      id: vendorId,
      isActive: true,
      user: { id: '33333333-3333-4333-8333-333333333333', role: UserRole.VENDOR, isActive: true },
    };
    const result = await service.resetVendorPassword(vendorId);
    assert.equal(result.message, 'Vendor password reset successfully');
    assert.equal(result.temporaryPassword.length, 24);
    assert.ok(updatedPasswordHash);
    assert.equal(await bcrypt.compare(result.temporaryPassword, updatedPasswordHash), true);
    assert.equal('passwordHash' in result, false);
  });

  it('returns not found when a vendor account is missing', async () => {
    await assert.rejects(service.resetVendorPassword(vendorId), NotFoundException);
  });

  it('does not reset an inactive vendor account', async () => {
    vendorResult = {
      id: vendorId,
      isActive: false,
      user: { id: '33333333-3333-4333-8333-333333333333', role: UserRole.VENDOR, isActive: true },
    };
    await assert.rejects(service.resetVendorPassword(vendorId), BadRequestException);
  });
});
