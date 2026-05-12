import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GrowthService {
  private readonly logger = new Logger(GrowthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async seedBadges() {
    const badges = [
      { key: 'streak_7', name: '坚持记账7天', icon: '🔥', description: '连续记账7天', condition: { type: 'streak', value: 7 } },
      { key: 'streak_30', name: '月度达人', icon: '⭐', description: '连续记账30天', condition: { type: 'streak', value: 30 } },
      { key: 'streak_100', name: '百日成就', icon: '💎', description: '连续记账100天', condition: { type: 'streak', value: 100 } },
      { key: 'first_saving', name: '储蓄新手', icon: '🐷', description: '创建第一个存钱目标', condition: { type: 'first_saving', value: 1 } },
      { key: 'first_budget', name: '预算管家', icon: '📊', description: '创建第一个预算', condition: { type: 'first_budget', value: 1 } },
      { key: 'positive_surplus', name: '月光终结者', icon: '🌟', description: '实现月度正结余', condition: { type: 'positive_surplus', value: 1 } },
      { key: 'tx_count_50', name: '记账小能手', icon: '✏️', description: '累计记账50笔', condition: { type: 'tx_count', value: 50 } },
      { key: 'tx_count_200', name: '记账大师', icon: '🏅', description: '累计记账200笔', condition: { type: 'tx_count', value: 200 } },
    ];

    for (const badge of badges) {
      await this.prisma.badge.upsert({
        where: { key: badge.key },
        create: badge,
        update: { name: badge.name, icon: badge.icon, description: badge.description, condition: badge.condition },
      });
    }
    return { seeded: badges.length };
  }

  async seedChallenges() {
    const challenges = [
      { name: '连续记账7天', description: '连续7天记录至少一笔账单', type: 'streak' as const, targetValue: 7, duration: 7, icon: '🔥' },
      { name: '一周不点外卖', description: '连续7天不记录外卖/餐饮外卖支出', type: 'budget' as const, targetValue: 7, duration: 7, icon: '🥗' },
      { name: '月存500元', description: '本月实现至少500元正结余', type: 'saving' as const, targetValue: 500, duration: 30, icon: '💰' },
      { name: '30天记账挑战', description: '连续30天每天记录至少一笔', type: 'streak' as const, targetValue: 30, duration: 30, icon: '📅' },
    ];

    let seeded = 0;
    for (const c of challenges) {
      const existing = await this.prisma.challenge.findFirst({ where: { name: c.name } });
      if (!existing) {
        await this.prisma.challenge.create({ data: c });
        seeded++;
      }
    }
    return { seeded };
  }

  async checkAndAwardBadges(userId: string) {
    const awarded: string[] = [];
    const badges = await this.prisma.badge.findMany();
    const existing = await this.prisma.userBadge.findMany({ where: { userId } });
    const existingKeys = new Set(existing.map((e) => e.badgeId));

    for (const badge of badges) {
      if (existingKeys.has(badge.id)) continue;

      const condition = badge.condition as { type: string; value: number };
      let earned = false;

      switch (condition.type) {
        case 'streak': {
          const user = await this.prisma.user.findUnique({ where: { id: userId } });
          earned = (user?.streakDays || 0) >= condition.value;
          break;
        }
        case 'first_saving': {
          const count = await this.prisma.savingGoal.count({ where: { userId } });
          earned = count >= condition.value;
          break;
        }
        case 'first_budget': {
          const count = await this.prisma.budget.count({ where: { userId } });
          earned = count >= condition.value;
          break;
        }
        case 'positive_surplus': {
          const snap = await this.prisma.wealthSnapshot.findFirst({
            where: { userId, surplus: { gt: 0 } },
          });
          earned = !!snap;
          break;
        }
        case 'tx_count': {
          const count = await this.prisma.transaction.count({ where: { userId } });
          earned = count >= condition.value;
          break;
        }
      }

      if (earned) {
        await this.prisma.userBadge.create({
          data: { userId, badgeId: badge.id },
        });
        awarded.push(badge.key);
      }
    }

    return awarded;
  }

  async listBadges(userId: string) {
    const allBadges = await this.prisma.badge.findMany();
    const userBadges = await this.prisma.userBadge.findMany({
      where: { userId },
    });
    const earnedMap = new Map(userBadges.map((ub) => [ub.badgeId, ub.earnedAt]));

    return allBadges.map((b) => ({
      ...b,
      earned: earnedMap.has(b.id),
      earnedAt: earnedMap.get(b.id) || null,
    }));
  }

  async listChallenges(userId: string) {
    const allChallenges = await this.prisma.challenge.findMany();
    const userChallenges = await this.prisma.userChallenge.findMany({
      where: { userId },
    });
    const joinedMap = new Map(
      userChallenges.map((uc) => [uc.challengeId, uc]),
    );

    return allChallenges.map((c) => {
      const uc = joinedMap.get(c.id);
      return {
        ...c,
        joined: !!uc,
        progress: uc?.progress || 0,
        completed: uc?.completed || false,
        completedAt: uc?.completedAt || null,
        startedAt: uc?.startedAt || null,
      };
    });
  }

  async joinChallenge(userId: string, challengeId: string) {
    const challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException('挑战不存在');

    const existing = await this.prisma.userChallenge.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });
    if (existing) return existing;

    return this.prisma.userChallenge.create({
      data: { userId, challengeId },
    });
  }

  async updateChallengeProgress(userId: string) {
    const userChallenges = await this.prisma.userChallenge.findMany({
      where: { userId, completed: false },
      include: { challenge: true },
    });

    for (const uc of userChallenges) {
      let newProgress = 0;

      switch (uc.challenge.type) {
        case 'streak': {
          const user = await this.prisma.user.findUnique({ where: { id: userId } });
          newProgress = user?.streakDays || 0;
          break;
        }
        case 'saving': {
          const now = new Date();
          const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          const snap = await this.prisma.wealthSnapshot.findUnique({
            where: { userId_month: { userId, month: monthStr } },
          });
          newProgress = snap ? Number(snap.surplus) : 0;
          break;
        }
        case 'budget': {
          const daysSinceStart = Math.floor(
            (Date.now() - uc.startedAt.getTime()) / (1000 * 60 * 60 * 24),
          );
          newProgress = Math.min(daysSinceStart, uc.challenge.targetValue);
          break;
        }
      }

      const completed = newProgress >= uc.challenge.targetValue;
      await this.prisma.userChallenge.update({
        where: { id: uc.id },
        data: {
          progress: newProgress,
          completed,
          completedAt: completed ? new Date() : null,
        },
      });
    }
  }
}
