import { Module } from '@nestjs/common';
import { BudgetsModule } from '../budgets/budgets.module';
import { CategoriesModule } from '../categories/categories.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { AiController } from './ai.controller';
import { AiChatService } from './services/ai-chat.service';
import { AiFinancialChatService } from './services/ai-financial-chat.service';
import { AiPromptService } from './services/ai-prompt.service';
import { AiReportService } from './services/ai-report.service';
import { BillParserService } from './services/bill-parser.service';
import { UserMemoryService } from './services/user-memory.service';

@Module({
  imports: [CategoriesModule, TransactionsModule, BudgetsModule],
  controllers: [AiController],
  providers: [
    AiChatService,
    AiPromptService,
    BillParserService,
    AiReportService,
    AiFinancialChatService,
    UserMemoryService,
  ],
  exports: [AiChatService, BillParserService, AiFinancialChatService],
})
export class AiModule {}
