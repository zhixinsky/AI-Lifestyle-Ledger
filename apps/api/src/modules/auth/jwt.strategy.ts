import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'moona-dev-secret',
    });
  }

  async validate(payload: { sub: string; phone?: string | null }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, status: true, phone: true },
    });
    if (!user) throw new UnauthorizedException('用户不存在或登录已失效');
    if (user.status === UserStatus.disabled) {
      throw new ForbiddenException('账号已被封禁，如有疑问请联系客服');
    }
    return { sub: user.id, phone: user.phone ?? payload.phone ?? null };
  }
}
