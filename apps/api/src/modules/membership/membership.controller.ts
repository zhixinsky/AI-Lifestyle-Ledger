import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';
import { MembershipService } from './membership.service';

@Controller('membership')
@UseGuards(AuthGuard('jwt'))
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get('status')
  async getStatus(@CurrentUser() user: AuthUser) {
    return this.membershipService.getStatus(user.sub);
  }

  @Post('auto-renew')
  async setAutoRenew(@CurrentUser() user: AuthUser, @Body('autoRenew') autoRenew: boolean) {
    await this.membershipService.setAutoRenew(user.sub, autoRenew);
    return { success: true };
  }
}
