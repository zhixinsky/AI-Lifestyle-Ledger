import { Injectable } from '@nestjs/common';
import { MemberLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MembershipService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(userId: string) {
    return this.prisma.membership.upsert({
      where: { userId },
      create: { userId, level: MemberLevel.free },
      update: {},
    });
  }

  async getStatus(userId: string) {
    const m = await this.getOrCreate(userId);
    const isExpired = m.expireAt ? m.expireAt < new Date() : false;
    const effectiveLevel = isExpired && m.level !== MemberLevel.free ? MemberLevel.free : m.level;

    return {
      level: effectiveLevel,
      expireAt: m.expireAt?.toISOString() || null,
      autoRenew: m.autoRenew,
      isExpired,
      isPro: effectiveLevel === MemberLevel.pro || effectiveLevel === MemberLevel.premium,
      isPremium: effectiveLevel === MemberLevel.premium,
    };
  }

  async isPro(userId: string): Promise<boolean> {
    const status = await this.getStatus(userId);
    return status.isPro;
  }

  async activate(userId: string, level: MemberLevel, months: number) {
    const now = new Date();
    const m = await this.getOrCreate(userId);
    const currentExpire = m.expireAt && m.expireAt > now ? m.expireAt : now;
    const newExpire = new Date(currentExpire);
    newExpire.setMonth(newExpire.getMonth() + months);

    return this.prisma.membership.update({
      where: { userId },
      data: { level, expireAt: newExpire },
    });
  }

  async setAutoRenew(userId: string, autoRenew: boolean) {
    await this.getOrCreate(userId);
    return this.prisma.membership.update({
      where: { userId },
      data: { autoRenew },
    });
  }
}
