import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
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
import { BookingsService } from './bookings.service';

@ApiTags('Vendor Bookings')
@ApiCookieAuth(COOKIE_AUTH_SCHEME)
@ApiUnauthorizedResponse({ description: 'Authentication is missing, invalid, or expired' })
@ApiForbiddenResponse({ description: 'VENDOR role is required' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.VENDOR)
@Controller('vendor/bookings')
export class VendorBookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  @ApiOperation({ summary: "List only bookings awarded to the authenticated vendor" })
  @ApiOkResponse({ description: 'Vendor bookings with event, payment history, paid, and pending amounts' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.bookings.findVendorBookings(user.vendorId);
  }
}
