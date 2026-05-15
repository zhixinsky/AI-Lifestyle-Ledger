import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { EmailService } from '../email/email.service';

interface CodeEntry {
  code: string;
  expiresAt: number;
}

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);
  private readonly phoneCodes = new Map<string, CodeEntry>();
  private readonly emailCodes = new Map<string, CodeEntry>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
  ) {}

  async profile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { identities: true },
    });
    if (!user) throw new NotFoundException('用户不存在');

    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      email: user.email,
      hasPassword: !!user.passwordHash,
      wechatBound: user.identities.some((item) => item.provider === 'wechat') || !!user.openid,
      phoneBound: user.identities.some((item) => item.provider === 'phone') || !!user.phone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async sendPhoneCode(phone?: string) {
    const normalized = this.normalizePhone(phone);
    const existing = this.phoneCodes.get(normalized);
    if (existing && existing.expiresAt - Date.now() > 4.5 * 60 * 1000) {
      throw new BadRequestException('发送过于频繁，请稍后再试');
    }

    const code = this.smsService.generateCode();
    const sent = await this.smsService.sendVerificationCode(normalized, code);
    if (!sent) throw new BadRequestException('短信发送失败，请稍后重试');

    this.phoneCodes.set(normalized, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
    return { success: true };
  }

  async bindPhone(userId: string, phone?: string, code?: string) {
    const normalized = this.normalizePhone(phone);
    this.verifyCode(this.phoneCodes, normalized, code, '验证码错误或已过期');

    const existing = await this.prisma.user.findUnique({ where: { phone: normalized } });
    if (existing && existing.id !== userId) throw new BadRequestException('该手机号已绑定其他账号');
    const existingIdentity = await this.prisma.userIdentity.findUnique({
      where: { provider_identifier: { provider: 'phone', identifier: normalized } },
    });
    if (existingIdentity && existingIdentity.userId !== userId) throw new BadRequestException('该手机号已绑定其他账号');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { phone: normalized },
      }),
      this.prisma.userIdentity.deleteMany({
        where: { userId, provider: 'phone', identifier: { not: normalized } },
      }),
      this.prisma.userIdentity.upsert({
        where: { provider_identifier: { provider: 'phone', identifier: normalized } },
        update: {},
        create: { userId, provider: 'phone', identifier: normalized },
      }),
    ]);

    this.phoneCodes.delete(normalized);
    return this.profile(userId);
  }

  async sendEmailCode(email?: string) {
    const normalized = this.normalizeEmail(email);
    const existing = this.emailCodes.get(normalized);
    if (existing && existing.expiresAt - Date.now() > 9.5 * 60 * 1000) {
      throw new BadRequestException('发送过于频繁，请稍后再试');
    }

    const code = this.smsService.generateCode();
    const sent = await this.emailService.sendVerificationCode(normalized, code);
    this.emailCodes.set(normalized, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
    if (!sent) this.logger.warn(`Email verification code for ${normalized}: ${code}`);
    return { success: true };
  }

  async bindEmail(userId: string, email?: string, code?: string) {
    const normalized = this.normalizeEmail(email);
    this.verifyCode(this.emailCodes, normalized, code, '邮箱验证码错误或已过期');

    const existing = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (existing && existing.id !== userId) throw new BadRequestException('该邮箱已绑定其他账号');

    await this.prisma.user.update({
      where: { id: userId },
      data: { email: normalized },
    });
    this.emailCodes.delete(normalized);
    return this.profile(userId);
  }

  async setPassword(userId: string, password?: string, confirmPassword?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    if (user.passwordHash) throw new BadRequestException('已设置登录密码，请使用修改密码');

    const hash = await this.hashPassword(password, confirmPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    return { success: true };
  }

  async changePassword(userId: string, oldPassword?: string, newPassword?: string, confirmPassword?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    if (!user.passwordHash) throw new BadRequestException('请先设置登录密码');
    if (!oldPassword || !(await bcrypt.compare(oldPassword, user.passwordHash))) {
      throw new BadRequestException('旧密码不正确');
    }

    const hash = await this.hashPassword(newPassword, confirmPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    return { success: true };
  }

  async deleteAccount(userId: string, confirm?: string) {
    if (confirm !== 'DELETE') throw new BadRequestException('请确认注销账号');
    await this.prisma.user.delete({ where: { id: userId } });
    return { success: true };
  }

  private normalizePhone(phone?: string) {
    const normalized = String(phone || '').trim();
    if (!/^1\d{10}$/.test(normalized)) throw new BadRequestException('请输入正确的手机号');
    return normalized;
  }

  private normalizeEmail(email?: string) {
    const normalized = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new BadRequestException('请输入正确的邮箱');
    return normalized;
  }

  private verifyCode(store: Map<string, CodeEntry>, key: string, code?: string, message = '验证码错误或已过期') {
    const entry = store.get(key);
    if (!entry || entry.code !== String(code || '').trim() || entry.expiresAt < Date.now()) {
      throw new BadRequestException(message);
    }
  }

  private async hashPassword(password?: string, confirmPassword?: string) {
    const value = String(password || '');
    if (value.length < 8) throw new BadRequestException('密码长度至少 8 位');
    if (value !== String(confirmPassword || '')) throw new BadRequestException('两次输入的密码不一致');
    return bcrypt.hash(value, 10);
  }
}
