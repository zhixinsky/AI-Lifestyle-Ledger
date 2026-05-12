import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GrowthService } from './growth.service';
import { GrowthController } from './growth.controller';

@Module({
  imports: [PrismaModule],
  controllers: [GrowthController],
  providers: [GrowthService],
  exports: [GrowthService],
})
export class GrowthModule {}
