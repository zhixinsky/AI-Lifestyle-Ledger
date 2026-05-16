import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminRole, AdminUserStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminOperationLogService } from '../services/admin-operation-log.service';

@Injectable()
export class AdminAdminsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly opLog: AdminOperationLogService,
  ) {}

  list() {
    return this.prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        nickname: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
  }

  async create(
    actorId: string,
    data: { username: string; password: string; nickname?: string; role?: AdminRole },
    ip?: string,
  ) {
    const exists = await this.prisma.adminUser.findUnique({ where: { username: data.username } });
    if (exists) throw new BadRequestException('用户名已存在');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const admin = await this.prisma.adminUser.create({
      data: {
        username: data.username,
        passwordHash,
        nickname: data.nickname ?? data.username,
        role: data.role ?? AdminRole.admin,
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
    await this.opLog.log({
      adminId: actorId,
      action: 'create_admin',
      module: 'admins',
      targetId: admin.id,
      detailJson: { username: admin.username, role: admin.role },
      ip,
    });
    return admin;
  }

  async update(
    actorId: string,
    id: string,
    data: { nickname?: string; role?: AdminRole; status?: AdminUserStatus; password?: string },
    ip?: string,
  ) {
    const target = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('管理员不存在');
    if (actorId === id && data.status === 'disabled') {
      throw new BadRequestException('不能禁用当前登录账号');
    }

    const update: Prisma.AdminUserUpdateInput = {};
    if (data.nickname !== undefined) update.nickname = data.nickname;
    if (data.role !== undefined) update.role = data.role;
    if (data.status !== undefined) update.status = data.status;
    if (data.password?.trim()) {
      update.passwordHash = await bcrypt.hash(data.password.trim(), 10);
    }

    const admin = await this.prisma.adminUser.update({
      where: { id },
      data: update,
      select: {
        id: true,
        username: true,
        nickname: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    await this.opLog.log({
      adminId: actorId,
      action: 'update_admin',
      module: 'admins',
      targetId: id,
      detailJson: { ...data, password: data.password ? '***' : undefined },
      ip,
    });
    return admin;
  }
}
