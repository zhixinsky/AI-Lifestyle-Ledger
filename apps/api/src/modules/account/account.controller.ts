import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountService } from './account.service';

@UseGuards(JwtAuthGuard)
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('profile')
  profile(@CurrentUser() user: AuthUser) {
    return this.accountService.profile(user.sub);
  }

  @Post('send-phone-code')
  sendPhoneCode(@Body() body: { phone?: string }) {
    return this.accountService.sendPhoneCode(body.phone);
  }

  @Post('bind-phone')
  bindPhone(@CurrentUser() user: AuthUser, @Body() body: { phone?: string; code?: string }) {
    return this.accountService.bindPhone(user.sub, body.phone, body.code);
  }

  @Post('send-email-code')
  sendEmailCode(@Body() body: { email?: string }) {
    return this.accountService.sendEmailCode(body.email);
  }

  @Post('bind-email')
  bindEmail(@CurrentUser() user: AuthUser, @Body() body: { email?: string; code?: string }) {
    return this.accountService.bindEmail(user.sub, body.email, body.code);
  }

  @Post('set-password')
  setPassword(@CurrentUser() user: AuthUser, @Body() body: { password?: string; confirmPassword?: string }) {
    return this.accountService.setPassword(user.sub, body.password, body.confirmPassword);
  }

  @Post('change-password')
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() body: { oldPassword?: string; newPassword?: string; confirmPassword?: string },
  ) {
    return this.accountService.changePassword(user.sub, body.oldPassword, body.newPassword, body.confirmPassword);
  }

  @Post('logout')
  logout() {
    return { success: true };
  }

  @Post('delete-account')
  deleteAccount(@CurrentUser() user: AuthUser, @Body() body: { confirm?: string }) {
    return this.accountService.deleteAccount(user.sub, body.confirm);
  }
}
