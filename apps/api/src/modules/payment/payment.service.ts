import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { createDecipheriv, createSign, createVerify, randomBytes } from 'crypto';
import { Order, OrderStatus, OrderType, MemberLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipService } from '../membership/membership.service';

interface CreateOrderDto {
  userId: string;
  type: OrderType;
  amount?: number;
  description?: string;
  planId?: string;
}

interface MemberPlan {
  id: string;
  level: MemberLevel;
  amount: number;
  months: number;
  description: string;
}

const MEMBER_PLANS: Record<string, MemberPlan> = {
  monthly_pro: { id: 'monthly_pro', level: MemberLevel.pro, amount: 28, months: 1, description: 'Moona Pro 月卡' },
  quarterly_pro: { id: 'quarterly_pro', level: MemberLevel.pro, amount: 68, months: 3, description: 'Moona Pro 季卡' },
  yearly_pro: { id: 'yearly_pro', level: MemberLevel.pro, amount: 198, months: 12, description: 'Moona Pro 年卡' },
  yearly_premium: { id: 'yearly_premium', level: MemberLevel.premium, amount: 298, months: 12, description: 'Moona Premium 年卡' },
};

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  private readonly configured: boolean;
  private readonly appId = process.env.WX_APPID || process.env.WX_APP_ID || '';
  private readonly mchId = process.env.WX_PAY_MCH_ID || '';
  private readonly apiV3Key = process.env.WX_PAY_API_V3_KEY || process.env.WX_PAY_API_KEY || '';
  private readonly certSerialNo = process.env.WX_PAY_CERT_SERIAL || '';
  private readonly privateKey = this.normalizePrivateKey(
    process.env.WX_PAY_PRIVATE_KEY || process.env.WX_PAY_PRIVATE_KEY_BASE64 || '',
  );
  private readonly wxPayPublicKeyId = process.env.WX_PAY_PUBLIC_KEY_ID || '';
  private readonly wxPayPublicKey = this.normalizePrivateKey(
    process.env.WX_PAY_PUBLIC_KEY || process.env.WX_PAY_PUBLIC_KEY_BASE64 || '',
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: MembershipService,
  ) {
    this.configured = !!(
      this.appId &&
      this.mchId &&
      this.apiV3Key &&
      this.certSerialNo &&
      this.privateKey
    );
    if (!this.configured) {
      this.logger.warn('微信支付未完整配置，将使用模拟模式');
    }
    if (this.configured && !this.wxPayPublicKey) {
      this.logger.warn('微信支付公钥未配置，将跳过微信应答和回调验签');
    }
  }

  async createOrder(dto: CreateOrderDto) {
    const plan = dto.type === OrderType.subscription ? this.getPlan(dto.planId, dto.amount) : undefined;
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new BadRequestException('用户不存在');
    if (this.configured && !user.openid) {
      throw new BadRequestException('当前账号缺少微信 openid，无法发起小程序支付');
    }

    const order = await this.prisma.order.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        amount: plan?.amount ?? dto.amount ?? 0,
        description: plan?.description ?? dto.description,
        status: OrderStatus.pending,
      },
    });

    if (!this.configured) {
      return {
        orderId: order.id,
        mock: true,
        message:
          '微信支付未配置，请设置 WX_APPID、WX_PAY_MCH_ID、WX_PAY_CERT_SERIAL、WX_PAY_PRIVATE_KEY、WX_PAY_API_V3_KEY',
      };
    }

    const wxParams = await this.callWxPayApi(order, user.openid!);
    return { orderId: order.id, wxParams };
  }

  async handleNotify(body: any, rawBody?: string, headers?: Record<string, string>) {
    if (!this.configured) {
      return { code: 'SUCCESS', message: '模拟模式' };
    }
    if (this.wxPayPublicKey && !this.verifyWxPaySignature(rawBody || JSON.stringify(body), headers || {})) {
      throw new BadRequestException('微信支付回调验签失败');
    }

    const payload = this.decryptNotifyResource(body?.resource);
    const orderId = payload?.out_trade_no;
    if (!orderId) {
      return { code: 'FAIL', message: '无效的回调数据' };
    }

    const order = await this.prisma.order.findFirst({
      where: { id: orderId },
    });
    if (!order) {
      return { code: 'FAIL', message: '订单不存在' };
    }

    if (payload.trade_state === 'SUCCESS') {
      await this.completePaidOrder(order, payload.transaction_id);
    }

    return { code: 'SUCCESS', message: '成功' };
  }

  async mockPaySuccess(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('订单不存在');
    if (order.status !== OrderStatus.pending) throw new Error('订单状态不正确');

    await this.completePaidOrder(order);

    return { success: true, message: '模拟支付成功' };
  }

  async queryOrder(orderId: string) {
    return this.prisma.order.findUnique({ where: { id: orderId } });
  }

  async syncOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new BadRequestException('订单不存在');
    if (order.userId !== userId) throw new ForbiddenException('无权访问此订单');
    if (order.status === OrderStatus.paid) return { paid: true, order };
    if (!this.configured) return { paid: false, order };

    const wxOrder = await this.queryWxPayOrder(order.id);
    if (wxOrder?.trade_state === 'SUCCESS') {
      const paidOrder = await this.completePaidOrder(order, wxOrder.transaction_id);
      return { paid: true, order: paidOrder };
    }
    return { paid: false, tradeState: wxOrder?.trade_state, order };
  }

  async listOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private async callWxPayApi(order: Order, openid: string) {
    const url = 'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi';
    const body = {
      appid: this.appId,
      mchid: this.mchId,
      description: order.description || 'Moona 会员服务',
      out_trade_no: order.id,
      notify_url: this.getNotifyUrl(),
      amount: { total: Math.round(Number(order.amount) * 100), currency: 'CNY' },
      payer: { openid },
    };

    const res = await this.wxPayRequest<{ prepay_id: string }>('POST', url, body);
    if (!res.prepay_id) throw new BadRequestException('微信预支付下单失败');

    const timeStamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = randomBytes(16).toString('hex');
    const pkg = `prepay_id=${res.prepay_id}`;
    const paySign = this.sign(`${this.appId}\n${timeStamp}\n${nonceStr}\n${pkg}\n`);
    return {
      appId: this.appId,
      timeStamp,
      nonceStr,
      package: pkg,
      signType: 'RSA',
      paySign,
    };
  }

  private async queryWxPayOrder(orderId: string) {
    const url = `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${orderId}?mchid=${this.mchId}`;
    return this.wxPayRequest<{ trade_state: string; transaction_id?: string }>('GET', url);
  }

  private async completePaidOrder(order: Order, wxTransactionId?: string) {
    if (order.status === OrderStatus.paid) return order;

    const paidOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.paid,
        paidAt: new Date(),
        wxPayOrderId: wxTransactionId,
      },
    });

    if (order.type === OrderType.subscription) {
      const plan = this.getPlan(undefined, Number(order.amount));
      await this.membershipService.activate(order.userId, plan.level, plan.months);
    }

    return paidOrder;
  }

  private getPlan(planId?: string, amount?: number): MemberPlan {
    if (planId && MEMBER_PLANS[planId]) return MEMBER_PLANS[planId];
    const plan = Object.values(MEMBER_PLANS).find((item) => item.amount === Number(amount));
    if (plan) return plan;
    throw new BadRequestException('无效的会员套餐');
  }

  private getNotifyUrl() {
    if (process.env.WX_PAY_NOTIFY_URL) return process.env.WX_PAY_NOTIFY_URL;
    const baseUrl = process.env.API_PUBLIC_BASE_URL;
    if (!baseUrl) throw new BadRequestException('请配置 WX_PAY_NOTIFY_URL 或 API_PUBLIC_BASE_URL');
    return `${baseUrl.replace(/\/$/, '')}/api/payment/notify`;
  }

  private async wxPayRequest<T>(method: 'GET' | 'POST', url: string, body?: unknown): Promise<T> {
    const bodyText = body ? JSON.stringify(body) : '';
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = randomBytes(16).toString('hex');
    const urlPath = new URL(url).pathname + new URL(url).search;
    const signature = this.sign(`${method}\n${urlPath}\n${timestamp}\n${nonceStr}\n${bodyText}\n`);
    const authorization =
      `WECHATPAY2-SHA256-RSA2048 mchid="${this.mchId}",nonce_str="${nonceStr}",` +
      `signature="${signature}",timestamp="${timestamp}",serial_no="${this.certSerialNo}"`;

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: authorization,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: bodyText || undefined,
    });
    const responseText = await res.text();
    if (this.wxPayPublicKey && !this.verifyWxPaySignature(responseText, Object.fromEntries(res.headers.entries()))) {
      this.logger.error('微信支付应答验签失败');
      throw new BadRequestException('微信支付应答验签失败');
    }
    let data: any = {};
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { raw: responseText };
      }
    }
    const requestId = res.headers.get('Request-ID') || res.headers.get('Wechatpay-Request-Id');
    if (!res.ok) {
      this.logger.error(`微信支付请求失败 requestId=${requestId || '-'} status=${res.status} body=${responseText}`);
      throw new BadRequestException(data?.message || '微信支付请求失败');
    }
    this.logger.log(`微信支付请求成功 requestId=${requestId || '-'}`);
    return data as T;
  }

  private verifyWxPaySignature(bodyText: string, headers: Record<string, string>) {
    const timestamp = this.getHeader(headers, 'wechatpay-timestamp');
    const nonce = this.getHeader(headers, 'wechatpay-nonce');
    const signature = this.getHeader(headers, 'wechatpay-signature');
    const serial = this.getHeader(headers, 'wechatpay-serial');

    if (!timestamp || !nonce || !signature) {
      this.logger.warn('微信支付验签失败：缺少 Wechatpay 签名头');
      return false;
    }
    if (this.wxPayPublicKeyId && serial && serial !== this.wxPayPublicKeyId) {
      this.logger.warn(`微信支付验签失败：公钥ID不匹配 header=${serial}`);
      return false;
    }
    if (signature.includes('WECHATPAY/SIGNTEST/')) {
      this.logger.warn('微信支付验签失败：收到签名探测流量');
      return false;
    }

    const message = `${timestamp}\n${nonce}\n${bodyText}\n`;
    return createVerify('RSA-SHA256')
      .update(message)
      .verify(this.wxPayPublicKey, signature, 'base64');
  }

  private getHeader(headers: Record<string, string>, name: string) {
    const found = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
    return found?.[1];
  }

  private decryptNotifyResource(resource: any) {
    if (!resource?.ciphertext || !resource?.nonce) return null;
    const key = Buffer.from(this.apiV3Key, 'utf8');
    const ciphertext = Buffer.from(resource.ciphertext, 'base64');
    const authTag = ciphertext.subarray(ciphertext.length - 16);
    const data = ciphertext.subarray(0, ciphertext.length - 16);
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(resource.nonce, 'utf8'));
    if (resource.associated_data) {
      decipher.setAAD(Buffer.from(resource.associated_data, 'utf8'));
    }
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
    return JSON.parse(decrypted);
  }

  private sign(message: string) {
    return createSign('RSA-SHA256').update(message).sign(this.privateKey, 'base64');
  }

  private normalizePrivateKey(value: string) {
    if (!value) return '';
    const decoded = value.includes('BEGIN') ? value : Buffer.from(value, 'base64').toString('utf8');
    return decoded.replace(/\\n/g, '\n');
  }
}
