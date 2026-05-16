import { Injectable, NotFoundException } from '@nestjs/common';
import { MemberLevel, OrderStatus, Prisma } from '@prisma/client';
import * as dayjs from 'dayjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminOperationLogService } from '../services/admin-operation-log.service';

@Injectable()
export class AdminMembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly opLog: AdminOperationLogService,
  ) {}

  async listMemberships(query: { page?: number; pageSize?: number; level?: MemberLevel }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const where: Prisma.MembershipWhereInput = {};
    if (query.level) where.level = query.level;

    const [items, total] = await Promise.all([
      this.prisma.membership.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, nickname: true, phone: true } } },
      }),
      this.prisma.membership.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async updateMembership(
    adminId: string,
    userId: string,
    data: { level?: MemberLevel; extendDays?: number },
    ip?: string,
  ) {
    const existing = await this.prisma.membership.findUnique({ where: { userId } });
    let expireAt = existing?.expireAt ?? new Date();
    if (data.extendDays) {
      expireAt = dayjs(expireAt).add(data.extendDays, 'day').toDate();
    }
    const membership = await this.prisma.membership.upsert({
      where: { userId },
      create: {
        userId,
        level: data.level ?? MemberLevel.pro,
        expireAt,
      },
      update: {
        level: data.level ?? undefined,
        expireAt: data.extendDays ? expireAt : undefined,
      },
    });
    await this.opLog.log({
      adminId,
      action: 'update_membership',
      module: 'memberships',
      targetId: userId,
      detailJson: data as Record<string, unknown>,
      ip,
    });
    return membership;
  }

  async listOrders(query: { page?: number; pageSize?: number; status?: OrderStatus }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const where: Prisma.OrderWhereInput = {};
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { nickname: true, phone: true } } },
      }),
      this.prisma.order.count({ where }),
    ]);
    return {
      items: items.map((o) => ({
        id: o.id,
        orderNo: o.wxPayOrderId || o.id,
        userId: o.userId,
        amount: o.amount,
        status: o.status,
        description: o.description,
        paymentChannel: 'wechat',
        createdAt: o.createdAt,
        paidAt: o.paidAt,
        user: o.user,
      })),
      total,
      page,
      pageSize,
    };
  }
}
