import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StatisticsService } from './statistics.service';

@UseGuards(JwtAuthGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.statisticsService.dashboard(user.sub);
  }

  @Get()
  monthly(
    @CurrentUser() user: AuthUser,
    @Query('month') month?: string,
    @Query('period') period?: 'week' | 'month' | 'year',
    @Query('type') type?: 'expense' | 'income',
  ) {
    return this.statisticsService.monthly(user.sub, month, period, type);
  }
}
