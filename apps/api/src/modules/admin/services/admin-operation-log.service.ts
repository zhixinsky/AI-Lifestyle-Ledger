import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminOperationLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    adminId: string;
    action: string;
    module: string;
    targetId?: string;
    detailJson?: Record<string, unknown>;
    ip?: string;
  }) {
    await this.prisma.adminOperationLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        module: params.module,
        targetId: params.targetId,
        detailJson: (params.detailJson ?? undefined) as Prisma.InputJsonValue | undefined,
        ip: params.ip,
      },
    });
  }

  async list(query: { page?: number; pageSize?: number; module?: string }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const where = query.module ? { module: query.module } : {};
    const [items, total] = await Promise.all([
      this.prisma.adminOperationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { admin: { select: { username: true, nickname: true } } },
      }),
      this.prisma.adminOperationLog.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }
}
