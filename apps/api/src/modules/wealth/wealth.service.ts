import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import * as dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WealthService {
  constructor(private readonly prisma: PrismaService) {}

  /* ========== Overview ========== */

  async getOverview(userId: string, month?: string) {
    const target = month ? dayjs(`${month}-01`) : dayjs();
    const targetMonth = target.format('YYYY-MM');

    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      months.push(target.subtract(i, 'month').format('YYYY-MM'));
    }

    const trend = await Promise.all(
      months.map((m) => this.getMonthSurplus(userId, m)),
    );

    const current = trend[trend.length - 1];
    const prev = trend[trend.length - 2];
    const scoreChange = prev ? current.wealthScore - prev.wealthScore : 0;

    const goals = await this.listGoals(userId);

    const statusText = this.getStatusText(current.surplusRate, scoreChange);

    return {
      month: targetMonth,
      monthIncome: current.income,
      monthExpense: current.expense,
      monthSurplus: current.surplus,
      surplusRate: current.surplusRate,
      wealthScore: current.wealthScore,
      scoreChange,
      statusText,
      trend,
      goals,
    };
  }

  async getMonthSurplus(userId: string, month: string, options: { forceRecalculate?: boolean } = {}) {
    const existing = await this.prisma.wealthSnapshot.findUnique({
      where: { userId_month: { userId, month } },
    });

    if (existing && !options.forceRecalculate) {
      return {
        month,
        income: Number(existing.income),
        expense: Number(existing.expense),
        surplus: Number(existing.surplus),
        surplusRate: Number(existing.income) > 0
          ? Math.round((Number(existing.surplus) / Number(existing.income)) * 100)
          : 0,
        wealthScore: existing.wealthScore,
      };
    }

    const start = dayjs(`${month}-01`).startOf('month').toDate();
    const end = dayjs(`${month}-01`).endOf('month').toDate();

    const [incomeAgg, expenseAgg] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { userId, type: TransactionType.income, occurredAt: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { userId, type: TransactionType.expense, occurredAt: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
    ]);

    const income = Number(incomeAgg._sum.amount || 0);
    const expense = Number(expenseAgg._sum.amount || 0);
    const surplus = income - expense;
    const surplusRate = income > 0 ? Math.round((surplus / income) * 100) : 0;

    return { month, income, expense, surplus, surplusRate, wealthScore: 0 };
  }

  /* ========== Wealth Score ========== */

  calculateWealthScore(
    surplusRate: number,
    recentSurpluses: number[],
  ): number {
    const rateScore = Math.min(surplusRate / 30, 1) * 100;

    let stabilityScore = 100;
    if (recentSurpluses.length >= 2) {
      const avg = recentSurpluses.reduce((s, v) => s + v, 0) / recentSurpluses.length;
      const variance = recentSurpluses.reduce((s, v) => s + (v - avg) ** 2, 0) / recentSurpluses.length;
      const stdDev = Math.sqrt(variance);
      const cv = avg !== 0 ? stdDev / Math.abs(avg) : 1;
      stabilityScore = Math.max(0, (1 - cv) * 100);
    }

    let trendScore = 50;
    if (recentSurpluses.length >= 2) {
      const last = recentSurpluses[recentSurpluses.length - 1];
      const first = recentSurpluses[0];
      if (last > first) trendScore = 80 + Math.min((last - first) / Math.abs(first || 1) * 20, 20);
      else if (last < first) trendScore = Math.max(0, 40 - Math.min(Math.abs(first - last) / Math.abs(first || 1) * 40, 40));
    }

    return Math.round(rateScore * 0.4 + stabilityScore * 0.3 + trendScore * 0.3);
  }

  /* ========== Refresh / Auto Push ========== */

  async refreshMonth(userId: string, month?: string, options: { updateGoals?: boolean } = {}) {
    const target = month ? dayjs(`${month}-01`) : dayjs();
    const targetMonth = target.format('YYYY-MM');

    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      months.push(target.subtract(i, 'month').format('YYYY-MM'));
    }

    const surpluses: number[] = [];
    let cumulative = 0;

    for (const m of months) {
      const data = await this.getMonthSurplus(userId, m, { forceRecalculate: m === targetMonth });
      surpluses.push(data.surplus);
      cumulative += data.surplus;
    }

    const current = surpluses[surpluses.length - 1];
    const currentMonthData = await this.getMonthSurplus(userId, targetMonth, { forceRecalculate: true });
    const currentIncome = currentMonthData.income;
    const currentExpense = currentMonthData.expense;
    const surplusRate = currentIncome > 0 ? Math.round((current / currentIncome) * 100) : 0;
    const wealthScore = this.calculateWealthScore(surplusRate, surpluses);

    await this.prisma.wealthSnapshot.upsert({
      where: { userId_month: { userId, month: targetMonth } },
      create: {
        userId,
        month: targetMonth,
        income: currentIncome,
        expense: currentExpense,
        surplus: current,
        cumulativeSurplus: cumulative,
        wealthScore,
      },
      update: {
        income: currentIncome,
        expense: currentExpense,
        surplus: current,
        cumulativeSurplus: cumulative,
        wealthScore,
      },
    });

    if (options.updateGoals !== false) {
      await this.pushGoalProgress(userId, targetMonth, current);
    }

    return this.getOverview(userId, targetMonth);
  }

  private async pushGoalProgress(userId: string, month: string, surplus: number) {
    if (surplus <= 0) return;

    const goals = await this.prisma.savingGoal.findMany({
      where: { userId, completed: false },
      orderBy: { priority: 'desc' },
    });

    if (!goals.length) return;

    const totalPercent = goals.reduce((s, g) => s + g.allocPercent, 0) || 100;

    for (const goal of goals) {
      const ratio = goal.allocPercent / totalPercent;
      const allocated = Math.round(surplus * ratio * 100) / 100;

      const prevProgresses = await this.prisma.goalProgress.findMany({
        where: { userId, goalId: goal.id },
      });
      const prevCumulative = prevProgresses.reduce((s, p) => s + Number(p.allocated), 0);
      const cumulative = prevCumulative + allocated;
      const target = Number(goal.targetAmount);
      const percent = target > 0 ? Math.min(Math.round((cumulative / target) * 100), 100) : 0;

      await this.prisma.goalProgress.upsert({
        where: { userId_goalId_month: { userId, goalId: goal.id, month } },
        create: { userId, goalId: goal.id, month, allocated, cumulative, percent },
        update: { allocated, cumulative, percent },
      });

      const newCurrentAmount = cumulative;
      const completed = newCurrentAmount >= target;

      await this.prisma.savingGoal.update({
        where: { id: goal.id },
        data: {
          currentAmount: Math.min(newCurrentAmount, target),
          completed,
          completedAt: completed && !goal.completed ? new Date() : goal.completedAt,
        },
      });
    }
  }

  /* ========== Goals CRUD ========== */

  async listGoals(userId: string) {
    const goals = await this.prisma.savingGoal.findMany({
      where: { userId },
      include: { progresses: { orderBy: { month: 'asc' } } },
      orderBy: [{ completed: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    });

    const avgSurplus = await this.getAvgMonthlySurplus(userId, 3);

    return goals.map((g) => {
      const target = Number(g.targetAmount);
      const current = Number(g.currentAmount);
      const remaining = Math.max(target - current, 0);
      const percent = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

      const allocPerMonth = avgSurplus > 0 ? avgSurplus * (g.allocPercent / 100) : 0;
      const monthsLeft = allocPerMonth > 0 ? Math.ceil(remaining / allocPerMonth) : null;
      const predictDate = monthsLeft ? dayjs().add(monthsLeft, 'month').format('YYYY-MM') : null;

      return {
        id: g.id,
        name: g.name,
        icon: g.icon,
        color: g.color,
        targetAmount: target,
        currentAmount: current,
        remaining,
        percent,
        allocPercent: g.allocPercent,
        priority: g.priority,
        deadline: g.deadline?.toISOString() || null,
        daysLeft: g.deadline ? Math.max(Math.ceil((g.deadline.getTime() - Date.now()) / 86400000), 0) : null,
        predictDate,
        monthsLeft,
        completed: g.completed,
        completedAt: g.completedAt?.toISOString() || null,
        monthlyContributions: g.progresses.map((p) => ({
          month: p.month,
          allocated: Number(p.allocated),
          cumulative: Number(p.cumulative),
          percent: p.percent,
        })),
      };
    });
  }

  async createGoal(
    userId: string,
    data: { name: string; targetAmount: number; deadline?: string; icon?: string; color?: string; allocPercent?: number },
  ) {
    if (data.targetAmount <= 0) throw new BadRequestException('目标金额必须大于0');

    return this.prisma.savingGoal.create({
      data: {
        userId,
        name: data.name,
        targetAmount: data.targetAmount,
        deadline: data.deadline ? new Date(data.deadline) : null,
        icon: data.icon || '🎯',
        color: data.color || '#00d4c8',
        allocPercent: data.allocPercent ?? 100,
      },
    });
  }

  async updateGoal(
    userId: string,
    goalId: string,
    data: { name?: string; targetAmount?: number; deadline?: string; icon?: string; color?: string; allocPercent?: number },
  ) {
    const goal = await this.prisma.savingGoal.findFirst({ where: { id: goalId, userId } });
    if (!goal) throw new NotFoundException('目标不存在');

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.targetAmount !== undefined) updateData.targetAmount = data.targetAmount;
    if (data.deadline !== undefined) updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.allocPercent !== undefined) updateData.allocPercent = data.allocPercent;

    return this.prisma.savingGoal.update({ where: { id: goalId }, data: updateData });
  }

  async removeGoal(userId: string, goalId: string) {
    const goal = await this.prisma.savingGoal.findFirst({ where: { id: goalId, userId } });
    if (!goal) throw new NotFoundException('目标不存在');
    return this.prisma.savingGoal.delete({ where: { id: goalId } });
  }

  /* ========== Helpers ========== */

  private async getAvgMonthlySurplus(userId: string, months: number): Promise<number> {
    const now = dayjs();
    const surpluses: number[] = [];

    for (let i = 1; i <= months; i++) {
      const m = now.subtract(i, 'month').format('YYYY-MM');
      const data = await this.getMonthSurplus(userId, m);
      surpluses.push(data.surplus);
    }

    if (!surpluses.length) return 0;
    return surpluses.reduce((s, v) => s + v, 0) / surpluses.length;
  }

  private getStatusText(surplusRate: number, scoreChange: number): string {
    if (surplusRate >= 30 && scoreChange >= 0) return '财富正在稳步增长 ✨';
    if (surplusRate >= 20) return '保持得不错，继续加油';
    if (surplusRate >= 10) return '收支基本平衡，可以优化';
    if (surplusRate >= 0) return '结余偏少，注意控制开支';
    return '本月支出超过收入，需要调整';
  }
}
