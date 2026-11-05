import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { BidStatus, BookingStatus, InvitationStatus, WorkRequestStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateBidDto } from './dto/create-bid.dto';

const MAX_MONEY = new Prisma.Decimal('9999999999.99');

@Injectable()
export class BidsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const counts = await this.prisma.bid.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const byStatus = new Map(counts.map((entry) => [entry.status, entry._count._all]));
    const submitted = byStatus.get(BidStatus.SUBMITTED) ?? 0;
    const accepted = byStatus.get(BidStatus.ACCEPTED) ?? 0;
    const rejected = byStatus.get(BidStatus.REJECTED) ?? 0;
    return {
      totalBids: submitted + accepted + rejected,
      submitted,
      accepted,
      rejected,
    };
  }

  async submit(workRequestId: string, vendorId: string | null, dto: CreateBidDto) {
    if (!vendorId) throw new NotFoundException('Assigned work request not found');
    const amount = this.parseAmount(dto.amount);

    try {
      const bid = await this.prisma.$transaction(async (transaction) => {
        const request = await transaction.workRequest.findUnique({
          where: { id: workRequestId },
          select: { status: true },
        });
        if (!request) throw new NotFoundException('Work request not found');
        if (request.status !== WorkRequestStatus.OPEN) {
          throw new ConflictException('Bids can only be submitted for OPEN work requests');
        }

        const invitation = await transaction.invitation.findUnique({
          where: { workRequestId_vendorId: { workRequestId, vendorId } },
          select: {
            id: true,
            bid: { select: { id: true } },
            vendor: { select: { isActive: true, user: { select: { isActive: true } } } },
          },
        });
        if (!invitation) throw new NotFoundException('Assigned work request not found');
        if (!invitation.vendor.isActive || !invitation.vendor.user?.isActive) {
          throw new ConflictException('Inactive vendor accounts cannot submit bids');
        }
        if (invitation.bid) throw new ConflictException('A bid has already been submitted for this invitation');

        const created = await transaction.bid.create({
          data: {
            invitationId: invitation.id,
            amount,
            notes: dto.notes?.trim(),
          },
        });
        await transaction.invitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.RESPONDED },
        });
        return created;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      return this.safeBid(bid);
    } catch (error: unknown) {
      this.handleWriteConflict(error, 'A bid has already been submitted for this invitation');
    }
  }

  async findVendorBids(vendorId: string | null) {
    if (!vendorId) return [];
    const bids = await this.prisma.bid.findMany({
      where: { invitation: { vendorId } },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        invitationId: true,
        amount: true,
        notes: true,
        status: true,
        submittedAt: true,
        invitation: {
          select: {
            workRequest: {
              select: { id: true, title: true, eventDate: true, eventLocation: true, status: true },
            },
          },
        },
      },
    });
    return bids.map((bid) => ({
      id: bid.id,
      invitationId: bid.invitationId,
      amount: bid.amount.toFixed(2),
      notes: bid.notes,
      status: bid.status,
      submittedAt: bid.submittedAt,
      workRequest: bid.invitation.workRequest,
    }));
  }

  async compare(workRequestId: string) {
    const request = await this.prisma.workRequest.findUnique({
      where: { id: workRequestId },
      select: { id: true },
    });
    if (!request) throw new NotFoundException('Work request not found');

    const bids = await this.prisma.bid.findMany({
      where: { invitation: { workRequestId } },
      orderBy: { amount: 'asc' },
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
    });
    return {
      workRequestId,
      totalBids: bids.length,
      lowestBid: bids[0]?.amount.toFixed(2) ?? null,
      bids: bids.map((bid) => ({
        id: bid.id,
        vendor: bid.invitation.vendor,
        amount: bid.amount.toFixed(2),
        notes: bid.notes,
        status: bid.status,
        submittedAt: bid.submittedAt,
        accepted: bid.status === BidStatus.ACCEPTED,
      })),
    };
  }

  async accept(bidId: string) {
    try {
      const booking = await this.prisma.$transaction(async (transaction) => {
        const bid = await transaction.bid.findUnique({
          where: { id: bidId },
          select: {
            id: true,
            amount: true,
            status: true,
            invitation: {
              select: {
                workRequestId: true,
                workRequest: { select: { status: true, booking: { select: { id: true } } } },
                vendor: { select: { isActive: true, user: { select: { isActive: true } } } },
              },
            },
          },
        });
        if (!bid) throw new NotFoundException('Bid not found');
        if (
          bid.status !== BidStatus.SUBMITTED
          || bid.invitation.workRequest.status !== WorkRequestStatus.OPEN
          || bid.invitation.workRequest.booking
        ) {
          throw new ConflictException('This bid can no longer be accepted');
        }
        if (!bid.invitation.vendor.isActive || !bid.invitation.vendor.user?.isActive) {
          throw new ConflictException('An inactive vendor bid cannot be accepted');
        }

        const lockedRequest = await transaction.workRequest.updateMany({
          where: { id: bid.invitation.workRequestId, status: WorkRequestStatus.OPEN },
          data: { status: WorkRequestStatus.BOOKED },
        });
        if (lockedRequest.count !== 1) throw new ConflictException('Work request is already booked');

        const selected = await transaction.bid.updateMany({
          where: { id: bid.id, status: BidStatus.SUBMITTED },
          data: { status: BidStatus.ACCEPTED },
        });
        if (selected.count !== 1) throw new ConflictException('This bid can no longer be accepted');

        await transaction.bid.updateMany({
          where: {
            id: { not: bid.id },
            status: BidStatus.SUBMITTED,
            invitation: { workRequestId: bid.invitation.workRequestId },
          },
          data: { status: BidStatus.REJECTED },
        });

        return transaction.booking.create({
          data: {
            workRequestId: bid.invitation.workRequestId,
            bidId: bid.id,
            amount: bid.amount,
            status: BookingStatus.CONFIRMED,
          },
          select: {
            id: true,
            workRequestId: true,
            bidId: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      return { ...booking, amount: booking.amount.toFixed(2) };
    } catch (error: unknown) {
      this.handleWriteConflict(error, 'Work request is already booked or selection is no longer valid');
    }
  }

  private parseAmount(value: string): Prisma.Decimal {
    const amount = new Prisma.Decimal(value);
    if (amount.lte(0) || amount.gt(MAX_MONEY)) {
      throw new BadRequestException('amount must be greater than zero and no more than 9999999999.99');
    }
    return amount;
  }

  private safeBid(bid: {
    id: string;
    invitationId: string;
    amount: Prisma.Decimal;
    notes: string | null;
    status: BidStatus;
    submittedAt: Date;
  }) {
    return { ...bid, amount: bid.amount.toFixed(2) };
  }

  private handleWriteConflict(error: unknown, message: string): never {
    if (
      error instanceof NotFoundException
      || error instanceof ConflictException
      || error instanceof BadRequestException
    ) throw error;
    if (
      error instanceof Prisma.PrismaClientKnownRequestError
      && (error.code === 'P2002' || error.code === 'P2034')
    ) {
      throw new ConflictException(message);
    }
    throw error;
  }
}
