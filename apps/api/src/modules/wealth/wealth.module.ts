import { Module } from '@nestjs/common';
import { AiChatService } from '../ai/services/ai-chat.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WealthAiService } from './wealth-ai.service';
import { WealthController } from './wealth.controller';
import { WealthService } from './wealth.service';

@Module({
  imports: [PrismaModule],
  controllers: [WealthController],
  providers: [WealthService, WealthAiService, AiChatService],
  exports: [WealthService, WealthAiService],
})
export class WealthModule {}
