import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AnnouncementPosition,
  AnnouncementTarget,
  AnnouncementType,
  MemberLevel,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminOperationLogService } from '../services/admin-operation-log.service';

@Injectable()
export class AdminAnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly opLog: AdminOperationLogService,
  ) {}

  async list(query: { page?: number; pageSize?: number; published?: boolean }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const where: Prisma.AnnouncementWhereInput = {};
    if (query.published !== undefined) where.published = query.published;

    const [items, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { reads: true } } },
      }),
      this.prisma.announcement.count({ where }),
    ]);
    return {
      items: items.map((a) => ({ ...a, readCount: a._count.reads })),
      total,
      page,
      pageSize,
    };
  }

  async get(id: string) {
    const item = await this.prisma.announcement.findUnique({
      where: { id },
      include: { _count: { select: { reads: true } } },
    });
    if (!item) throw new NotFoundException('公告不存在');
    return { ...item, readCount: item._count.reads };
  }

  async create(adminId: string, data: Prisma.AnnouncementCreateInput, ip?: string) {
    const item = await this.prisma.announcement.create({ data });
    await this.opLog.log({
      adminId,
      action: 'create_announcement',
      module: 'announcements',
      targetId: item.id,
      ip,
    });
    return item;
  }

  async update(adminId: string, id: string, data: Prisma.AnnouncementUpdateInput, ip?: string) {
    const item = await this.prisma.announcement.update({ where: { id }, data });
    await this.opLog.log({
      adminId,
      action: 'update_announcement',
      module: 'announcements',
      targetId: id,
      ip,
    });
    return item;
  }

  async remove(adminId: string, id: string, ip?: string) {
    await this.prisma.announcement.delete({ where: { id } });
    await this.opLog.log({
      adminId,
      action: 'delete_announcement',
      module: 'announcements',
      targetId: id,
      ip,
    });
    return { ok: true };
  }
}

@Injectable()
export class AnnouncementsPublicService {
  constructor(private readonly prisma: PrismaService) {}

  async activeForUser(userId: string, position?: AnnouncementPosition) {
    const now = new Date();
    const membership = await this.prisma.membership.findUnique({ where: { userId } });
    const level = membership?.level ?? MemberLevel.free;
    const isMember = level !== MemberLevel.free;

    const announcements = await this.prisma.announcement.findMany({
      where: {
        published: true,
        ...(position ? { position } : {}),
        AND: [
          { OR: [{ startAt: null }, { startAt: { lte: now } }] },
          { OR: [{ endAt: null }, { endAt: { gte: now } }] },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    const reads = await this.prisma.userAnnouncementRead.findMany({
      where: { userId, announcementId: { in: announcements.map((a) => a.id) } },
    });
    const readSet = new Set(reads.map((r) => r.announcementId));

    return announcements
      .filter((a) => {
        if (a.target === 'all') return true;
        if (a.target === 'free') return !isMember;
        if (a.target === 'member') return isMember;
        if (a.target === 'specific') {
          const ids = (a.targetUserIds as string[] | null) ?? [];
          return ids.includes(userId);
        }
        return false;
      })
      .map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        type: a.type,
        position: a.position,
        requireRead: a.requireRead,
        read: readSet.has(a.id),
      }));
  }

  async markRead(userId: string, announcementId: string) {
    await this.prisma.userAnnouncementRead.upsert({
      where: { userId_announcementId: { userId, announcementId } },
      create: { userId, announcementId },
      update: { readAt: new Date() },
    });
    return { ok: true };
  }
}
