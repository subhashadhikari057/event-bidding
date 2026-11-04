import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { VendorRequestsController } from './vendor-requests.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [InvitationsController, VendorRequestsController],
  providers: [InvitationsService],
})
export class InvitationsModule {}
