import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { CurrentUser, type AuthUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BudgetsService } from '../budgets/budgets.service';
import { CategoriesService } from '../categories/categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AiChatDto } from './dto/ai-chat.dto';
import { ConfirmBillDto } from './dto/confirm-bill.dto';
import { ParseBillDto } from './dto/parse-bill.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { AiFinancialChatService } from './services/ai-financial-chat.service';
import { AiReportService } from './services/ai-report.service';
import { BillParserService } from './services/bill-parser.service';
import type { ParsedBillTransaction } from './types/parsed-bill';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly billParser: BillParserService,
    private readonly prisma: PrismaService,
    private readonly categories: CategoriesService,
    private readonly transactions: TransactionsService,
    private readonly reportService: AiReportService,
    private readonly chatService: AiFinancialChatService,
    private readonly budgetsService: BudgetsService,
  ) {}

  /* ========== Phase 2: 账单解析 ========== */

  @Post('bills/parse')
  async parseBill(@CurrentUser() user: AuthUser, @Body() dto: ParseBillDto) {
    const result = await this.billParser.parse(dto.input, dto.occurredAt);
    const enriched = await this.attachCategoryIds(result.transactions);
    const log = await this.prisma.aiLog.create({
      data: {
        userId: user.sub,
        rawInput: dto.input,
        aiResponse: { transactions: enriched }
      }
    });

    return {
      logId: log.id,
      transactions: enriched
    };
  }

  @Post('bills/:logId/confirm')
  async confirmBill(@CurrentUser() user: AuthUser, @Param('logId') logId: string, @Body() dto: ConfirmBillDto) {
    const enriched = await this.attachCategoryIds(dto.transactions.map((item) => ({
      ...item,
      tags: item.tags || []
    })));
    const saved = [];

    for (const item of enriched) {
      saved.push(await this.transactions.create(user.sub, {
        type: item.type,
        amount: item.amount,
        categoryId: item.categoryId,
        occurredAt: item.occurredAt,
        remark: item.remark,
        tags: item.tags
      }));
    }

    await this.prisma.aiLog.update({
      where: { id: logId },
      data: {
        finalResult: { transactions: enriched },
        userModified: JSON.stringify(dto.transactions) !== JSON.stringify(enriched),
        confirmed: true
      }
    });

    return {
      success: true,
      transactions: saved
    };
  }

  /* ========== Phase 3: AI 财务分析 ========== */

  @Get('report/daily')
  async dailyReport(@CurrentUser() user: AuthUser, @Query() query: ReportQueryDto) {
    return this.reportService.generateDailyReport(user.sub, query.date);
  }

  @Get('report/monthly')
  async monthlyReport(@CurrentUser() user: AuthUser, @Query() query: ReportQueryDto) {
    return this.reportService.generateMonthlyReport(user.sub, query.month);
  }

  @Get('report/history')
  async reportHistory(
    @CurrentUser() user: AuthUser,
    @Query('type') type: 'daily' | 'monthly' = 'daily',
  ) {
    return this.reportService.getReportHistory(user.sub, type);
  }

  @Get('insight')
  async insight(@CurrentUser() user: AuthUser) {
    return this.reportService.getInsight(user.sub);
  }

  @Get('profile')
  async userProfile(@CurrentUser() user: AuthUser) {
    return this.reportService.getUserProfile(user.sub);
  }

  @Post('chat')
  async chat(@CurrentUser() user: AuthUser, @Body() dto: AiChatDto) {
    return this.chatService.chat(user.sub, dto.message, dto.history);
  }

  @Get('greeting')
  async greeting(@CurrentUser() user: AuthUser) {
    return this.chatService.getGreeting(user.sub);
  }

  /* ========== Phase 4: AI 预算建议 ========== */

  @Get('budget-advice')
  async budgetAdvice(@CurrentUser() user: AuthUser, @Query('month') month?: string) {
    const overview = await this.budgetsService.overview(user.sub, month);
    return this.chatService.getBudgetAdvice(user.sub, overview);
  }

  /* ========== Private ========== */

  private async attachCategoryIds(transactions: ParsedBillTransaction[]) {
    await this.categories.ensureDefaults();
    const categories = await this.categories.list();

    return transactions.map((item) => {
      const fallbackName = item.type === TransactionType.income ? '其它收入' : '其它';
      const category = categories.find((entry) => entry.name === item.category && entry.type === item.type)
        || categories.find((entry) => entry.name === fallbackName && entry.type === item.type)
        || categories[0];

      return {
        ...item,
        category: category.name,
        categoryId: category.id
      };
    });
  }
}
