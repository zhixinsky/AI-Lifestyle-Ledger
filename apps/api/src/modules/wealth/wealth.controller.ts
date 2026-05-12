import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WealthService } from './wealth.service';
import { WealthAiService } from './wealth-ai.service';

@Controller('wealth')
@UseGuards(JwtAuthGuard)
export class WealthController {
  constructor(
    private readonly wealthService: WealthService,
    private readonly wealthAi: WealthAiService,
  ) {}

  @Get('overview')
  overview(@CurrentUser() user: AuthUser, @Query('month') month?: string) {
    return this.wealthService.getOverview(user.sub, month);
  }

  @Post('refresh')
  refresh(@CurrentUser() user: AuthUser, @Query('month') month?: string) {
    return this.wealthService.refreshMonth(user.sub, month);
  }

  @Get('goals')
  listGoals(@CurrentUser() user: AuthUser) {
    return this.wealthService.listGoals(user.sub);
  }

  @Post('goals')
  createGoal(
    @CurrentUser() user: AuthUser,
    @Body() body: { name: string; targetAmount: number; deadline?: string; icon?: string; color?: string; allocPercent?: number },
  ) {
    return this.wealthService.createGoal(user.sub, body);
  }

  @Patch('goals/:id')
  updateGoal(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { name?: string; targetAmount?: number; deadline?: string; icon?: string; color?: string; allocPercent?: number },
  ) {
    return this.wealthService.updateGoal(user.sub, id, body);
  }

  @Delete('goals/:id')
  removeGoal(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.wealthService.removeGoal(user.sub, id);
  }

  @Get('advice')
  async advice(@CurrentUser() user: AuthUser) {
    const cached = await this.wealthAi.getCachedAdvice(user.sub);
    if (cached) return cached;
    return this.wealthAi.refreshAdvice(user.sub);
  }
}
