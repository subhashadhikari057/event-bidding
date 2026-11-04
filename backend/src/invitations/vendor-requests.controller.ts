import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
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
import { InvitationsService } from './invitations.service';

@ApiTags('Vendor Requests')
@ApiCookieAuth(COOKIE_AUTH_SCHEME)
@ApiUnauthorizedResponse({ description: 'Authentication is missing, invalid, or expired' })
@ApiForbiddenResponse({ description: 'VENDOR role is required' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.VENDOR)
@Controller('vendor/requests')
export class VendorRequestsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Get()
  @ApiOperation({ summary: "List only the authenticated vendor's assigned work requests" })
  @ApiOkResponse({ description: 'Assigned requests with the current vendor invitation status' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.invitations.findVendorRequests(user.vendorId);
  }

  @Get(':id')
  @ApiOperation({ summary: "Get an assigned request without exposing other vendors' data" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Assigned request details, items, photos, and own invitation status' })
  @ApiBadRequestResponse({ description: 'Work request ID is not a UUID' })
  @ApiNotFoundResponse({ description: 'Request is not assigned to this vendor' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.invitations.findVendorRequest(user.vendorId, id);
  }
}
