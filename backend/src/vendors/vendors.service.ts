import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { Prisma } from '../generated/prisma/client';
import { UserRole } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateVendorDto } from './dto/create-vendor.dto';
import type { UpdateVendorDto } from './dto/update-vendor.dto';

const BCRYPT_ROUNDS = 12;
const EMAIL_CONFLICT_MESSAGE = 'A user or vendor with this email already exists';

const safeVendorSelection = {
  id: true,
  companyName: true,
  contactPerson: true,
  email: true,
  phone: true,
  address: true,
  category: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  },
} satisfies Prisma.VendorSelect;

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVendorDto) {
    this.validatePasswordBytes(dto.password);
    const email = this.normalizeEmail(dto.email);
    await this.ensureEmailAvailable(email);
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const vendor = await transaction.vendor.create({
          data: {
            companyName: dto.companyName.trim(),
            contactPerson: dto.contactPerson.trim(),
            email,
            phone: dto.phone.trim(),
            address: dto.address?.trim(),
            category: dto.category?.trim(),
          },
        });

        await transaction.user.create({
          data: {
            name: dto.contactPerson.trim(),
            email,
            passwordHash,
            role: UserRole.VENDOR,
            vendorId: vendor.id,
          },
        });

        return transaction.vendor.findUniqueOrThrow({
          where: { id: vendor.id },
          select: safeVendorSelection,
        });
      });
    } catch (error: unknown) {
      this.handleDatabaseError(error);
    }
  }

  async findAll(search?: string, isActive?: string) {
    const normalizedSearch = search?.trim();
    const activeFilter = this.parseActiveFilter(isActive);

    return this.prisma.vendor.findMany({
      where: {
        ...(activeFilter === undefined ? {} : { isActive: activeFilter }),
        ...(normalizedSearch
          ? {
              OR: [
                { companyName: { contains: normalizedSearch, mode: 'insensitive' as const } },
                { email: { contains: normalizedSearch, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: safeVendorSelection,
    });
  }

  async findOne(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      select: safeVendorSelection,
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    return vendor;
  }

  async update(id: string, dto: UpdateVendorDto) {
    const existing = await this.prisma.vendor.findUnique({
      where: { id },
      select: { id: true, email: true, user: { select: { id: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Vendor not found');
    }

    const email = dto.email === undefined ? undefined : this.normalizeEmail(dto.email);
    if (email !== undefined && email !== existing.email) {
      await this.ensureEmailAvailable(email, existing.id, existing.user?.id);
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        await transaction.vendor.update({
          where: { id },
          data: {
            ...(dto.companyName === undefined ? {} : { companyName: dto.companyName.trim() }),
            ...(dto.contactPerson === undefined ? {} : { contactPerson: dto.contactPerson.trim() }),
            ...(email === undefined ? {} : { email }),
            ...(dto.phone === undefined ? {} : { phone: dto.phone.trim() }),
            ...(dto.address === undefined ? {} : { address: dto.address.trim() }),
            ...(dto.category === undefined ? {} : { category: dto.category.trim() }),
          },
        });

        if (dto.contactPerson !== undefined || email !== undefined) {
          await transaction.user.updateMany({
            where: { vendorId: id },
            data: {
              ...(dto.contactPerson === undefined ? {} : { name: dto.contactPerson.trim() }),
              ...(email === undefined ? {} : { email }),
            },
          });
        }

        return transaction.vendor.findUniqueOrThrow({
          where: { id },
          select: safeVendorSelection,
        });
      });
    } catch (error: unknown) {
      this.handleDatabaseError(error);
    }
  }

  async updateStatus(id: string, isActive: boolean) {
    const existing = await this.prisma.vendor.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new NotFoundException('Vendor not found');
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        await transaction.vendor.update({ where: { id }, data: { isActive } });
        await transaction.user.updateMany({ where: { vendorId: id }, data: { isActive } });
        return transaction.vendor.findUniqueOrThrow({
          where: { id },
          select: safeVendorSelection,
        });
      });
    } catch (error: unknown) {
      this.handleDatabaseError(error);
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private validatePasswordBytes(password: string): void {
    const length = Buffer.byteLength(password, 'utf8');
    if (length < 6 || length > 72) {
      throw new BadRequestException('Password must contain between 6 and 72 UTF-8 bytes');
    }
  }

  private parseActiveFilter(value?: string): boolean | undefined {
    if (value === undefined) return undefined;
    if (value === 'true') return true;
    if (value === 'false') return false;
    throw new BadRequestException('isActive must be true or false');
  }

  private async ensureEmailAvailable(email: string, vendorId?: string, userId?: string): Promise<void> {
    const [vendor, user] = await Promise.all([
      this.prisma.vendor.findFirst({
        where: {
          email: { equals: email, mode: 'insensitive' },
          ...(vendorId === undefined ? {} : { id: { not: vendorId } }),
        },
        select: { id: true },
      }),
      this.prisma.user.findFirst({
        where: {
          email: { equals: email, mode: 'insensitive' },
          ...(userId === undefined ? {} : { id: { not: userId } }),
        },
        select: { id: true },
      }),
    ]);

    if (vendor || user) {
      throw new ConflictException(EMAIL_CONFLICT_MESSAGE);
    }
  }

  private handleDatabaseError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException(EMAIL_CONFLICT_MESSAGE);
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Vendor not found');
      }
    }
    throw new InternalServerErrorException('Unable to process vendor request');
  }
}
