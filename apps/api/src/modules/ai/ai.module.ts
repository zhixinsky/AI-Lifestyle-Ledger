import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { CategoriesModule } from '../categories/categories.module';
import { LifeSpacesModule } from '../life-spaces/life-spaces.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { AiController } from './ai.controller';
import { AiChatService } from './services/ai-chat.service';
import { AiConcurrencyService } from './services/ai-concurrency.service';
import { AiFinancialChatService } from './services/ai-financial-chat.service';
import { AiPromptService } from './services/ai-prompt.service';
import { AiReportService } from './services/ai-report.service';
import { BillParserService } from './services/bill-parser.service';
import { UserMemoryService } from './services/user-memory.service';

@Module({
  imports: [PrismaModule, CategoriesModule, TransactionsModule, BudgetsModule, LifeSpacesModule],
  controllers: [AiController],
  providers: [
    AiChatService,
    AiConcurrencyService,
    AiPromptService,
    BillParserService,
    AiReportService,
    AiFinancialChatService,
    UserMemoryService,
  ],
  exports: [AiChatService, AiConcurrencyService, BillParserService, AiFinancialChatService],
})
export class AiModule {}
