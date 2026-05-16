import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(username: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { username } });
    if (!admin || admin.status !== 'enabled') {
      throw new UnauthorizedException('用户名或密码错误');
    }
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) throw new UnauthorizedException('用户名或密码错误');

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await this.jwt.signAsync({
      sub: admin.id,
      username: admin.username,
      role: admin.role,
      type: 'admin',
    });

    return {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        nickname: admin.nickname,
        role: admin.role,
      },
    };
  }

  async me(adminId: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { id: true, username: true, nickname: true, role: true, lastLoginAt: true },
    });
    if (!admin) throw new UnauthorizedException();
    return admin;
  }
}
