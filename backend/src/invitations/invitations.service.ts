import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { WorkRequestStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

const INVITABLE_STATUSES = new Set<WorkRequestStatus>([
  WorkRequestStatus.DRAFT,
  WorkRequestStatus.OPEN,
]);

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(workRequestId: string, vendorIds: string[]) {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const request = await transaction.workRequest.findUnique({
          where: { id: workRequestId },
          select: { status: true },
        });
        if (!request) throw new NotFoundException('Work request not found');
        if (!INVITABLE_STATUSES.has(request.status)) {
          throw new ConflictException('Only DRAFT or OPEN work requests can receive invitations');
        }

        const vendors = await transaction.vendor.findMany({
          where: { id: { in: vendorIds } },
          select: { id: true, isActive: true },
        });
        if (vendors.length !== vendorIds.length) {
          throw new NotFoundException('One or more vendors do not exist');
        }
        if (vendors.some((vendor) => !vendor.isActive)) {
          throw new ConflictException('Inactive vendors cannot be invited');
        }

        const existing = await transaction.invitation.findFirst({
          where: { workRequestId, vendorId: { in: vendorIds } },
          select: { id: true },
        });
        if (existing) throw new ConflictException('One or more vendors are already invited');

        await transaction.invitation.createMany({
          data: vendorIds.map((vendorId) => ({ workRequestId, vendorId })),
        });
        if (request.status === WorkRequestStatus.DRAFT) {
          await transaction.workRequest.update({
            where: { id: workRequestId },
            data: { status: WorkRequestStatus.OPEN },
          });
        }

        return transaction.invitation.findMany({
          where: { workRequestId, vendorId: { in: vendorIds } },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            workRequestId: true,
            vendorId: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            vendor: {
              select: { id: true, companyName: true, contactPerson: true, email: true, isActive: true },
            },
          },
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error: unknown) {
      if (
        error instanceof ConflictException
        || error instanceof NotFoundException
      ) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('One or more vendors are already invited');
      }
      throw new InternalServerErrorException('Unable to create invitations');
    }
  }

  async findForRequest(workRequestId: string) {
    const request = await this.prisma.workRequest.findUnique({
      where: { id: workRequestId },
      select: { id: true },
    });
    if (!request) throw new NotFoundException('Work request not found');

    return this.prisma.invitation.findMany({
      where: { workRequestId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        vendor: {
          select: { id: true, companyName: true, contactPerson: true, email: true, isActive: true },
        },
      },
    });
  }

  async findVendorRequests(vendorId: string | null) {
    if (!vendorId) throw new NotFoundException('Vendor account not found');
    return this.prisma.invitation.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        workRequest: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            eventLocation: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async findVendorRequest(vendorId: string | null, workRequestId: string) {
    if (!vendorId) throw new NotFoundException('Assigned work request not found');
    const invitation = await this.prisma.invitation.findUnique({
      where: { workRequestId_vendorId: { workRequestId, vendorId } },
      select: {
        id: true,
        status: true,
        createdAt: true,
        workRequest: {
          select: {
            id: true,
            title: true,
            description: true,
            eventDate: true,
            eventLocation: true,
            status: true,
            items: { orderBy: { createdAt: 'asc' } },
            photos: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
    });
    if (!invitation) throw new NotFoundException('Assigned work request not found');
    return invitation;
  }
}
