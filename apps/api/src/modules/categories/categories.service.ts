import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { defaultCategories } from './default-categories';
import { TransactionType } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureDefaults() {
    await Promise.all(defaultCategories.map((category) => this.prisma.category.upsert({
      where: { name_type: { name: category.name, type: category.type } },
      update: {
        icon: category.icon,
        color: category.color,
        sort: category.sort,
        isSystem: true
      },
      create: category
    })));
  }

  list() {
    return this.prisma.category.findMany({
      orderBy: [{ type: 'asc' }, { sort: 'asc' }]
    });
  }

  async create(data: { name: string; icon: string; color: string; type: TransactionType }) {
    const existing = await this.prisma.category.findUnique({
      where: { name_type: { name: data.name, type: data.type } }
    });
    if (existing) {
      throw new BadRequestException('同类型下已存在该分类名称');
    }

    const maxSort = await this.prisma.category.findFirst({
      where: { type: data.type },
      orderBy: { sort: 'desc' },
      select: { sort: true }
    });

    return this.prisma.category.create({
      data: {
        ...data,
        sort: (maxSort?.sort ?? 0) + 10,
        isSystem: false
      }
    });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new BadRequestException('分类不存在');
    }

    const txCount = await this.prisma.transaction.count({ where: { categoryId: id } });
    if (txCount > 0) {
      throw new BadRequestException(`该分类下有 ${txCount} 笔账单，不能删除`);
    }

    return this.prisma.category.delete({ where: { id } });
  }

  async updateSort(items: { id: string; sort: number }[]) {
    await Promise.all(
      items.map((item) =>
        this.prisma.category.update({
          where: { id: item.id },
          data: { sort: item.sort }
        })
      )
    );
    return { success: true };
  }
}
