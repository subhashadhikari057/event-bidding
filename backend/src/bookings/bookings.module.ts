import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { PaymentsService } from './payments.service';
import { VendorBookingsController } from './vendor-bookings.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [BookingsController, VendorBookingsController],
  providers: [BookingsService, PaymentsService],
})
export class BookingsModule {}
