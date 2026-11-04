import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkRequestsController } from './work-requests.controller';
import { WorkRequestsService } from './work-requests.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WorkRequestsController],
  providers: [WorkRequestsService],
})
export class WorkRequestsModule {}
