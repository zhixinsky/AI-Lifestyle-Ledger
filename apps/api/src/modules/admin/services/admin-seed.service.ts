import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { BookType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LIFE_SPACE_PRESETS } from '../../life-spaces/life-space-presets';

const DEFAULT_ADMIN = { username: 'admin', password: 'admin123456', nickname: '超级管理员' };

const DEFAULT_SYSTEM_CONFIGS: Array<{ key: string; value: unknown; description: string; group: string }> = [
  { key: 'ai.freeDailyLimit', value: 10, description: '免费用户每日 AI 次数', group: 'ai' },
  { key: 'ai.memberDailyLimit', value: 100, description: '会员每日 AI 次数', group: 'ai' },
  { key: 'ai.modelName', value: 'mimo', description: 'AI 模型名称', group: 'ai' },
  { key: 'ai.enabled', value: true, description: 'AI 接口开关', group: 'ai' },
  { key: 'ai.timeoutMs', value: 30000, description: 'AI 超时时间(ms)', group: 'ai' },
  { key: 'greeting.smartEnabled', value: true, description: '智能问候开关', group: 'app' },
  { key: 'voice.replyDefault', value: true, description: '语音播放默认开关', group: 'app' },
  { key: 'app.maintenanceNotice', value: '', description: '小程序维护公告', group: 'app' },
  { key: 'app.fallbackText', value: '米粒暂时没听清，再说一次吧～', description: '默认兜底文案', group: 'app' },
  { key: 'legal.privacyUrl', value: '', description: '隐私协议地址', group: 'legal' },
  { key: 'legal.termsUrl', value: '', description: '用户协议地址', group: 'legal' },
];

@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureAdminUser();
    await this.ensureSystemConfigs();
    await this.ensureLifeSpaceTemplates();
  }

  private async ensureAdminUser() {
    const existing = await this.prisma.adminUser.findUnique({ where: { username: DEFAULT_ADMIN.username } });
    if (existing) return;
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
    await this.prisma.adminUser.create({
      data: {
        username: DEFAULT_ADMIN.username,
        passwordHash,
        nickname: DEFAULT_ADMIN.nickname,
        role: 'super_admin',
      },
    });
    this.logger.log(`已创建默认管理员: ${DEFAULT_ADMIN.username}`);
  }

  private async ensureSystemConfigs() {
    for (const cfg of DEFAULT_SYSTEM_CONFIGS) {
      await this.prisma.systemConfig.upsert({
        where: { key: cfg.key },
        create: { key: cfg.key, value: cfg.value as object, description: cfg.description, group: cfg.group },
        update: {},
      });
    }
  }

  private async ensureLifeSpaceTemplates() {
    const types: BookType[] = [BookType.daily, BookType.love, BookType.family, BookType.work, BookType.travel, BookType.campus];
    for (const type of types) {
      const preset = LIFE_SPACE_PRESETS[type];
      if (!preset) continue;
      await this.prisma.lifeSpaceTemplate.upsert({
        where: { type },
        create: {
          type,
          name: preset.name,
          icon: preset.icon,
          color: preset.color,
          description: preset.description,
          aiTone: preset.aiIntro,
          sort: preset.sort,
        },
        update: {},
      });
    }
  }
}
