import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

export type AdminJwtPayload = {
  sub: string;
  username: string;
  role: string;
  type: 'admin';
};

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('ADMIN_JWT_SECRET') || config.get<string>('JWT_SECRET') || 'moona-admin-secret',
    });
  }

  async validate(payload: AdminJwtPayload) {
    if (payload.type !== 'admin') {
      throw new UnauthorizedException('无效的管理员令牌');
    }
    const admin = await this.prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!admin || admin.status !== 'enabled') {
      throw new UnauthorizedException('管理员账号不可用');
    }
    return { sub: admin.id, username: admin.username, role: admin.role };
  }
}
