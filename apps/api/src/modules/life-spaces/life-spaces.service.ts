import { BadRequestException, Injectable } from '@nestjs/common';
import { BookType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CREATABLE_LIFE_SPACE_TYPES, LIFE_SPACE_PRESETS } from './life-space-presets';

const DEFAULT_HOME_CARDS = [
  { key: 'daily', sort: 0, isVisible: true },
  { key: 'ai', sort: 1, isVisible: true },
  { key: 'wealth', sort: 2, isVisible: true },
  { key: 'budget', sort: 3, isVisible: true },
];

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

  private async ensureHomeCards(userId: string) {
    await Promise.all(
      DEFAULT_HOME_CARDS.map((card) => this.prisma.homeCardSetting.upsert({
        where: { userId_key: { userId, key: card.key } },
        update: {},
        create: {
          userId,
          key: card.key,
          sort: card.sort,
          isVisible: card.isVisible,
        },
      })),
    );
  }

  async listHomeCards(userId: string) {
    await this.ensureHomeCards(userId);
    return this.prisma.homeCardSetting.findMany({
      where: { userId },
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
      select: {
        key: true,
        sort: true,
        isVisible: true,
      },
    });
  }

  async updateHomeCards(userId: string, items: Array<{ key: string; sort?: number; isVisible?: boolean }>) {
    const allowedKeys = new Set(DEFAULT_HOME_CARDS.map((card) => card.key));
    const updates = items.filter((item) => allowedKeys.has(item.key));
    await this.ensureHomeCards(userId);
    await Promise.all(
      updates.map((item, index) => this.prisma.homeCardSetting.upsert({
        where: { userId_key: { userId, key: item.key } },
        update: {
          sort: item.sort ?? index,
          ...(item.isVisible !== undefined ? { isVisible: item.isVisible } : {}),
        },
        create: {
          userId,
          key: item.key,
          sort: item.sort ?? index,
          isVisible: item.isVisible ?? true,
        },
      })),
    );
    return this.listHomeCards(userId);
  }
}
