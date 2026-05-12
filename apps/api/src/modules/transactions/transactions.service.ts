import { ForbiddenException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as dayjs from 'dayjs';
import { CategoriesService } from '../categories/categories.service';
import { GrowthService } from '../growth/growth.service';
import { PrismaService } from '../prisma/prisma.service';
import { WealthAiService } from '../wealth/wealth-ai.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriesService: CategoriesService,
    @Optional() @Inject(WealthAiService) private readonly wealthAi?: WealthAiService,
    @Optional() @Inject(GrowthService) private readonly growthService?: GrowthService,
  ) {}

  async list(userId: string, query: QueryTransactionsDto = {}) {
    await this.categoriesService.ensureDefaults();
    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.keyword ? {
        OR: [
          { remark: { contains: query.keyword } },
          { category: { name: { contains: query.keyword } } }
        ]
      } : {})
    };

    if (query.month) {
      const start = dayjs(`${query.month}-01`).startOf('month');
      where.occurredAt = { gte: start.toDate(), lte: start.endOf('month').toDate() };
    }

    const rows = await this.prisma.transaction.findMany({
      where,
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: { occurredAt: 'desc' }
    });

    return rows.map((row) => this.serialize(row));
  }

  async create(userId: string, dto: CreateTransactionDto) {
    await this.categoriesService.ensureDefaults();
    const row = await this.prisma.transaction.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        type: dto.type,
        amount: dto.amount,
        occurredAt: new Date(dto.occurredAt),
        remark: dto.remark,
        voucherUrl: dto.voucherUrl,
        tags: dto.tags?.length ? {
          create: await Promise.all(dto.tags.map(async (name) => ({
            tag: {
              connectOrCreate: {
                where: { userId_name: { userId, name } },
                create: { userId, name }
              }
            }
          })))
        } : undefined
      },
      include: { category: true, tags: { include: { tag: true } } }
    });

    this.wealthAi?.refreshAdviceAsync(userId);
    this.growthService?.checkAndAwardBadges(userId).catch(() => {});
    this.growthService?.updateChallengeProgress(userId).catch(() => {});
    return this.serialize(row);
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    await this.assertOwner(userId, id);
    const row = await this.prisma.transaction.update({
      where: { id },
      data: {
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.amount ? { amount: dto.amount } : {}),
        ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
        ...(dto.occurredAt ? { occurredAt: new Date(dto.occurredAt) } : {}),
        ...(dto.remark !== undefined ? { remark: dto.remark } : {}),
        ...(dto.voucherUrl !== undefined ? { voucherUrl: dto.voucherUrl } : {}),
        ...(dto.tags ? {
          tags: {
            deleteMany: {},
            create: await Promise.all(dto.tags.map(async (name) => ({
              tag: {
                connectOrCreate: {
                  where: { userId_name: { userId, name } },
                  create: { userId, name }
                }
              }
            })))
          }
        } : {})
      },
      include: { category: true, tags: { include: { tag: true } } }
    });

    this.wealthAi?.refreshAdviceAsync(userId);
    return this.serialize(row);
  }

  async remove(userId: string, id: string) {
    await this.assertOwner(userId, id);
    await this.prisma.transaction.delete({ where: { id } });
    this.wealthAi?.refreshAdviceAsync(userId);
    return { success: true };
  }

  private async assertOwner(userId: string, id: string) {
    const row = await this.prisma.transaction.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('账单不存在');
    if (row.userId !== userId) throw new ForbiddenException('无权操作该账单');
  }

  private serialize(row: Prisma.TransactionGetPayload<{ include: { category: true; tags: { include: { tag: true } } } }>) {
    return {
      id: row.id,
      type: row.type,
      amount: Number(row.amount),
      categoryId: row.categoryId,
      category: row.category,
      occurredAt: row.occurredAt.toISOString(),
      remark: row.remark,
      voucherUrl: row.voucherUrl,
      tags: row.tags.map((item) => item.tag.name)
    };
  }
}
