import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MembershipService } from './membership.service';
import { MembershipController } from './membership.controller';
import { MemberGuard } from './member.guard';

@Module({
  imports: [PrismaModule],
  controllers: [MembershipController],
  providers: [MembershipService, MemberGuard],
  exports: [MembershipService, MemberGuard],
})
export class MembershipModule {}
