import { Injectable, NotFoundException } from '@nestjs/common';
import { ChallengeType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminGrowthService {
  constructor(private readonly prisma: PrismaService) {}

  async listBadges() {
    const badges = await this.prisma.badge.findMany({ orderBy: { createdAt: 'desc' } });
    const counts = await this.prisma.userBadge.groupBy({
      by: ['badgeId'],
      _count: true,
    });
    const countMap = new Map(counts.map((c) => [c.badgeId, c._count]));
    return badges.map((b) => ({ ...b, earnedCount: countMap.get(b.id) ?? 0 }));
  }

  async createBadge(data: Prisma.BadgeCreateInput) {
    return this.prisma.badge.create({ data });
  }

  async updateBadge(id: string, data: Prisma.BadgeUpdateInput) {
    return this.prisma.badge.update({ where: { id }, data });
  }

  async listChallenges() {
    const challenges = await this.prisma.challenge.findMany({ orderBy: { createdAt: 'desc' } });
    const stats = await this.prisma.userChallenge.groupBy({
      by: ['challengeId'],
      _count: true,
      where: { completed: true },
    });
    const totalStats = await this.prisma.userChallenge.groupBy({
      by: ['challengeId'],
      _count: true,
    });
    const completedMap = new Map(stats.map((s) => [s.challengeId, s._count]));
    const totalMap = new Map(totalStats.map((s) => [s.challengeId, s._count]));
    return challenges.map((c) => {
      const total = totalMap.get(c.id) ?? 0;
      const completed = completedMap.get(c.id) ?? 0;
      return {
        ...c,
        participantCount: total,
        completionRate: total > 0 ? Math.round((completed / total) * 1000) / 10 : 0,
      };
    });
  }

  async createChallenge(data: {
    name: string;
    description: string;
    type: ChallengeType;
    targetValue: number;
    duration?: number;
    icon?: string;
  }) {
    return this.prisma.challenge.create({ data });
  }

  async updateChallenge(id: string, data: Prisma.ChallengeUpdateInput) {
    return this.prisma.challenge.update({ where: { id }, data });
  }
}
