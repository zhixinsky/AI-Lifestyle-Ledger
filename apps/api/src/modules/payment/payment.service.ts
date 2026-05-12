import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus, OrderType, MemberLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipService } from '../membership/membership.service';

interface CreateOrderDto {
  userId: string;
  type: OrderType;
  amount: number;
  description?: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  private readonly configured: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: MembershipService,
  ) {
    this.configured = !!(
      process.env.WX_PAY_MCH_ID &&
      process.env.WX_PAY_API_KEY
    );
    if (!this.configured) {
      this.logger.warn('微信支付未配置，将使用模拟模式');
    }
  }

  async createOrder(dto: CreateOrderDto) {
    const order = await this.prisma.order.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        amount: dto.amount,
        description: dto.description,
        status: OrderStatus.pending,
      },
    });

    if (!this.configured) {
      return {
        orderId: order.id,
        mock: true,
        message: '微信支付未配置，请在环境变量中设置 WX_PAY_MCH_ID 和 WX_PAY_API_KEY',
      };
    }

    const wxParams = await this.callWxPayApi(order);
    return { orderId: order.id, wxParams };
  }

  async handleNotify(body: any) {
    if (!this.configured) {
      return { code: 'SUCCESS', message: '模拟模式' };
    }

    const wxPayOrderId = body?.resource?.ciphertext?.out_trade_no;
    if (!wxPayOrderId) {
      return { code: 'FAIL', message: '无效的回调数据' };
    }

    const order = await this.prisma.order.findFirst({
      where: { id: wxPayOrderId },
    });
    if (!order) {
      return { code: 'FAIL', message: '订单不存在' };
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.paid,
        paidAt: new Date(),
        wxPayOrderId: body?.resource?.ciphertext?.transaction_id,
      },
    });

    if (order.type === OrderType.subscription) {
      const months = this.getMonthsFromAmount(Number(order.amount));
      const level = this.getLevelFromAmount(Number(order.amount));
      await this.membershipService.activate(order.userId, level, months);
    }

    return { code: 'SUCCESS', message: '成功' };
  }

  async mockPaySuccess(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('订单不存在');
    if (order.status !== OrderStatus.pending) throw new Error('订单状态不正确');

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.paid, paidAt: new Date() },
    });

    if (order.type === OrderType.subscription) {
      const months = this.getMonthsFromAmount(Number(order.amount));
      const level = this.getLevelFromAmount(Number(order.amount));
      await this.membershipService.activate(order.userId, level, months);
    }

    return { success: true, message: '模拟支付成功' };
  }

  async queryOrder(orderId: string) {
    return this.prisma.order.findUnique({ where: { id: orderId } });
  }

  async listOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private async callWxPayApi(_order: any) {
    // Placeholder for real WeChat Pay V3 API integration
    // Uses: WX_PAY_MCH_ID, WX_PAY_API_KEY, WX_PAY_CERT_SERIAL, WX_PAY_PRIVATE_KEY
    return {
      appId: process.env.WX_APP_ID,
      timeStamp: String(Math.floor(Date.now() / 1000)),
      nonceStr: Math.random().toString(36).substring(2, 15),
      package: 'prepay_id=mock',
      signType: 'RSA',
      paySign: 'mock_sign',
    };
  }

  private getMonthsFromAmount(amount: number): number {
    if (amount >= 198) return 12;
    if (amount >= 68) return 3;
    return 1;
  }

  private getLevelFromAmount(amount: number): MemberLevel {
    if (amount >= 298) return MemberLevel.premium;
    return MemberLevel.pro;
  }
}
