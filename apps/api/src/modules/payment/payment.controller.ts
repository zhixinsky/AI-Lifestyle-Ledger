import { Controller, Post, Get, Body, Headers, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrderType } from '@prisma/client';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-order')
  @UseGuards(AuthGuard('jwt'))
  async createOrder(
    @CurrentUser() user: AuthUser,
    @Body() body: { type?: string; amount?: number; description?: string; planId?: string },
  ) {
    return this.paymentService.createOrder({
      userId: user.sub,
      type: body.type === 'one_time' ? OrderType.one_time : OrderType.subscription,
      amount: body.amount,
      description: body.description,
      planId: body.planId,
    });
  }

  @Post('notify')
  async handleNotify(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Query('secret') secret: string,
    @Req() req: any,
  ) {
    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(body);
    return this.paymentService.handleNotify(body, rawBody, secret);
  }

  @Post('mock-pay/:orderId')
  @UseGuards(AuthGuard('jwt'))
  async mockPay(@Param('orderId') orderId: string) {
    return this.paymentService.mockPaySuccess(orderId);
  }

  @Post('sync/:orderId')
  @UseGuards(AuthGuard('jwt'))
  async syncOrder(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
    @Body() body: { clientPaid?: boolean },
  ) {
    return this.paymentService.syncOrder(orderId, user.sub, body.clientPaid === true);
  }

  @Get('orders')
  @UseGuards(AuthGuard('jwt'))
  async listOrders(@CurrentUser() user: AuthUser) {
    return this.paymentService.listOrders(user.sub);
  }

  @Get('order/:id')
  @UseGuards(AuthGuard('jwt'))
  async getOrder(@Param('id') id: string) {
    return this.paymentService.queryOrder(id);
  }
}
