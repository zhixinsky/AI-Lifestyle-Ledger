import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      streakDays: user.streakDays,
      smartGreetingEnabled: user.smartGreetingEnabled,
    };
  }

  async updateProfile(
    userId: string,
    data: { nickname?: string; avatarUrl?: string; smartGreetingEnabled?: boolean },
  ) {
    const patch: {
      nickname?: string;
      avatarUrl?: string;
      smartGreetingEnabled?: boolean;
    } = {};
    if (data.nickname !== undefined) patch.nickname = data.nickname;
    if (data.avatarUrl !== undefined) patch.avatarUrl = data.avatarUrl;
    if (data.smartGreetingEnabled !== undefined) patch.smartGreetingEnabled = data.smartGreetingEnabled;
    if (Object.keys(patch).length === 0) {
      return this.findMe(userId);
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: patch,
    });
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      streakDays: user.streakDays,
      smartGreetingEnabled: user.smartGreetingEnabled,
    };
  }
}
