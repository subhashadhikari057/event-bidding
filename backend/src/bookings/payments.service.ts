import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { BookingStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { CreatePaymentDto } from './dto/create-payment.dto';
import { paymentSummary } from './bookings.service';

const MAX_MONEY = new Prisma.Decimal('9999999999.99');

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(bookingId: string, dto: CreatePaymentDto) {
    const amount = new Prisma.Decimal(dto.amount);
    if (amount.lte(0) || amount.gt(MAX_MONEY)) {
      throw new BadRequestException('amount must be greater than zero and no more than 9999999999.99');
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const booking = await transaction.booking.findUnique({
          where: { id: bookingId },
          select: {
            amount: true,
            status: true,
            payments: { select: { amount: true } },
          },
        });
        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.status !== BookingStatus.CONFIRMED) {
          throw new ConflictException('Payments can only be recorded against CONFIRMED bookings');
        }

        const current = paymentSummary(booking.amount, booking.payments);
        const totalPaid = new Prisma.Decimal(current.totalPaid);
        if (totalPaid.plus(amount).gt(booking.amount)) {
          throw new ConflictException('Payment exceeds the remaining booking balance');
        }

        const payment = await transaction.payment.create({
          data: {
            bookingId,
            amount,
            method: dto.method,
            reference: dto.reference?.trim(),
            notes: dto.notes?.trim(),
            paidAt: dto.paidAt === undefined ? undefined : new Date(dto.paidAt),
          },
        });
        return {
          message: 'Payment recorded successfully',
          payment: { ...payment, amount: payment.amount.toFixed(2) },
          summary: paymentSummary(booking.amount, [...booking.payments, { amount }]),
        };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException
        || error instanceof ConflictException
        || error instanceof BadRequestException
      ) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException('Concurrent payment update detected; retry with the current balance');
      }
      throw error;
    }
  }
}
