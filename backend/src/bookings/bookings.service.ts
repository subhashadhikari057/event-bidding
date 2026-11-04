import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { BookingStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

type PaymentAmount = { amount: Prisma.Decimal };

export function paymentSummary(bookingAmount: Prisma.Decimal, payments: PaymentAmount[]) {
  const totalPaid = payments.reduce(
    (total, payment) => total.plus(payment.amount),
    new Prisma.Decimal(0),
  );
  const pendingAmount = bookingAmount.minus(totalPaid);
  return {
    bookingAmount: bookingAmount.toFixed(2),
    totalPaid: totalPaid.toFixed(2),
    pendingAmount: pendingAmount.toFixed(2),
    paymentStatus: totalPaid.eq(0)
      ? 'UNPAID'
      : pendingAmount.eq(0)
        ? 'PAID'
        : 'PARTIALLY_PAID',
  };
}

const bookingSelection = {
  id: true,
  amount: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  workRequest: {
    select: { id: true, title: true, eventDate: true, eventLocation: true, status: true },
  },
  bid: {
    select: {
      id: true,
      amount: true,
      notes: true,
      status: true,
      submittedAt: true,
      invitation: {
        select: {
          vendor: {
            select: { id: true, companyName: true, contactPerson: true, email: true, phone: true },
          },
        },
      },
    },
  },
  payments: {
    orderBy: { paidAt: 'desc' as const },
    select: {
      id: true,
      amount: true,
      method: true,
      reference: true,
      notes: true,
      paidAt: true,
      createdAt: true,
    },
  },
} satisfies Prisma.BookingSelect;

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(status?: string) {
    const statusFilter = this.parseStatus(status);
    const bookings = await this.prisma.booking.findMany({
      where: statusFilter === undefined ? {} : { status: statusFilter },
      orderBy: { createdAt: 'desc' },
      select: bookingSelection,
    });
    return bookings.map((booking) => this.mapBooking(booking));
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      select: bookingSelection,
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return this.mapBooking(booking);
  }

  async findVendorBookings(vendorId: string | null) {
    if (!vendorId) return [];
    const bookings = await this.prisma.booking.findMany({
      where: { bid: { invitation: { vendorId } } },
      orderBy: { createdAt: 'desc' },
      select: bookingSelection,
    });
    return bookings.map((booking) => {
      const mapped = this.mapBooking(booking);
      return {
        id: mapped.id,
        status: mapped.status,
        createdAt: mapped.createdAt,
        workRequest: mapped.workRequest,
        acceptedAmount: mapped.bid.amount,
        payments: mapped.payments,
        summary: mapped.summary,
      };
    });
  }

  private mapBooking(booking: Prisma.BookingGetPayload<{ select: typeof bookingSelection }>) {
    return {
      id: booking.id,
      status: booking.status,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      workRequest: booking.workRequest,
      vendor: booking.bid.invitation.vendor,
      bid: {
        id: booking.bid.id,
        amount: booking.bid.amount.toFixed(2),
        notes: booking.bid.notes,
        status: booking.bid.status,
        submittedAt: booking.bid.submittedAt,
      },
      amount: booking.amount.toFixed(2),
      payments: booking.payments.map((payment) => ({
        ...payment,
        amount: payment.amount.toFixed(2),
      })),
      summary: paymentSummary(booking.amount, booking.payments),
    };
  }

  private parseStatus(status?: string): BookingStatus | undefined {
    if (status === undefined) return undefined;
    if (Object.values(BookingStatus).includes(status as BookingStatus)) return status as BookingStatus;
    throw new BadRequestException('Invalid booking status');
  }
}
