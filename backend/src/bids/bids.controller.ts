import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { COOKIE_AUTH_SCHEME } from '../auth/auth.constants';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../generated/prisma/enums';
import { BidsService } from './bids.service';

@ApiTags('Bids')
@ApiCookieAuth(COOKIE_AUTH_SCHEME)
@ApiUnauthorizedResponse({ description: 'Authentication is missing, invalid, or expired' })
@ApiForbiddenResponse({ description: 'ADMIN role is required' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller()
export class BidsController {
  constructor(private readonly bids: BidsService) {}

  @Get('bids/summary')
  @ApiOperation({ summary: 'Get real-time ADMIN bid counts for dashboard statistics' })
  @ApiOkResponse({
    description: 'Total bids and counts grouped by status',
    schema: {
      type: 'object',
      required: ['totalBids', 'submitted', 'accepted', 'rejected'],
      properties: {
        totalBids: { type: 'integer', example: 12 },
        submitted: { type: 'integer', example: 5 },
        accepted: { type: 'integer', example: 3 },
        rejected: { type: 'integer', example: 4 },
      },
    },
  })
  summary() {
    return this.bids.summary();
  }

  @Get('work-requests/:id/bids')
  @ApiOperation({ summary: 'Compare all submitted bids for a work request without automatic selection' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({
    description: 'Bids sorted by amount with count and lowest NPR bid',
    schema: {
      type: 'object',
      properties: {
        workRequestId: { type: 'string', format: 'uuid' },
        totalBids: { type: 'integer', example: 3 },
        lowestBid: { type: 'string', nullable: true, example: '75000.00' },
        bids: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Work request ID is not a UUID' })
  @ApiNotFoundResponse({ description: 'Work request does not exist' })
  compare(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.bids.compare(id);
  }

  @Post('bids/:id/accept')
  @ApiOperation({ summary: 'Accept one bid, reject competitors, and create a confirmed booking atomically' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Confirmed booking created from the selected bid' })
  @ApiBadRequestResponse({ description: 'Bid ID is not a UUID' })
  @ApiNotFoundResponse({ description: 'Bid does not exist' })
  @ApiConflictResponse({ description: 'Bid is no longer selectable or the request is already booked' })
  accept(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.bids.accept(id);
  }
}
