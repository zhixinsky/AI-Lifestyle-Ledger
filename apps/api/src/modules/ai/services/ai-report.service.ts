import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import * as dayjs from 'dayjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AiChatService } from './ai-chat.service';
import { AiPromptService } from './ai-prompt.service';
import { UserMemoryService } from './user-memory.service';

interface TransactionRow {
  type: TransactionType;
  amount: number;
  remark: string | null;
  occurredAt: Date;
  categoryName: string;
}

@Injectable()
export class AiReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiChat: AiChatService,
    private readonly prompts: AiPromptService,
    private readonly memories: UserMemoryService,
  ) {}

  async generateDailyReport(userId: string, date?: string) {
    const target = date ? dayjs(date) : dayjs();
    const period = target.format('YYYY-MM-DD');
    const start = target.startOf('day').toDate();
    const end = target.endOf('day').toDate();

    const existing = await this.prisma.aiReport.findUnique({
      where: { userId_type_period: { userId, type: 'daily', period } },
    });
    if (existing) return existing;

    const transactions = await this.getTransactions(userId, start, end);
    const weekAgo = target.subtract(7, 'day').startOf('day').toDate();
    const recentTransactions = await this.getTransactions(userId, weekAgo, end);

    const content = await this.callAiForReport('daily', transactions, recentTransactions, period);

    return this.prisma.aiReport.create({
      data: {
        userId,
        type: 'daily',
        period,
        content,
        summary: content.summary || '暂无今日总结',
      },
    });
  }

  async generateMonthlyReport(userId: string, month?: string) {
    const target = month ? dayjs(`${month}-01`) : dayjs();
    const period = target.format('YYYY-MM');
    const start = target.startOf('month').toDate();
    const end = target.endOf('month').toDate();

    const existing = await this.prisma.aiReport.findUnique({
      where: { userId_type_period: { userId, type: 'monthly', period } },
    });
    if (existing) return existing;

    const transactions = await this.getTransactions(userId, start, end);

    const prevStart = target.subtract(1, 'month').startOf('month').toDate();
    const prevEnd = target.subtract(1, 'month').endOf('month').toDate();
    const prevTransactions = await this.getTransactions(userId, prevStart, prevEnd);

    const content = await this.callAiForReport('monthly', transactions, prevTransactions, period);

    const persona = content.persona || '';
    await this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId, persona, traits: content, lastAnalyzedAt: new Date() },
      update: { persona, traits: content, lastAnalyzedAt: new Date() },
    });

    return this.prisma.aiReport.create({
      data: {
        userId,
        type: 'monthly',
        period,
        content,
        summary: content.summary || '暂无本月总结',
      },
    });
  }

  async getInsight(userId: string) {
    const now = dayjs();
    const weekStart = now.subtract(7, 'day').startOf('day').toDate();
    const weekEnd = now.endOf('day').toDate();
    let [transactions, memoryContext] = await Promise.all([
      this.getTransactions(userId, weekStart, weekEnd),
      this.memories.getMemoryContext(userId, 6),
    ]);

    if (transactions.length === 0) {
      transactions = await this.getTransactions(
        userId,
        now.startOf('month').toDate(),
        now.endOf('month').toDate(),
      );
    }

    if (transactions.length === 0 && memoryContext) {
      return { text: this.memoryOnlyInsight(memoryContext), type: 'tip' };
    }

    if (transactions.length === 0) {
      return { text: '最近还没有记账哦，记一笔试试吧！', type: 'tip' };
    }

    const prompt = this.prompts.getInsightPrompt();
    const userData = this.formatTransactionsForAi(transactions);
    const aiResult = await this.aiChat.completeWithMeta([
      { role: 'system', content: prompt },
      {
        role: 'user',
        content: [
          `用户近 7 天消费数据：\n${userData}`,
          memoryContext ? `用户近期/长期记忆：\n${memoryContext}` : '',
          '请优先结合用户记忆给出更贴心、可执行的提醒。例如用户本月资金紧张时，提醒省钱和减少非必要支出。',
        ].filter(Boolean).join('\n\n'),
      },
    ]);
    const result = aiResult.content;

    if (!result || aiResult.busy || aiResult.timeout) {
      return this.fallbackInsight(transactions);
    }

    try {
      return JSON.parse(result);
    } catch {
      return this.fallbackInsight(transactions);
    }
  }

  async getUserProfile(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (profile) return profile;
    return { persona: '', traits: null, lastAnalyzedAt: null };
  }

  async getReportHistory(userId: string, type: 'daily' | 'monthly', limit = 10) {
    return this.prisma.aiReport.findMany({
      where: { userId, type },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private async getTransactions(userId: string, start: Date, end: Date): Promise<TransactionRow[]> {
    const rows = await this.prisma.transaction.findMany({
      where: { userId, occurredAt: { gte: start, lte: end } },
      include: { category: true },
      orderBy: { occurredAt: 'asc' },
    });

    return rows.map((r) => ({
      type: r.type,
      amount: Number(r.amount),
      remark: r.remark,
      occurredAt: r.occurredAt,
      categoryName: r.category.name,
    }));
  }

  private formatTransactionsForAi(transactions: TransactionRow[]): string {
    if (transactions.length === 0) return '无消费记录';

    return transactions.map((t) => {
      const time = dayjs(t.occurredAt).format('MM-DD HH:mm');
      const typeLabel = t.type === 'expense' ? '支出' : '收入';
      return `${time} | ${typeLabel} | ${t.categoryName} | ¥${t.amount} | ${t.remark || '无备注'}`;
    }).join('\n');
  }

  private async callAiForReport(
    type: 'daily' | 'monthly',
    currentData: TransactionRow[],
    compareData: TransactionRow[],
    period: string,
  ): Promise<any> {
    const prompt = type === 'daily'
      ? this.prompts.getDailyReportPrompt()
      : this.prompts.getMonthlyReportPrompt();

    const currentFormatted = this.formatTransactionsForAi(currentData);
    const compareLabel = type === 'daily' ? '近 7 天' : '上月';
    const compareFormatted = this.formatTransactionsForAi(compareData);

    const userMessage = `时间段：${period}

当前${type === 'daily' ? '今日' : '本月'}消费数据：
${currentFormatted}

${compareLabel}消费数据（用于对比）：
${compareFormatted}`;

    const result = await this.aiChat.complete([
      { role: 'system', content: prompt },
      { role: 'user', content: userMessage },
    ]);

    if (!result) {
      return this.fallbackReport(type, currentData);
    }

    try {
      return JSON.parse(result);
    } catch {
      return this.fallbackReport(type, currentData);
    }
  }

  private fallbackInsight(transactions: TransactionRow[]) {
    const expenses = transactions.filter((t) => t.type === 'expense');
    const total = expenses.reduce((sum, t) => sum + t.amount, 0);
    const categoryMap = new Map<string, number>();
    expenses.forEach((t) => {
      categoryMap.set(t.categoryName, (categoryMap.get(t.categoryName) || 0) + t.amount);
    });
    const top = [...categoryMap.entries()].sort((a, b) => b[1] - a[1])[0];

    if (top) {
      return { text: `近 7 天${top[0]}支出 ¥${top[1]}，占总支出 ${Math.round((top[1] / total) * 100)}%`, type: 'info' };
    }
    return { text: '继续保持记账习惯，数据越多分析越准！', type: 'tip' };
  }

  private memoryOnlyInsight(memoryContext: string) {
    if (memoryContext.includes('资金紧张') || memoryContext.includes('省钱')) {
      return 'AI米粒记得你想省钱，会帮你盯住不必要支出';
    }
    if (memoryContext.includes('外卖')) {
      return 'AI米粒记得你想控制外卖，今天可以少点一次';
    }
    if (memoryContext.includes('目标')) {
      return 'AI米粒记得你的目标，会帮你一起规划支出';
    }
    return 'AI米粒已记住你的偏好，会给你更贴心提醒';
  }

  private fallbackReport(type: 'daily' | 'monthly', transactions: TransactionRow[]) {
    const expenses = transactions.filter((t) => t.type === 'expense');
    const incomes = transactions.filter((t) => t.type === 'income');
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);

    const categoryMap = new Map<string, number>();
    expenses.forEach((t) => {
      categoryMap.set(t.categoryName, (categoryMap.get(t.categoryName) || 0) + t.amount);
    });

    const categoryRank = [...categoryMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        category,
        amount,
        percent: totalExpense ? Math.round((amount / totalExpense) * 100) : 0,
      }));

    const label = type === 'daily' ? '今日' : '本月';
    const summary = totalExpense > 0
      ? `${label}总支出 ¥${totalExpense}，${categoryRank[0]?.category || ''}占比最高。`
      : `${label}暂无消费记录，记得及时记账哦！`;

    return {
      totalExpense,
      totalIncome,
      categoryRank,
      anomalies: [],
      suggestions: [],
      summary,
    };
  }
}
