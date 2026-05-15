import { BadRequestException, Injectable } from '@nestjs/common';
import { BookType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CREATABLE_LIFE_SPACE_TYPES, LIFE_SPACE_PRESETS } from './life-space-presets';

@Injectable()
export class LifeSpacesService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(space: any) {
    const preset = LIFE_SPACE_PRESETS[space.type as BookType];
    return {
      ...space,
      aiIntro: preset?.aiIntro || '',
    };
  }

  async ensureDefault(userId: string) {
    const preset = LIFE_SPACE_PRESETS[BookType.daily];
    return this.prisma.lifeSpace.upsert({
      where: { userId_type: { userId, type: BookType.daily } },
      update: {},
      create: {
        userId,
        type: BookType.daily,
        name: preset.name,
        icon: preset.icon,
        color: preset.color,
        description: preset.description,
        sort: preset.sort,
        isVisible: true,
      },
    });
  }

  async list(userId: string) {
    await this.ensureDefault(userId);
    const spaces = await this.prisma.lifeSpace.findMany({
      where: { userId },
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
    });
    return spaces.map((space) => this.serialize(space));
  }

  async create(userId: string, type: BookType) {
    if (type === BookType.daily) throw new BadRequestException('日常生活为默认空间，无需创建');
    if (!(CREATABLE_LIFE_SPACE_TYPES as BookType[]).includes(type)) throw new BadRequestException('不支持的生活空间');
    await this.ensureDefault(userId);
    const preset = LIFE_SPACE_PRESETS[type];
    const space = await this.prisma.lifeSpace.upsert({
      where: { userId_type: { userId, type } },
      update: { isVisible: true },
      create: {
        userId,
        type,
        name: preset.name,
        icon: preset.icon,
        color: preset.color,
        description: preset.description,
        sort: preset.sort,
        isVisible: true,
      },
    });
    return this.serialize(space);
  }

  async updateSettings(userId: string, items: Array<{ id: string; sort?: number; isVisible?: boolean }>) {
    await Promise.all(
      items.map((item) => this.prisma.lifeSpace.updateMany({
        where: { id: item.id, userId },
        data: {
          ...(item.sort !== undefined ? { sort: item.sort } : {}),
          ...(item.isVisible !== undefined ? { isVisible: item.isVisible } : {}),
        },
      })),
    );
    return this.list(userId);
  }
}
