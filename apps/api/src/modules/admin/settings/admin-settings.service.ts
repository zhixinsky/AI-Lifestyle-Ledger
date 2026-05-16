import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminOperationLogService } from '../services/admin-operation-log.service';

@Injectable()
export class AdminSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly opLog: AdminOperationLogService,
  ) {}

  async list() {
    return this.prisma.systemConfig.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });
  }

  async update(adminId: string, key: string, value: unknown, ip?: string) {
    const existing = await this.prisma.systemConfig.findUnique({ where: { key } });
    if (!existing) throw new NotFoundException('配置项不存在');
    const item = await this.prisma.systemConfig.update({
      where: { key },
      data: { value: value as object },
    });
    await this.opLog.log({
      adminId,
      action: 'update_setting',
      module: 'settings',
      targetId: key,
      detailJson: { value },
      ip,
    });
    return item;
  }
}
