import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SendCodeDto } from './dto/send-code.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  sendCode(@Body() dto: SendCodeDto) {
    return this.authService.sendCode(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('wx-login')
  wxLogin(
    @Headers('x-wx-openid') openid: string,
    @Headers('x-wx-unionid') unionid: string,
    @Body() body: { code?: string },
  ) {
    return this.authService.wxLogin(openid, body.code, unionid);
  }

  @Post('refresh-session')
  @UseGuards(AuthGuard('jwt'))
  refreshSession(
    @CurrentUser() user: AuthUser,
    @Headers('x-wx-openid') openid: string,
    @Body() body: { code?: string },
  ) {
    return this.authService.refreshSession(user.sub, body.code, openid);
  }
}
