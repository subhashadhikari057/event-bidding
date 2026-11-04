import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BidsModule } from './bids/bids.module';
import { BookingsModule } from './bookings/bookings.module';
import { validateEnvironment } from './config/environment';
import { HealthModule } from './health/health.module';
import { InvitationsModule } from './invitations/invitations.module';
import { VendorsModule } from './vendors/vendors.module';
import { WorkRequestsModule } from './work-requests/work-requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    AuthModule,
    HealthModule,
    VendorsModule,
    WorkRequestsModule,
    InvitationsModule,
    BidsModule,
    BookingsModule,
  ],
})
export class AppModule {}
