import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';
import { GrowthService } from './growth.service';

@Controller('growth')
export class GrowthController {
  constructor(private readonly growthService: GrowthService) {}

  @Get('badges')
  @UseGuards(AuthGuard('jwt'))
  async listBadges(@CurrentUser() user: AuthUser) {
    return this.growthService.listBadges(user.sub);
  }

  @Get('challenges')
  @UseGuards(AuthGuard('jwt'))
  async listChallenges(@CurrentUser() user: AuthUser) {
    return this.growthService.listChallenges(user.sub);
  }

  @Post('challenges/:id/join')
  @UseGuards(AuthGuard('jwt'))
  async joinChallenge(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.growthService.joinChallenge(user.sub, id);
  }

  @Post('check-badges')
  @UseGuards(AuthGuard('jwt'))
  async checkBadges(@CurrentUser() user: AuthUser) {
    return this.growthService.checkAndAwardBadges(user.sub);
  }

  @Post('seed')
  async seed() {
    const badges = await this.growthService.seedBadges();
    const challenges = await this.growthService.seedChallenges();
    return { badges, challenges };
  }
}
