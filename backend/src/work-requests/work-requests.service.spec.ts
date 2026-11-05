import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConflictException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { WorkRequestStatus } from '../generated/prisma/enums';
import type { PrismaService } from '../prisma/prisma.service';
import { CreateWorkRequestDto } from './dto/create-work-request.dto';
import { detectImageExtension, WorkRequestsService } from './work-requests.service';

const requestId = '11111111-1111-4111-8111-111111111111';
const adminId = '22222222-2222-4222-8222-222222222222';

function config(): ConfigService {
  return {
    getOrThrow: (key: string) => ({
      UPLOAD_DIR: './uploads-test',
    })[key],
  } as unknown as ConfigService;
}

describe('WorkRequestsService', () => {
  it('creates a request with nested items and the authenticated admin ID', async () => {
    let createArgs: Record<string, unknown> | undefined;
    const prisma = {
      workRequest: {
        create: async (args: Record<string, unknown>) => {
          createArgs = args;
          return { id: requestId, status: WorkRequestStatus.DRAFT };
        },
      },
    } as unknown as PrismaService;
    const service = new WorkRequestsService(prisma, config());
    await service.create({
      title: ' Wedding ',
      description: ' Decoration ',
      eventDate: '2026-12-15T10:00:00.000Z',
      eventLocation: ' Kathmandu ',
      items: [{ name: ' Stage ', quantity: 1, unit: ' set ' }],
    }, adminId);

    const data = createArgs?.data as { createdById: string; title: string; items: { create: unknown[] } };
    assert.equal(data.createdById, adminId);
    assert.equal(data.title, 'Wedding');
    assert.equal(data.items.create.length, 1);
  });

  it('rejects modifying an OPEN request', async () => {
    const transaction = {
      workRequest: { findUnique: async () => ({ status: WorkRequestStatus.OPEN }) },
    };
    const prisma = {
      $transaction: async (callback: (tx: typeof transaction) => unknown) => callback(transaction),
    } as unknown as PrismaService;
    const service = new WorkRequestsService(prisma, config());
    await assert.rejects(service.update(requestId, { title: 'Changed' }), ConflictException);
  });

  it('rejects invalid nested item quantities through DTO validation', async () => {
    const dto = plainToInstance(CreateWorkRequestDto, {
      title: 'Wedding',
      description: 'Decoration',
      eventDate: '2026-12-15T10:00:00.000Z',
      eventLocation: 'Kathmandu',
      items: [{ name: 'Stage', quantity: 0 }],
    });
    const errors = await validate(dto);
    assert.ok(errors.some((error) => error.property === 'items'));
  });

  it('detects supported image signatures and rejects arbitrary bytes', () => {
    assert.equal(detectImageExtension(Buffer.from([0xff, 0xd8, 0xff, 0x00])), 'jpg');
    assert.equal(detectImageExtension(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'png');
    assert.equal(detectImageExtension(Buffer.from('RIFF0000WEBP')), 'webp');
    assert.equal(detectImageExtension(Buffer.from('not-an-image')), undefined);
  });
});
