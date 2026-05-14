import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import { MemberLevel, Order, OrderStatus, OrderType } from '@prisma/client';
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
  months: number | null;
  description: string;
}

const MEMBER_PLANS: Record<string, MemberPlan> = {
  monthly_pro: { id: 'monthly_pro', level: MemberLevel.pro, amount: 8, months: 1, description: 'Moona Pro 月卡' },
  quarterly_pro: { id: 'quarterly_pro', level: MemberLevel.pro, amount: 18, months: 3, description: 'Moona Pro 季卡' },
  yearly_pro: { id: 'yearly_pro', level: MemberLevel.pro, amount: 68, months: 12, description: 'Moona Pro 年卡' },
  yearly_premium: { id: 'yearly_premium', level: MemberLevel.premium, amount: 288, months: null, description: 'Moona Premium 永久会员' },
};

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  private readonly configured: boolean;
  private readonly appId = this.readEnv('WX_APPID') || this.readEnv('WX_APP_ID');
  private readonly offerId = this.readEnv('WX_VIRTUAL_PAY_OFFER_ID') || this.readEnv('WX_PAY_OFFER_ID');
  private readonly env = Number(this.readEnv('WX_VIRTUAL_PAY_ENV') || '0');
  private readonly mode = this.readEnv('WX_VIRTUAL_PAY_MODE') || 'short_series_goods';
  private readonly appKey =
    this.env === 1
      ? this.readEnv('WX_VIRTUAL_PAY_SANDBOX_APP_KEY') || this.readEnv('WX_VIRTUAL_PAY_APP_KEY')
      : this.readEnv('WX_VIRTUAL_PAY_APP_KEY') || this.readEnv('WX_VIRTUAL_PAY_PROD_APP_KEY');
  private readonly trustClientSuccess = this.readEnv('WX_VIRTUAL_PAY_TRUST_CLIENT_SUCCESS') === 'true';
  private readonly notifySecret = this.readEnv('WX_VIRTUAL_PAY_NOTIFY_SECRET');

  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: MembershipService,
  ) {
    this.configured = !!(this.appId && this.offerId && this.appKey);
    if (!this.configured) {
      this.logger.warn('微信虚拟支付未完整配置，将使用模拟模式');
    } else {
      this.logger.log(
        `微信虚拟支付配置已加载 appId=${this.mask(this.appId)} offerId=${this.mask(this.offerId)} env=${this.env}`,
      );
    }
  }

  async createOrder(dto: CreateOrderDto) {
    const plan = dto.type === OrderType.subscription ? this.getPlan(dto.planId, dto.amount) : undefined;
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new BadRequestException('用户不存在');
    if (this.configured && !user.openid) {
      throw new BadRequestException('当前账号缺少微信 openid，无法发起小程序支付');
    }
    if (this.configured && !user.wxSessionKey) {
      throw new BadRequestException('当前微信登录态已过期，请重新登录后再支付');
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
        message: '微信虚拟支付未配置，请设置 WX_APPID、WX_VIRTUAL_PAY_OFFER_ID、WX_VIRTUAL_PAY_APP_KEY',
      };
    }

    return {
      orderId: order.id,
      virtualPayParams: this.buildVirtualPayParams(order, user.wxSessionKey!),
    };
  }

  async handleNotify(body: any, rawBody?: string, secret?: string) {
    if (!this.configured) {
      return { ErrCode: 0, ErrMsg: '模拟模式' };
    }
    if (this.notifySecret && secret !== this.notifySecret) {
      return { ErrCode: 1, ErrMsg: '无效的回调地址' };
    }

    const payload = this.parseVirtualPayNotify(body, rawBody);
    const event = payload?.Event || payload?.event;
    const orderId = payload?.OutTradeNo || payload?.outTradeNo || payload?.out_trade_no || payload?.MchOrderId;
    if (!orderId) {
      return { ErrCode: 1, ErrMsg: '无效的回调数据' };
    }

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return { ErrCode: 1, ErrMsg: '订单不存在' };
    }
    const expectedPrice = Math.round(Number(order.amount) * 100);
    const actualPrice = this.getNotifyActualPrice(payload);
    if (actualPrice !== undefined && actualPrice !== expectedPrice) {
      return { ErrCode: 1, ErrMsg: '订单金额不匹配' };
    }
    const notifyEnv = Number(payload?.Env ?? payload?.env);
    if (!Number.isNaN(notifyEnv) && notifyEnv !== this.env) {
      return { ErrCode: 1, ErrMsg: '支付环境不匹配' };
    }

    if (event === 'xpay_goods_deliver_notify' || event === 'xpay_coin_pay_notify') {
      const wxPayInfo = payload.WeChatPayInfo || payload.weChatPayInfo || {};
      await this.completePaidOrder(order, wxPayInfo.TransactionId || wxPayInfo.transactionId);
    }

    return { ErrCode: 0, ErrMsg: 'success' };
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

  async syncOrder(orderId: string, userId: string, clientPaid = false) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new BadRequestException('订单不存在');
    if (order.userId !== userId) throw new ForbiddenException('无权访问此订单');
    if (order.status === OrderStatus.paid) return { paid: true, order };
    if (clientPaid && this.trustClientSuccess) {
      const paidOrder = await this.completePaidOrder(order);
      return { paid: true, order: paidOrder };
    }
    return { paid: false, order };
  }

  async listOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private buildVirtualPayParams(order: Order, sessionKey: string) {
    const plan = this.getPlan(undefined, Number(order.amount));
    const signData = JSON.stringify({
      offerId: this.offerId,
      buyQuantity: 1,
      env: this.env,
      currencyType: 'CNY',
      productId: this.getProductId(plan.id),
      goodsPrice: Math.round(Number(order.amount) * 100),
      outTradeNo: order.id,
      attach: JSON.stringify({ userId: order.userId, planId: plan.id }),
    });

    return {
      mode: this.mode,
      signData,
      paySig: this.hmacSha256(this.appKey, `requestVirtualPayment&${signData}`),
      signature: this.hmacSha256(sessionKey, signData),
    };
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

  private getProductId(planId: string) {
    return this.readEnv(`WX_VIRTUAL_PAY_PRODUCT_${planId.toUpperCase()}`) || planId;
  }

  private parseVirtualPayNotify(body: any, rawBody?: string) {
    if (body && Object.keys(body).length > 0) return body;
    if (!rawBody) return {};
    try {
      return JSON.parse(rawBody);
    } catch {
      const result: Record<string, string> = {};
      for (const [, key, value] of rawBody.matchAll(/<([^/][^>]*)>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/\1>/g)) {
        result[key] = value;
      }
      return result;
    }
  }

  private getNotifyActualPrice(payload: any) {
    const goodsInfo = payload?.GoodsInfo || payload?.goodsInfo;
    const coinInfo = payload?.CoinInfo || payload?.coinInfo;
    const value = goodsInfo?.ActualPrice ?? goodsInfo?.actualPrice ?? coinInfo?.ActualPrice ?? coinInfo?.actualPrice;
    if (value === undefined || value === null || value === '') return undefined;
    const price = Number(value);
    return Number.isNaN(price) ? undefined : price;
  }

  private hmacSha256(key: string, message: string) {
    return createHmac('sha256', key).update(message).digest('hex');
  }

  private readEnv(name: string) {
    return (process.env[name] || '').trim();
  }

  private mask(value: string) {
    if (!value) return '-';
    if (value.length <= 8) return `${value.slice(0, 2)}***`;
    return `${value.slice(0, 4)}***${value.slice(-4)}`;
  }
}
