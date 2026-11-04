import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
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
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../generated/prisma/enums';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';

@ApiTags('Vendor Bids')
@ApiCookieAuth(COOKIE_AUTH_SCHEME)
@ApiUnauthorizedResponse({ description: 'Authentication is missing, invalid, or expired' })
@ApiForbiddenResponse({ description: 'VENDOR role is required' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.VENDOR)
@Controller('vendor')
export class VendorBidsController {
  constructor(private readonly bids: BidsService) {}

  @Post('requests/:id/bid')
  @ApiOperation({ summary: 'Submit one final NPR quotation for an assigned OPEN request' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Work request ID' })
  @ApiCreatedResponse({
    description: 'Bid submitted and invitation marked RESPONDED',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        invitationId: { type: 'string', format: 'uuid' },
        amount: { type: 'string', example: '75000.00' },
        notes: { type: 'string', nullable: true },
        status: { type: 'string', example: 'SUBMITTED' },
        submittedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid ID or decimal amount' })
  @ApiNotFoundResponse({ description: 'Work request is missing or not assigned to this vendor' })
  @ApiConflictResponse({ description: 'Request is not OPEN, vendor is inactive, or a bid already exists' })
  submit(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBidDto,
  ) {
    return this.bids.submit(id, user.vendorId, dto);
  }

  @Get('bids')
  @ApiOperation({ summary: "List only the authenticated vendor's quotations" })
  @ApiOkResponse({ description: 'Vendor bids newest first with work request summaries' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.bids.findVendorBids(user.vendorId);
  }
}
