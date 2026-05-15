import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendVerificationCode(to: string, code: string): Promise<boolean> {
    const host = this.config.get<string>('SMTP_HOST', '');
    const port = Number(this.config.get<string>('SMTP_PORT', '465'));
    const user = this.config.get<string>('SMTP_USER', '');
    const pass = this.config.get<string>('SMTP_PASS', '');
    const from = this.config.get<string>('SMTP_FROM', user);

    if (!host || !port || !user || !pass || !from) {
      this.logger.warn(`SMTP not configured, email verification code for ${to}: ${code}`);
      return false;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    try {
      await transporter.sendMail({
        from,
        to,
        subject: 'Moona 邮箱验证码',
        text: `你的 Moona 邮箱验证码是：${code}。验证码 10 分钟内有效，请勿转发给他人。`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2937;line-height:1.7">
            <h2 style="margin:0 0 12px;color:#20352f">Moona 邮箱验证码</h2>
            <p>你的验证码是：</p>
            <p style="font-size:28px;font-weight:700;letter-spacing:4px;color:#217a65;margin:16px 0">${code}</p>
            <p>验证码 10 分钟内有效，请勿转发给他人。</p>
          </div>
        `,
      });
      this.logger.log(`Email verification code sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Email send failed to ${to}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}
