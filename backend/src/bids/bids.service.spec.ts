import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConflictException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { BidStatus, WorkRequestStatus } from '../generated/prisma/enums';
import type { PrismaService } from '../prisma/prisma.service';
import { BidsService } from './bids.service';

const requestId = '11111111-1111-4111-8111-111111111111';
const vendorId = '22222222-2222-4222-8222-222222222222';
const bidId = '33333333-3333-4333-8333-333333333333';

describe('BidsService', () => {
  it('creates a bid and marks its invitation RESPONDED atomically', async () => {
    let invitationUpdated = false;
    const transaction = {
      workRequest: { findUnique: async () => ({ status: WorkRequestStatus.OPEN }) },
      invitation: {
        findUnique: async () => ({
          id: 'invitation', bid: null, vendor: { isActive: true, user: { isActive: true } },
        }),
        update: async () => { invitationUpdated = true; },
      },
      bid: {
        create: async () => ({
          id: bidId,
          invitationId: 'invitation',
          amount: new Prisma.Decimal('75000.00'),
          notes: null,
          status: BidStatus.SUBMITTED,
          submittedAt: new Date('2026-11-04T10:00:00.000Z'),
        }),
      },
    };
    const prisma = {
      $transaction: async (callback: (tx: typeof transaction) => unknown) => callback(transaction),
    } as unknown as PrismaService;
    const result = await new BidsService(prisma).submit(requestId, vendorId, { amount: '75000.00' });
    assert.equal(result.amount, '75000.00');
    assert.equal(invitationUpdated, true);
  });

  it('rejects a second bid for the same invitation', async () => {
    const transaction = {
      workRequest: { findUnique: async () => ({ status: WorkRequestStatus.OPEN }) },
      invitation: {
        findUnique: async () => ({
          id: 'invitation', bid: { id: bidId }, vendor: { isActive: true, user: { isActive: true } },
        }),
      },
    };
    const prisma = {
      $transaction: async (callback: (tx: typeof transaction) => unknown) => callback(transaction),
    } as unknown as PrismaService;
    await assert.rejects(
      new BidsService(prisma).submit(requestId, vendorId, { amount: '75000.00' }),
      ConflictException,
    );
  });

  it('accepts one bid, rejects competitors, and creates one booking', async () => {
    let competitorsRejected = false;
    let bookingCreated = false;
    const transaction = {
      bid: {
        findUnique: async () => ({
          id: bidId,
          amount: new Prisma.Decimal('75000.00'),
          status: BidStatus.SUBMITTED,
          invitation: {
            workRequestId: requestId,
            workRequest: { status: WorkRequestStatus.OPEN, booking: null },
            vendor: { isActive: true, user: { isActive: true } },
          },
        }),
        updateMany: async (args: { where: { id?: string } }) => {
          if (typeof args.where.id !== 'string') competitorsRejected = true;
          return { count: 1 };
        },
      },
      workRequest: { updateMany: async () => ({ count: 1 }) },
      booking: {
        create: async () => {
          bookingCreated = true;
          return {
            id: 'booking', workRequestId: requestId, bidId,
            amount: new Prisma.Decimal('75000.00'), status: 'CONFIRMED', createdAt: new Date(),
          };
        },
      },
    };
    const prisma = {
      $transaction: async (callback: (tx: typeof transaction) => unknown) => callback(transaction),
    } as unknown as PrismaService;
    const result = await new BidsService(prisma).accept(bidId);
    assert.equal(result.amount, '75000.00');
    assert.equal(competitorsRejected, true);
    assert.equal(bookingCreated, true);
  });
});
