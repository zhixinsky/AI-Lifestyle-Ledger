import { Injectable, Logger } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  private todayRange() {
    const start = dayjs().startOf('day').toDate();
    const end = dayjs().endOf('day').toDate();
    return { start, end };
  }

  private async safeCount(label: string, fn: () => Promise<number>) {
    try {
      return await fn();
    } catch (err) {
      this.logger.warn(`${label} 统计失败: ${err instanceof Error ? err.message : err}`);
      return 0;
    }
  }

  private async recentFailedLogs() {
    try {
      return await this.prisma.aiLog.findMany({
        where: { status: 'failed' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          userId: true,
          rawInput: true,
          errorMessage: true,
          createdAt: true,
        },
      });
    } catch (err) {
      this.logger.warn(`aiLog.recentFailed 查询失败: ${err instanceof Error ? err.message : err}`);
      return [];
    }
  }

  async summary() {
    const { start, end } = this.todayRange();
    const [
      totalUsers,
      todayNewUsers,
      todayTransactions,
      todayAiLogs,
      todayAiFailed,
      todayCorrections,
      todayNewMembers,
      todayOrders,
      recentFailedLogs,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: start, lte: end } } }),
      this.prisma.transaction.count({ where: { createdAt: { gte: start, lte: end } } }),
      this.prisma.aiLog.count({ where: { createdAt: { gte: start, lte: end } } }),
      this.safeCount('aiLog.failed', () =>
        this.prisma.aiLog.count({ where: { createdAt: { gte: start, lte: end }, status: 'failed' } }),
      ),
      this.safeCount('aiCorrection', () =>
        this.prisma.aiCorrection.count({ where: { createdAt: { gte: start, lte: end } } }),
      ),
      this.prisma.membership.count({
        where: { level: { not: 'free' }, updatedAt: { gte: start, lte: end } },
      }),
      this.prisma.order.count({ where: { createdAt: { gte: start, lte: end }, status: 'paid' } }),
      this.recentFailedLogs(),
    ]);

    const todayAiSuccess = todayAiLogs - todayAiFailed;
    const aiSuccessRate = todayAiLogs > 0 ? Math.round((todayAiSuccess / todayAiLogs) * 1000) / 10 : 100;

    return {
      todayNewUsers,
      totalUsers,
      todayTransactions,
      todayAiCalls: todayAiLogs,
      todayVoiceBills: todayTransactions,
      todaySmsCount: 0,
      todayNewMembers,
      todayOrders,
      aiSuccessRate,
      aiFailedCount: todayAiFailed,
      correctionCount: todayCorrections,
      recentErrors: recentFailedLogs.map((l) => ({
        id: l.id,
        userId: l.userId,
        message: l.errorMessage || l.rawInput.slice(0, 80),
        createdAt: l.createdAt,
      })),
    };
  }

  async trends() {
    const days = 7;
    const result: Array<{
      date: string;
      newUsers: number;
      aiCalls: number;
      transactions: number;
      newMembers: number;
    }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day');
      const start = d.startOf('day').toDate();
      const end = d.endOf('day').toDate();
      const date = d.format('YYYY-MM-DD');
      const [newUsers, aiCalls, transactions, newMembers] = await Promise.all([
        this.prisma.user.count({ where: { createdAt: { gte: start, lte: end } } }),
        this.prisma.aiLog.count({ where: { createdAt: { gte: start, lte: end } } }),
        this.prisma.transaction.count({ where: { createdAt: { gte: start, lte: end } } }),
        this.prisma.membership.count({
          where: { level: { not: 'free' }, updatedAt: { gte: start, lte: end } },
        }),
      ]);
      result.push({ date, newUsers, aiCalls, transactions, newMembers });
    }
    return { days: result };
  }
}
