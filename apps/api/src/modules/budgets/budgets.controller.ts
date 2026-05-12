import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BudgetsService } from './budgets.service';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  upsert(
    @CurrentUser() user: AuthUser,
    @Body() body: { amount: number; categoryId?: string; period?: 'weekly' | 'monthly'; month?: string },
  ) {
    return this.budgetsService.upsert(user.sub, body);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('month') month?: string) {
    return this.budgetsService.list(user.sub, month);
  }

  @Get('overview')
  overview(@CurrentUser() user: AuthUser, @Query('month') month?: string) {
    return this.budgetsService.overview(user.sub, month);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.budgetsService.remove(user.sub, id);
  }
}
