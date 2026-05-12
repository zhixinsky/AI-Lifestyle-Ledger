import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import * as dayjs from 'dayjs';
import { CategoriesService } from '../categories/categories.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriesService: CategoriesService
  ) {}

  async dashboard(userId: string) {
    await this.categoriesService.ensureDefaults();
    const now = dayjs();
    const todayStart = now.startOf('day').toDate();
    const todayEnd = now.endOf('day').toDate();
    const monthStart = now.startOf('month').toDate();
    const monthEnd = now.endOf('month').toDate();

    const currentMonth = now.format('YYYY-MM');

    const [today, monthExpense, monthIncome, recentTransactions, user, totalBudget] = await Promise.all([
      this.sum(userId, TransactionType.expense, todayStart, todayEnd),
      this.sum(userId, TransactionType.expense, monthStart, monthEnd),
      this.sum(userId, TransactionType.income, monthStart, monthEnd),
      this.prisma.transaction.findMany({
        where: { userId },
        include: { category: true, tags: { include: { tag: true } } },
        orderBy: { occurredAt: 'desc' },
        take: 3
      }),
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.budget.findFirst({
        where: { userId, month: currentMonth, categoryId: null },
      }),
    ]);

    return {
      todayExpense: today,
      monthExpense,
      monthIncome,
      monthlyBudget: totalBudget ? Number(totalBudget.amount) : 0,
      streakDays: user?.streakDays || 0,
      recentTransactions: recentTransactions.map((row) => ({
        id: row.id,
        type: row.type,
        amount: Number(row.amount),
        categoryId: row.categoryId,
        category: row.category,
        occurredAt: row.occurredAt.toISOString(),
        remark: row.remark,
        voucherUrl: row.voucherUrl,
        tags: row.tags.map((item) => item.tag.name)
      }))
    };
  }

  async monthly(
    userId: string,
    month?: string,
    period: 'week' | 'month' | 'year' = 'month',
    filterType?: 'expense' | 'income',
  ) {
    await this.categoriesService.ensureDefaults();
    const base = month ? dayjs(`${month}-01`) : dayjs();

    let start: dayjs.Dayjs;
    let end: dayjs.Dayjs;
    let label: string;

    switch (period) {
      case 'week':
        start = base.startOf('week');
        end = base.endOf('week');
        label = `${start.format('MM/DD')}-${end.format('MM/DD')}`;
        break;
      case 'year':
        start = base.startOf('year');
        end = base.endOf('year');
        label = base.format('YYYY');
        break;
      default:
        start = base.startOf('month');
        end = base.endOf('month');
        label = base.format('YYYY-MM');
    }

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        occurredAt: { gte: start.toDate(), lte: end.toDate() }
      },
      include: { category: true },
      orderBy: { occurredAt: 'asc' }
    });

    const totalExpense = transactions
      .filter((item) => item.type === TransactionType.expense)
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const totalIncome = transactions
      .filter((item) => item.type === TransactionType.income)
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const targetType = filterType === 'income' ? TransactionType.income : TransactionType.expense;
    const targetTotal = filterType === 'income' ? totalIncome : totalExpense;

    const categoryMap = new Map<string, { category: string; amount: number; color: string }>();
    transactions
      .filter((item) => item.type === targetType)
      .forEach((item) => {
        const current = categoryMap.get(item.categoryId) || {
          category: item.category.name,
          amount: 0,
          color: item.category.color
        };
        current.amount += Number(item.amount);
        categoryMap.set(item.categoryId, current);
      });

    const categoryRatio = Array.from(categoryMap.values())
      .sort((a, b) => b.amount - a.amount)
      .map((item) => ({
        ...item,
        percent: targetTotal ? Math.round((item.amount / targetTotal) * 100) : 0
      }));

    const trendMap = new Map<string, { date: string; expense: number; income: number }>();
    transactions.forEach((item) => {
      const fmt = period === 'year' ? 'YYYY-MM' : 'MM-DD';
      const date = dayjs(item.occurredAt).format(fmt);
      const current = trendMap.get(date) || { date, expense: 0, income: 0 };
      if (item.type === TransactionType.expense) current.expense += Number(item.amount);
      if (item.type === TransactionType.income) current.income += Number(item.amount);
      trendMap.set(date, current);
    });

    return {
      month: label,
      period,
      filterType: filterType || 'expense',
      totalExpense,
      totalIncome,
      categoryRatio,
      trend: Array.from(trendMap.values()),
      expenseRank: categoryRatio.map((item) => ({ category: item.category, amount: item.amount }))
    };
  }

  private async sum(userId: string, type: TransactionType, start: Date, end: Date) {
    const result = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type,
        occurredAt: { gte: start, lte: end }
      },
      _sum: { amount: true }
    });

    return Number(result._sum.amount || 0);
  }
}
