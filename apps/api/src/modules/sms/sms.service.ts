import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly appId: string;
  private readonly secretKey: Buffer;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.appId = this.configService.get<string>('SMS_APP_ID', '');
    const key = this.configService.get<string>('SMS_SECRET_KEY', '');
    this.secretKey = Buffer.from(key, 'utf-8');
    this.baseUrl = this.configService.get<string>('SMS_BASE_URL', '');
  }

  private aesEncrypt(data: Buffer): Buffer {
    const cipher = crypto.createCipheriv('aes-128-ecb', this.secretKey, null);
    cipher.setAutoPadding(true);
    return Buffer.concat([cipher.update(data), cipher.final()]);
  }

  private aesDecrypt(data: Buffer): Buffer {
    const decipher = crypto.createDecipheriv('aes-128-ecb', this.secretKey, null);
    decipher.setAutoPadding(true);
    return Buffer.concat([decipher.update(data), decipher.final()]);
  }

  private async post(path: string, body: Record<string, unknown>): Promise<{ result: string; data: unknown }> {
    const json = JSON.stringify(body);
    const plainBytes = Buffer.from(json, 'utf-8');
    const encrypted = this.aesEncrypt(plainBytes);

    const url = `${this.baseUrl}${path}`;
    this.logger.debug(`SMS request -> ${url}`);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        appId: this.appId,
        'Content-Type': 'application/octet-stream',
      },
      body: encrypted,
    });

    const resultCode = res.headers.get('result') || '';

    if (resultCode !== 'SUCCESS') {
      this.logger.warn(`SMS API error: result=${resultCode}`);
      return { result: resultCode, data: null };
    }

    const resBuffer = Buffer.from(await res.arrayBuffer());
    const decrypted = this.aesDecrypt(resBuffer);
    const parsed = JSON.parse(decrypted.toString('utf-8'));

    return { result: 'SUCCESS', data: parsed };
  }

  async createTemplate(content: string, templateType = 2, templateFlag = 1): Promise<string | null> {
    const body: Record<string, unknown> = {
      templateContent: content,
      templateType,
      templateFlag,
      requestTime: Date.now(),
      requestValidPeriod: 60,
    };

    const { result, data } = await this.post('/inter/createTemplateSMS', body);
    if (result === 'SUCCESS' && data) {
      const templateId = (data as { templateId: string }).templateId;
      this.logger.log(`SMS template created: ${templateId}`);
      return templateId;
    }
    return null;
  }

  async sendTemplateSms(mobile: string, templateId: string): Promise<boolean> {
    const body = {
      smses: [{ mobile, customSmsId: `moona_${Date.now()}` }],
      templateId,
      requestTime: Date.now(),
      requestValidPeriod: 60,
    };

    const { result, data } = await this.post('/inter/sendTemplateNormalSMS', body);
    if (result === 'SUCCESS') {
      this.logger.log(`SMS sent to ${mobile}, response: ${JSON.stringify(data)}`);
      return true;
    }
    this.logger.warn(`SMS send failed to ${mobile}, result: ${result}`);
    return false;
  }

  async sendTemplateVariableSms(
    mobile: string,
    templateId: string,
    variables: Record<string, string>,
  ): Promise<boolean> {
    const body = {
      smses: [{ mobile, customSmsId: `moona_${Date.now()}`, content: variables }],
      templateId,
      requestTime: Date.now(),
      requestValidPeriod: 60,
    };

    const { result, data } = await this.post('/inter/sendTemplateVariableSMS', body);
    if (result === 'SUCCESS') {
      this.logger.log(`Variable SMS sent to ${mobile}, response: ${JSON.stringify(data)}`);
      return true;
    }
    this.logger.warn(`Variable SMS send failed to ${mobile}, result: ${result}`);
    return false;
  }

  async sendVerificationCode(mobile: string, code: string): Promise<boolean> {
    const templateId = this.configService.get<string>('SMS_TEMPLATE_ID', '');
    if (!templateId) {
      this.logger.error('SMS_TEMPLATE_ID not configured');
      return false;
    }
    return this.sendTemplateVariableSms(mobile, templateId, { code });
  }

  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
