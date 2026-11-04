import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../generated/prisma/client';
import { WorkRequestStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateRequestItemDto, CreateWorkRequestDto } from './dto/create-work-request.dto';
import type { UpdateWorkRequestDto } from './dto/update-work-request.dto';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS = 5;

const detailSelection = {
  id: true,
  title: true,
  description: true,
  eventDate: true,
  eventLocation: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  items: { orderBy: { createdAt: 'asc' as const } },
  photos: { orderBy: { createdAt: 'asc' as const } },
  createdBy: { select: { id: true, name: true, email: true, role: true } },
} satisfies Prisma.WorkRequestSelect;

@Injectable()
export class WorkRequestsService {
  private readonly uploadDirectory: string;
  private readonly publicBackendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.uploadDirectory = resolve(config.getOrThrow<string>('UPLOAD_DIR'), 'work-requests');
    this.publicBackendUrl = config.getOrThrow<string>('PUBLIC_BACKEND_URL').replace(/\/$/, '');
  }

  async create(dto: CreateWorkRequestDto, createdById: string) {
    return this.prisma.workRequest.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        eventDate: new Date(dto.eventDate),
        eventLocation: dto.eventLocation.trim(),
        createdById,
        items: { create: dto.items.map((item) => this.itemData(item)) },
      },
      select: detailSelection,
    });
  }

  async findAll(status?: string, search?: string) {
    const statusFilter = this.parseStatus(status);
    const normalizedSearch = search?.trim();
    return this.prisma.workRequest.findMany({
      where: {
        ...(statusFilter === undefined ? {} : { status: statusFilter }),
        ...(normalizedSearch
          ? {
              OR: [
                { title: { contains: normalizedSearch, mode: 'insensitive' as const } },
                { eventLocation: { contains: normalizedSearch, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        eventDate: true,
        eventLocation: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { items: true, invitations: true } },
      },
    });
  }

  async findOne(id: string) {
    const request = await this.prisma.workRequest.findUnique({
      where: { id },
      select: detailSelection,
    });
    if (!request) throw new NotFoundException('Work request not found');
    return request;
  }

  async update(id: string, dto: UpdateWorkRequestDto) {
    return this.prisma.$transaction(async (transaction) => {
      const request = await transaction.workRequest.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!request) throw new NotFoundException('Work request not found');
      if (request.status !== WorkRequestStatus.DRAFT) {
        throw new ConflictException('Only DRAFT work requests can be modified');
      }

      await transaction.workRequest.update({
        where: { id },
        data: {
          ...(dto.title === undefined ? {} : { title: dto.title.trim() }),
          ...(dto.description === undefined ? {} : { description: dto.description.trim() }),
          ...(dto.eventDate === undefined ? {} : { eventDate: new Date(dto.eventDate) }),
          ...(dto.eventLocation === undefined ? {} : { eventLocation: dto.eventLocation.trim() }),
        },
      });

      if (dto.items !== undefined) {
        await transaction.requestItem.deleteMany({ where: { workRequestId: id } });
        await transaction.requestItem.createMany({
          data: dto.items.map((item) => ({ workRequestId: id, ...this.itemData(item) })),
        });
      }

      return transaction.workRequest.findUniqueOrThrow({ where: { id }, select: detailSelection });
    });
  }

  async addPhotos(id: string, files: Express.Multer.File[]) {
    if (files.length === 0) throw new BadRequestException('At least one photo is required');

    const extensions = files.map((file) => {
      if (file.size > MAX_PHOTO_BYTES) throw new BadRequestException('Each photo must be 5 MB or smaller');
      const extension = detectImageExtension(file.buffer);
      if (!extension) throw new BadRequestException('Only valid JPEG, PNG, and WebP images are allowed');
      return extension;
    });

    const request = await this.prisma.workRequest.findUnique({
      where: { id },
      select: { status: true, _count: { select: { photos: true } } },
    });
    if (!request) throw new NotFoundException('Work request not found');
    if (request.status !== WorkRequestStatus.DRAFT) {
      throw new ConflictException('Photos can only be added to DRAFT work requests');
    }
    if (request._count.photos + files.length > MAX_PHOTOS) {
      throw new BadRequestException(`A work request can have at most ${MAX_PHOTOS} photos`);
    }

    await mkdir(this.uploadDirectory, { recursive: true });
    const stored = files.map((file, index) => {
      const filename = `${randomUUID()}.${extensions[index]}`;
      return {
        path: resolve(this.uploadDirectory, filename),
        imageUrl: `${this.publicBackendUrl}/uploads/work-requests/${filename}`,
        buffer: file.buffer,
      };
    });

    try {
      await Promise.all(stored.map((photo) => writeFile(photo.path, photo.buffer, { flag: 'wx' })));
      return await this.prisma.$transaction(async (transaction) => {
        const current = await transaction.workRequest.findUnique({
          where: { id },
          select: { status: true, _count: { select: { photos: true } } },
        });
        if (!current) throw new NotFoundException('Work request not found');
        if (current.status !== WorkRequestStatus.DRAFT) {
          throw new ConflictException('Photos can only be added to DRAFT work requests');
        }
        if (current._count.photos + files.length > MAX_PHOTOS) {
          throw new BadRequestException(`A work request can have at most ${MAX_PHOTOS} photos`);
        }
        await transaction.requestPhoto.createMany({
          data: stored.map((photo) => ({ workRequestId: id, imageUrl: photo.imageUrl })),
        });
        return transaction.requestPhoto.findMany({
          where: { workRequestId: id, imageUrl: { in: stored.map((photo) => photo.imageUrl) } },
          orderBy: { createdAt: 'asc' },
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error: unknown) {
      await Promise.all(stored.map((photo) => unlink(photo.path).catch(() => undefined)));
      if (
        error instanceof BadRequestException
        || error instanceof ConflictException
        || error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Unable to store reference photos');
    }
  }

  private itemData(item: CreateRequestItemDto) {
    return {
      name: item.name.trim(),
      description: item.description?.trim(),
      quantity: item.quantity,
      unit: item.unit?.trim(),
    };
  }

  private parseStatus(status?: string): WorkRequestStatus | undefined {
    if (status === undefined) return undefined;
    if (Object.values(WorkRequestStatus).includes(status as WorkRequestStatus)) {
      return status as WorkRequestStatus;
    }
    throw new BadRequestException('Invalid work request status');
  }
}

export function detectImageExtension(buffer: Buffer): 'jpg' | 'png' | 'webp' | undefined {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (
    buffer.length >= 8
    && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) return 'png';
  if (
    buffer.length >= 12
    && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) return 'webp';
  return undefined;
}
