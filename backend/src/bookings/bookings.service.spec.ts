import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConflictException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { BookingStatus, PaymentMethod } from '../generated/prisma/enums';
import type { PrismaService } from '../prisma/prisma.service';
import { paymentSummary } from './bookings.service';
import { PaymentsService } from './payments.service';

const bookingId = '11111111-1111-4111-8111-111111111111';

describe('Booking payments', () => {
  it('calculates money using exact Decimal arithmetic', () => {
    const summary = paymentSummary(
      new Prisma.Decimal('80000.00'),
      [{ amount: new Prisma.Decimal('20000.10') }, { amount: new Prisma.Decimal('9999.90') }],
    );
    assert.deepEqual(summary, {
      bookingAmount: '80000.00',
      totalPaid: '30000.00',
      pendingAmount: '50000.00',
      paymentStatus: 'PARTIALLY_PAID',
    });
  });

  it('rejects a payment that exceeds the remaining balance', async () => {
    const transaction = {
      booking: {
        findUnique: async () => ({
          amount: new Prisma.Decimal('80000.00'),
          status: BookingStatus.CONFIRMED,
          payments: [{ amount: new Prisma.Decimal('70000.00') }],
        }),
      },
    };
    const prisma = {
      $transaction: async (callback: (tx: typeof transaction) => unknown) => callback(transaction),
    } as unknown as PrismaService;
    await assert.rejects(
      new PaymentsService(prisma).create(bookingId, {
        amount: '10000.01', method: PaymentMethod.BANK_TRANSFER,
      }),
      ConflictException,
    );
  });

  it('records a valid payment and returns the updated summary', async () => {
    const transaction = {
      booking: {
        findUnique: async () => ({
          amount: new Prisma.Decimal('80000.00'),
          status: BookingStatus.CONFIRMED,
          payments: [{ amount: new Prisma.Decimal('20000.00') }],
        }),
      },
      payment: {
        create: async () => ({
          id: 'payment', bookingId, amount: new Prisma.Decimal('10000.00'),
          method: PaymentMethod.CASH, reference: null, notes: null,
          paidAt: new Date(), createdAt: new Date(),
        }),
      },
    };
    const prisma = {
      $transaction: async (callback: (tx: typeof transaction) => unknown) => callback(transaction),
    } as unknown as PrismaService;
    const result = await new PaymentsService(prisma).create(bookingId, {
      amount: '10000.00', method: PaymentMethod.CASH,
    });
    assert.equal(result.payment.amount, '10000.00');
    assert.equal(result.summary.totalPaid, '30000.00');
    assert.equal(result.summary.pendingAmount, '50000.00');
  });
});
