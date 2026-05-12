import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { WxLoginDto } from './dto/wx-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    if (dto.code !== '123456') {
      throw new UnauthorizedException('验证码错误，MVP 阶段请使用 123456');
    }

    const user = await this.prisma.user.upsert({
      where: { phone: dto.phone },
      update: {},
      create: {
        phone: dto.phone,
        nickname: '小满',
        streakDays: 45
      }
    });

    return this.buildResult(user);
  }

  async wxLogin(dto: WxLoginDto) {
    const appId = this.configService.get<string>('WX_APPID');
    const appSecret = this.configService.get<string>('WX_APP_SECRET');

    if (!appId || !appSecret) {
      throw new UnauthorizedException('微信登录未配置');
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${dto.code}&grant_type=authorization_code`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.errcode) {
      throw new UnauthorizedException(`微信登录失败: ${data.errmsg}`);
    }

    const openid = data.openid as string;

    let user = await this.prisma.user.findUnique({ where: { openid } });

    if (!user) {
      const randomPhone = `wx_${openid.slice(-8)}`;
      user = await this.prisma.user.create({
        data: {
          phone: randomPhone,
          openid,
          nickname: '微信用户',
          streakDays: 0,
        },
      });
    }

    return this.buildResult(user);
  }

  private async buildResult(user: { id: string; phone: string; nickname: string; avatarUrl: string | null; streakDays: number }) {
    const accessToken = await this.jwtService.signAsync({ sub: user.id, phone: user.phone });
    return {
      accessToken,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        streakDays: user.streakDays,
      },
    };
  }
}
