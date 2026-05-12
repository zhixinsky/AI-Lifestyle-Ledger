import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SavingGoalsController } from './saving-goals.controller';
import { SavingGoalsService } from './saving-goals.service';

@Module({
  imports: [PrismaModule],
  controllers: [SavingGoalsController],
  providers: [SavingGoalsService],
  exports: [SavingGoalsService],
})
export class SavingGoalsModule {}
