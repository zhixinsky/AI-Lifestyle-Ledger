import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { lookup } from 'dns';
import { request as httpsRequest } from 'https';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { LoginDto } from './dto/login.dto';
import { SendCodeDto } from './dto/send-code.dto';

interface CodeEntry {
  code: string;
  expiresAt: number;
}

interface WeChatSessionResponse {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
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
        nickname: '',
        streakDays: 0
      }
    });

    return this.buildResult(user);
  }

  async wxLogin(headerOpenid?: string, code?: string, headerUnionid?: string) {
    try {
      const rawHeaderOpenid = this.normalizeHeaderValue(headerOpenid);
      const unionid = this.normalizeHeaderValue(headerUnionid);
      let openid = rawHeaderOpenid || unionid;
      const headerIdentitySource = rawHeaderOpenid ? 'x-wx-openid' : unionid ? 'x-wx-unionid' : '-';
      let sessionKey: string | undefined;

      this.logger.log(
        `wxLogin called, headerOpenid=${openid ? 'YES' : 'NO'}, headerUnionid=${unionid ? 'YES' : 'NO'}, code=${code ? 'YES' : 'NO'}`,
      );

      if (openid) {
        this.logger.log(`wxLogin 使用云托管 ${headerIdentitySource} 登录，跳过 code2Session`);
      } else if (code) {
        this.logger.log('wxLogin 未收到 headerOpenid，开始调用 code2Session');
        const appId = this.configService.get<string>('WX_APPID');
        const appSecret = this.configService.get<string>('WX_APP_SECRET');
        if (!appId || !appSecret) {
          throw new UnauthorizedException('微信登录未配置');
        }
        try {
          const data = await this.code2Session(appId, appSecret, code);
          this.logger.log(`WeChat response: errcode=${data.errcode}`);
          if (data.errcode) {
            throw new UnauthorizedException(`微信登录失败: ${data.errmsg}`);
          }
          if (!data.openid) {
            throw new UnauthorizedException('微信登录失败: code2Session 未返回 openid');
          }
          if (openid && openid !== data.openid) {
            throw new UnauthorizedException('微信登录态不匹配');
          }
          openid = data.openid;
          sessionKey = data.session_key;
        } catch (error: any) {
          this.logger.warn(`code2Session 请求失败: ${this.describeRequestError(error)}`);
          throw error;
        }
      } else {
        this.logger.warn('wxLogin 缺少 headerOpenid 且缺少 code，无法登录');
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
            wxSessionKey: sessionKey,
            nickname: '',
            streakDays: 0,
          },
        });
        this.logger.log('New user created for openid');
      } else if (sessionKey) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { wxSessionKey: sessionKey },
        });
      }

      return this.buildResult(user);
    } catch (error: any) {
      this.logger.error(`wxLogin error: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  private code2Session(appId: string, appSecret: string, code: string): Promise<WeChatSessionResponse> {
    const params = new URLSearchParams({
      appid: appId,
      secret: appSecret,
      js_code: code,
      grant_type: 'authorization_code',
    });
    const path = `/sns/jscode2session?${params.toString()}`;

    return new Promise((resolve, reject) => {
      const req = httpsRequest(
        {
          hostname: 'api.weixin.qq.com',
          path,
          method: 'GET',
          timeout: 8000,
          family: 4,
          lookup,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'MoonaCloudRun/1.0',
          },
        },
        (res) => {
          let text = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            text += chunk;
          });
          res.on('end', () => {
            try {
              const data = JSON.parse(text || '{}') as WeChatSessionResponse;
              if ((res.statusCode || 0) >= 400) {
                reject(new Error(`HTTP ${res.statusCode}: ${text.slice(0, 200)}`));
                return;
              }
              resolve(data);
            } catch (error: any) {
              reject(new Error(`Invalid JSON from WeChat: ${error?.message || error}`));
            }
          });
        },
      );

      req.on('timeout', () => {
        req.destroy(new Error('code2Session timeout'));
      });
      req.on('error', reject);
      req.end();
    });
  }

  private describeRequestError(error: any) {
    const cause = error?.cause;
    const parts = [
      error?.message,
      error?.code,
      cause?.message,
      cause?.code,
      cause?.errno,
      cause?.syscall,
      cause?.hostname,
    ].filter(Boolean);
    return parts.length ? parts.join(' | ') : String(error);
  }

  private normalizeHeaderValue(value?: string) {
    if (!value) return '';
    return String(value).trim();
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
