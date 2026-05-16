import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminOperationLogService } from '../services/admin-operation-log.service';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly opLog: AdminOperationLogService,
  ) {}

  async list(query: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: UserStatus;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const where: Prisma.UserWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.keyword?.trim()) {
      const kw = query.keyword.trim();
      where.OR = [
        { phone: { contains: kw } },
        { openid: { contains: kw } },
        { nickname: { contains: kw } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          membership: true,
          _count: { select: { transactions: true, aiLogs: true, lifeSpaces: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map((u) => ({
        id: u.id,
        nickname: u.nickname,
        phone: u.phone,
        openid: u.openid,
        memberLevel: u.membership?.level ?? 'free',
        transactionCount: u._count.transactions,
        aiUsageCount: u._count.aiLogs,
        lifeSpaceCount: u._count.lifeSpaces,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        status: u.status,
      })),
      total,
      page,
      pageSize,
    };
  }

  async detail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        membership: true,
        lifeSpaces: { orderBy: { sort: 'asc' } },
        _count: { select: { transactions: true, aiLogs: true } },
      },
    });
    if (!user) throw new NotFoundException('用户不存在');

    const [recentTransactions, recentAiLogs, txStats] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId: id },
        orderBy: { occurredAt: 'desc' },
        take: 10,
        include: { category: true },
      }),
      this.prisma.aiLog.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.transaction.groupBy({
        by: ['type'],
        where: { userId: id },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      ...user,
      transactionCount: user._count.transactions,
      aiUsageCount: user._count.aiLogs,
      txStats,
      recentTransactions,
      recentAiLogs,
    };
  }

  async updateStatus(adminId: string, userId: string, status: UserStatus, ip?: string) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new NotFoundException('用户不存在');

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });
    await this.opLog.log({
      adminId,
      action: status === 'disabled' ? 'ban_user' : 'unban_user',
      module: 'users',
      targetId: userId,
      detailJson: { status },
      ip,
    });
    return user;
  }
}
