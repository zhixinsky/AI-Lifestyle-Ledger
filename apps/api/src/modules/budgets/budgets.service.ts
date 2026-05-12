import { Injectable, BadRequestException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import * as dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(
    userId: string,
    data: {
      amount: number;
      categoryId?: string;
      period?: 'weekly' | 'monthly';
      month?: string;
    },
  ) {
    const month = data.month || dayjs().format('YYYY-MM');
    const period = data.period || 'monthly';

    if (data.amount <= 0) {
      throw new BadRequestException('预算金额必须大于0');
    }

    const categoryId = data.categoryId || null;

    const existing = await this.prisma.budget.findFirst({
      where: { userId, categoryId, month, period },
    });

    if (existing) {
      return this.prisma.budget.update({
        where: { id: existing.id },
        data: { amount: data.amount },
        include: { category: true },
      });
    }

    return this.prisma.budget.create({
      data: {
        userId,
        categoryId,
        amount: data.amount,
        month,
        period,
      },
      include: { category: true },
    });
  }

  async list(userId: string, month?: string) {
    const targetMonth = month || dayjs().format('YYYY-MM');

    const budgets = await this.prisma.budget.findMany({
      where: { userId, month: targetMonth },
      include: { category: true },
      orderBy: { createdAt: 'asc' },
    });

    const start = dayjs(`${targetMonth}-01`).startOf('month').toDate();
    const end = dayjs(`${targetMonth}-01`).endOf('month').toDate();

    const result = await Promise.all(
      budgets.map(async (budget) => {
        const where: any = {
          userId,
          type: TransactionType.expense,
          occurredAt: { gte: start, lte: end },
        };
        if (budget.categoryId) {
          where.categoryId = budget.categoryId;
        }

        const agg = await this.prisma.transaction.aggregate({
          where,
          _sum: { amount: true },
        });

        const spent = Number(agg._sum.amount || 0);
        const budgetAmount = Number(budget.amount);

        return {
          id: budget.id,
          categoryId: budget.categoryId,
          category: budget.category,
          period: budget.period,
          month: budget.month,
          amount: budgetAmount,
          spent,
          remaining: budgetAmount - spent,
          percent: budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0,
          isOverspent: spent > budgetAmount,
        };
      }),
    );

    return result;
  }

  async overview(userId: string, month?: string) {
    const targetMonth = month || dayjs().format('YYYY-MM');
    const budgets = await this.list(userId, targetMonth);

    const totalBudget = budgets
      .filter((b) => !b.categoryId)
      .reduce((sum, b) => sum + b.amount, 0);

    const totalSpent = budgets
      .filter((b) => !b.categoryId)
      .reduce((sum, b) => sum + b.spent, 0);

    const categoryBudgets = budgets.filter((b) => b.categoryId);
    const overspentCategories = categoryBudgets.filter((b) => b.isOverspent);

    return {
      totalBudget,
      totalSpent,
      totalRemaining: totalBudget - totalSpent,
      totalPercent: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
      categoryBudgets,
      overspentCategories,
      isOverspent: totalSpent > totalBudget,
    };
  }

  async remove(userId: string, budgetId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });
    if (!budget) throw new BadRequestException('预算不存在');

    return this.prisma.budget.delete({ where: { id: budgetId } });
  }
}
