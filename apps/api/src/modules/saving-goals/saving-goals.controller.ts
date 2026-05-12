import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SavingGoalsService } from './saving-goals.service';

@Controller('saving-goals')
@UseGuards(JwtAuthGuard)
export class SavingGoalsController {
  constructor(private readonly savingGoalsService: SavingGoalsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: { name: string; targetAmount: number; deadline?: string; icon?: string; color?: string },
  ) {
    return this.savingGoalsService.create(user.sub, body);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.savingGoalsService.list(user.sub);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { name?: string; targetAmount?: number; currentAmount?: number; deadline?: string; icon?: string; color?: string },
  ) {
    return this.savingGoalsService.update(user.sub, id, body);
  }

  @Post(':id/deposit')
  deposit(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { amount: number },
  ) {
    return this.savingGoalsService.deposit(user.sub, id, body.amount);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.savingGoalsService.remove(user.sub, id);
  }
}
