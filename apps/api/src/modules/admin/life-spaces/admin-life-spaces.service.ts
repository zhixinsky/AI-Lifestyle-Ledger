import { Injectable } from '@nestjs/common';
import { BookType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminLifeSpacesService {
  constructor(private readonly prisma: PrismaService) {}

  listTemplates() {
    return this.prisma.lifeSpaceTemplate.findMany({ orderBy: { sort: 'asc' } });
  }

  createTemplate(data: Prisma.LifeSpaceTemplateCreateInput) {
    return this.prisma.lifeSpaceTemplate.create({ data });
  }

  updateTemplate(id: string, data: Prisma.LifeSpaceTemplateUpdateInput) {
    return this.prisma.lifeSpaceTemplate.update({ where: { id }, data });
  }

  async stats() {
    const groups = await this.prisma.lifeSpace.groupBy({
      by: ['type'],
      _count: true,
    });
    return groups.map((g) => ({ type: g.type, count: g._count }));
  }
}
