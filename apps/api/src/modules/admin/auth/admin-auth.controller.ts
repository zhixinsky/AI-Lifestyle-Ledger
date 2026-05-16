import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { AdminAuthService } from './admin-auth.service';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../decorators/current-admin.decorator';

class AdminLoginDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;
}

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Post('login')
  login(@Body() dto: AdminLoginDto) {
    return this.auth.login(dto.username, dto.password);
  }

  @Get('me')
  @UseGuards(AdminJwtAuthGuard)
  me(@CurrentAdmin() admin: { sub: string }) {
    return this.auth.me(admin.sub);
  }

  @Post('logout')
  @UseGuards(AdminJwtAuthGuard)
  logout() {
    return { ok: true };
  }
}
