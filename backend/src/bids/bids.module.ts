import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BidsController } from './bids.controller';
import { BidsService } from './bids.service';
import { VendorBidsController } from './vendor-bids.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [BidsController, VendorBidsController],
  providers: [BidsService],
})
export class BidsModule {}
