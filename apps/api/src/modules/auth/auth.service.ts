import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { LoginDto } from './dto/login.dto';
import { SendCodeDto } from './dto/send-code.dto';

interface CodeEntry {
  code: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly codeStore = new Map<string, CodeEntry>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
  ) {}

  async sendCode(dto: SendCodeDto) {
    const existing = this.codeStore.get(dto.phone);
    if (existing && existing.expiresAt - Date.now() > 4.5 * 60 * 1000) {
      throw new BadRequestException('发送过于频繁，请稍后再试');
    }

    const code = this.smsService.generateCode();
    const sent = await this.smsService.sendVerificationCode(dto.phone, code);
    if (!sent) {
      throw new BadRequestException('短信发送失败，请稍后重试');
    }

    this.codeStore.set(dto.phone, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    this.logger.log(`Verification code sent to ${dto.phone}`);

    return { success: true };
  }

  async login(dto: LoginDto) {
    const entry = this.codeStore.get(dto.phone);
    if (!entry || entry.code !== dto.code || Date.now() > entry.expiresAt) {
      throw new UnauthorizedException('验证码错误或已过期');
    }
    this.codeStore.delete(dto.phone);

    const user = await this.prisma.user.upsert({
      where: { phone: dto.phone },
      update: {},
      create: {
        phone: dto.phone,
        nickname: '小满',
        streakDays: 0
      }
    });

    return this.buildResult(user);
  }

  async wxLogin(headerOpenid?: string, code?: string) {
    try {
      let openid = headerOpenid;

      this.logger.log(`wxLogin called, headerOpenid=${openid ? 'YES' : 'NO'}, code=${code ? 'YES' : 'NO'}`);

      if (!openid && code) {
        const appId = this.configService.get<string>('WX_APPID');
        const appSecret = this.configService.get<string>('WX_APP_SECRET');
        if (!appId || !appSecret) {
          throw new UnauthorizedException('微信登录未配置');
        }
        const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;
        const res = await fetch(url);
        const data = await res.json();
        this.logger.log(`WeChat response: errcode=${data.errcode}`);
        if (data.errcode) {
          throw new UnauthorizedException(`微信登录失败: ${data.errmsg}`);
        }
        openid = data.openid;
      }

      if (!openid) {
        throw new UnauthorizedException('无法获取openid');
      }

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
        this.logger.log('New user created for openid');
      }

      return this.buildResult(user);
    } catch (error: any) {
      this.logger.error(`wxLogin error: ${error?.message}`, error?.stack);
      throw error;
    }
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
