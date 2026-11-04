import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { UserRole } from '../../generated/prisma/enums';
import { RolesGuard } from './roles.guard';

function context(role: UserRole): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: () => [UserRole.ADMIN],
  } as unknown as Reflector;
  const guard = new RolesGuard(reflector);

  it('allows an ADMIN on an admin route', () => {
    assert.equal(guard.canActivate(context(UserRole.ADMIN)), true);
  });

  it('rejects a VENDOR on an admin route', () => {
    assert.throws(() => guard.canActivate(context(UserRole.VENDOR)), ForbiddenException);
  });
});
