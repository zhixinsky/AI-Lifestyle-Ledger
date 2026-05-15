import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WealthAiService } from './wealth-ai.service';
import { WealthController } from './wealth.controller';
import { WealthService } from './wealth.service';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [WealthController],
  providers: [WealthService, WealthAiService],
  exports: [WealthService, WealthAiService],
})
export class WealthModule {}
