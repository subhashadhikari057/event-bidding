import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
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
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { COOKIE_AUTH_SCHEME } from '../auth/auth.constants';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BookingStatus, UserRole } from '../generated/prisma/enums';
import { BookingsService } from './bookings.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Bookings and Payments')
@ApiCookieAuth(COOKIE_AUTH_SCHEME)
@ApiUnauthorizedResponse({ description: 'Authentication is missing, invalid, or expired' })
@ApiForbiddenResponse({ description: 'ADMIN role is required' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly payments: PaymentsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List bookings with precise payment summaries, newest first' })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus })
  @ApiOkResponse({ description: 'Admin booking table data' })
  @ApiBadRequestResponse({ description: 'Invalid booking status filter' })
  findAll(@Query('status') status?: string) {
    return this.bookings.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking, winning bid, vendor, and payment history' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Full safe booking details and calculated payment summary' })
  @ApiBadRequestResponse({ description: 'Booking ID is not a UUID' })
  @ApiNotFoundResponse({ description: 'Booking does not exist' })
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.bookings.findOne(id);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Record an externally completed payment without processing funds' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Payment recorded with updated precise balance summary' })
  @ApiBadRequestResponse({ description: 'Invalid booking ID, amount, method, or paidAt' })
  @ApiNotFoundResponse({ description: 'Booking does not exist' })
  @ApiConflictResponse({ description: 'Booking is not confirmed or payment exceeds remaining balance' })
  createPayment(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.payments.create(id, dto);
  }
}
