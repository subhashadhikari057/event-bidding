import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { WorkRequestStatus } from '../generated/prisma/enums';
import type { PrismaService } from '../prisma/prisma.service';
import { InvitationsService } from './invitations.service';

const requestId = '11111111-1111-4111-8111-111111111111';
const vendorId = '22222222-2222-4222-8222-222222222222';

function createService(options: {
  status?: WorkRequestStatus;
  vendors?: Array<{ id: string; isActive: boolean }>;
  existing?: boolean;
} = {}) {
  let invitationsCreated = false;
  let opened = false;
  const transaction = {
    workRequest: {
      findUnique: async () => ({ status: options.status ?? WorkRequestStatus.DRAFT }),
      update: async () => { opened = true; },
    },
    vendor: {
      findMany: async () => options.vendors ?? [{ id: vendorId, isActive: true }],
    },
    invitation: {
      findFirst: async () => options.existing ? { id: 'existing' } : null,
      createMany: async () => { invitationsCreated = true; },
      findMany: async () => [{ id: 'invitation', vendorId }],
    },
  };
  const prisma = {
    $transaction: async (callback: (tx: typeof transaction) => unknown) => callback(transaction),
  } as unknown as PrismaService;
  return { service: new InvitationsService(prisma), state: () => ({ invitationsCreated, opened }) };
}

describe('InvitationsService', () => {
  it('creates all invitations and changes DRAFT to OPEN', async () => {
    const { service, state } = createService();
    const result = await service.create(requestId, [vendorId]);
    assert.equal(result.length, 1);
    assert.deepEqual(state(), { invitationsCreated: true, opened: true });
  });

  it('rejects inactive vendors without writing invitations', async () => {
    const setup = createService({ vendors: [{ id: vendorId, isActive: false }] });
    await assert.rejects(setup.service.create(requestId, [vendorId]), ConflictException);
    assert.equal(setup.state().invitationsCreated, false);
  });

  it('rejects a missing vendor without a partial write', async () => {
    const setup = createService({ vendors: [] });
    await assert.rejects(setup.service.create(requestId, [vendorId]), NotFoundException);
    assert.equal(setup.state().invitationsCreated, false);
  });

  it('rejects duplicate invitations', async () => {
    const setup = createService({ existing: true });
    await assert.rejects(setup.service.create(requestId, [vendorId]), ConflictException);
    assert.equal(setup.state().invitationsCreated, false);
  });

  it('returns 404 for an unassigned vendor request', async () => {
    const prisma = {
      invitation: { findUnique: async () => null },
    } as unknown as PrismaService;
    const service = new InvitationsService(prisma);
    await assert.rejects(service.findVendorRequest(vendorId, requestId), NotFoundException);
  });
});
