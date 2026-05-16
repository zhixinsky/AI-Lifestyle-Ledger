import { Injectable, NotFoundException } from '@nestjs/common';
import { ArticleCategory, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminOperationLogService } from '../services/admin-operation-log.service';

@Injectable()
export class AdminArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly opLog: AdminOperationLogService,
  ) {}

  async list(query: { page?: number; pageSize?: number; category?: ArticleCategory; published?: boolean }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const where: Prisma.ArticleWhereInput = {};
    if (query.category) where.category = query.category;
    if (query.published !== undefined) where.published = query.published;

    const [items, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { sort: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.article.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async get(id: string) {
    const item = await this.prisma.article.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('文章不存在');
    return item;
  }

  async create(adminId: string, data: Prisma.ArticleCreateInput, ip?: string) {
    const item = await this.prisma.article.create({ data });
    await this.opLog.log({ adminId, action: 'create_article', module: 'articles', targetId: item.id, ip });
    return item;
  }

  async update(adminId: string, id: string, data: Prisma.ArticleUpdateInput, ip?: string) {
    const item = await this.prisma.article.update({ where: { id }, data });
    await this.opLog.log({ adminId, action: 'update_article', module: 'articles', targetId: id, ip });
    return item;
  }

  async remove(adminId: string, id: string, ip?: string) {
    await this.prisma.article.delete({ where: { id } });
    await this.opLog.log({ adminId, action: 'delete_article', module: 'articles', targetId: id, ip });
    return { ok: true };
  }
}
