import { Controller, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

/** 与 PATCH /api/users/me 等价；POST 供微信快捷登录完善资料 */
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Post('profile')
  saveProfile(
    @CurrentUser() user: AuthUser,
    @Body() body: { nickname?: string; avatarUrl?: string; smartGreetingEnabled?: boolean },
  ) {
    return this.usersService.updateProfile(user.sub, body);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() body: { nickname?: string; avatarUrl?: string; smartGreetingEnabled?: boolean },
  ) {
    return this.usersService.updateProfile(user.sub, body);
  }
}
