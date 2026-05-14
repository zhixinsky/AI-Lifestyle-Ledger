import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Resolver } from 'dns/promises';
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
  private readonly publicDnsResolver = new Resolver();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
  ) {
    this.publicDnsResolver.setServers(['119.29.29.29', '223.5.5.5', '8.8.8.8']);
  }

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

  async refreshSession(userId: string, code?: string, headerOpenid?: string) {
    if (!code) throw new BadRequestException('缺少微信登录 code，无法刷新支付登录态');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('用户不存在');

    const appId = this.configService.get<string>('WX_APPID');
    const appSecret = this.configService.get<string>('WX_APP_SECRET');
    if (!appId || !appSecret) throw new UnauthorizedException('微信登录未配置');

    this.logger.log(
      `refreshSession called, userId=${userId}, userOpenid=${user.openid ? 'YES' : 'NO'}, headerOpenid=${headerOpenid ? 'YES' : 'NO'}`,
    );

    let data: WeChatSessionResponse;
    try {
      data = await this.code2Session(appId, appSecret, code);
    } catch (error: any) {
      this.logger.warn(`refreshSession code2Session 请求失败: ${this.describeRequestError(error)}`);
      throw new BadRequestException(`刷新微信支付登录态失败: ${this.describeRequestError(error)}`);
    }

    if (data.errcode) throw new BadRequestException(`刷新微信支付登录态失败: ${data.errmsg}`);
    if (!data.openid || !data.session_key) {
      throw new BadRequestException('刷新微信支付登录态失败: 微信未返回 openid/session_key');
    }

    const normalizedHeaderOpenid = this.normalizeHeaderValue(headerOpenid);
    const expectedOpenid = user.openid || normalizedHeaderOpenid;
    if (expectedOpenid && expectedOpenid !== data.openid) {
      throw new UnauthorizedException('微信登录态不匹配，请重新登录后再支付');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        openid: user.openid || data.openid,
        wxSessionKey: data.session_key,
      },
    });

    this.logger.log('refreshSession 成功刷新 wxSessionKey');
    return { success: true };
  }

  private async code2Session(appId: string, appSecret: string, code: string): Promise<WeChatSessionResponse> {
    const params = new URLSearchParams({
      appid: appId,
      secret: appSecret,
      js_code: code,
      grant_type: 'authorization_code',
    });
    const path = `/sns/jscode2session?${params.toString()}`;
    const errors: string[] = [];

    try {
      this.logger.log('code2Session 使用公网 DNS 直连 api.weixin.qq.com');
      return await this.requestWeChatSession(path, true);
    } catch (error: any) {
      errors.push(`public-dns: ${this.describeRequestError(error)}`);
    }

    try {
      this.logger.log('code2Session 使用系统 DNS 直连 api.weixin.qq.com');
      return await this.requestWeChatSession(path, false);
    } catch (error: any) {
      errors.push(`system-dns: ${this.describeRequestError(error)}`);
    }

    throw new Error(errors.join(' ; '));
  }

  private async requestWeChatSession(path: string, usePublicDns: boolean): Promise<WeChatSessionResponse> {
    const connectHost = usePublicDns ? await this.resolvePublicWeChatHost() : 'api.weixin.qq.com';

    return new Promise((resolve, reject) => {
      const req = httpsRequest(
        {
          hostname: connectHost,
          servername: 'api.weixin.qq.com',
          path,
          method: 'GET',
          timeout: 8000,
          family: 4,
          headers: {
            Accept: 'application/json',
            Host: 'api.weixin.qq.com',
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

  private async resolvePublicWeChatHost() {
    const addresses = await this.publicDnsResolver.resolve4('api.weixin.qq.com');
    const address = addresses[0];
    if (!address) throw new Error('public DNS returned empty address list');
    return address;
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
