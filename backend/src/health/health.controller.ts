import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Check application and PostgreSQL availability' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['status', 'database'],
      properties: {
        status: { type: 'string', enum: ['ok'] },
        database: { type: 'string', enum: ['connected'] },
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'PostgreSQL is unreachable',
    schema: {
      type: 'object',
      required: ['status', 'database'],
      properties: {
        status: { type: 'string', enum: ['error'] },
        database: { type: 'string', enum: ['disconnected'] },
      },
    },
  })
  async check(): Promise<{ status: 'ok'; database: 'connected' }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'connected' };
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'disconnected' });
    }
  }
}
