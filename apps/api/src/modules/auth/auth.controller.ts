import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { WxLoginDto } from './dto/wx-login.dto';
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
  wxLogin(@Body() dto: WxLoginDto) {
    return this.authService.wxLogin(dto);
  }
}
