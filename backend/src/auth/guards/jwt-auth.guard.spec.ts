import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { UserRole } from '../../generated/prisma/enums';
import type { PrismaService } from '../../prisma/prisma.service';
import { AUTH_COOKIE_NAME } from '../auth.constants';
import { JwtAuthGuard } from './jwt-auth.guard';

const secret = 'test-secret-that-is-at-least-thirty-two-characters';
const userId = '11111111-1111-4111-8111-111111111111';

function executionContext(request: Partial<Request>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let userResult: Record<string, unknown> | null;
  let request: Partial<Request> & { cookies: Record<string, string>; user?: unknown };
  let jwt: JwtService;
  let guard: JwtAuthGuard;

  beforeEach(() => {
    userResult = {
      id: userId,
      name: 'Admin',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      vendorId: null,
      isActive: true,
      vendor: null,
    };
    request = { cookies: {} };
    jwt = new JwtService({ secret });
    const prisma = {
      user: { findUnique: async () => userResult },
    } as unknown as PrismaService;
    guard = new JwtAuthGuard(jwt, prisma);
  });

  it('authenticates a valid token and attaches current database identity', async () => {
    request.cookies[AUTH_COOKIE_NAME] = await jwt.signAsync({ sub: userId, role: UserRole.ADMIN });
    assert.equal(await guard.canActivate(executionContext(request)), true);
    assert.deepEqual(request.user, {
      id: userId,
      name: 'Admin',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      vendorId: null,
      isActive: true,
    });
  });

  it('rejects a missing cookie', async () => {
    await assert.rejects(guard.canActivate(executionContext(request)), UnauthorizedException);
  });

  it('rejects an invalid JWT signature', async () => {
    request.cookies[AUTH_COOKIE_NAME] = await new JwtService({ secret: 'different-secret' }).signAsync({
      sub: userId,
      role: UserRole.ADMIN,
    });
    await assert.rejects(guard.canActivate(executionContext(request)), UnauthorizedException);
  });

  it('rejects an expired JWT', async () => {
    request.cookies[AUTH_COOKIE_NAME] = await jwt.signAsync(
      { sub: userId, role: UserRole.ADMIN },
      { expiresIn: -1 },
    );
    await assert.rejects(guard.canActivate(executionContext(request)), UnauthorizedException);
  });

  it('rejects a token when the current database role changed', async () => {
    request.cookies[AUTH_COOKIE_NAME] = await jwt.signAsync({ sub: userId, role: UserRole.ADMIN });
    userResult = { ...userResult, role: UserRole.VENDOR, vendorId: null, vendor: null };
    await assert.rejects(guard.canActivate(executionContext(request)), UnauthorizedException);
  });

  it('rejects an inactive vendor association', async () => {
    request.cookies[AUTH_COOKIE_NAME] = await jwt.signAsync({ sub: userId, role: UserRole.VENDOR });
    userResult = {
      ...userResult,
      role: UserRole.VENDOR,
      vendorId: '22222222-2222-4222-8222-222222222222',
      vendor: { isActive: false },
    };
    await assert.rejects(guard.canActivate(executionContext(request)), UnauthorizedException);
  });
});
