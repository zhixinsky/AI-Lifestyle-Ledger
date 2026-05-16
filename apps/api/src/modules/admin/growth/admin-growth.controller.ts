import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ChallengeType } from '@prisma/client';
import { IsEnum, IsInt, IsObject, IsOptional, IsString } from 'class-validator';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';
import { AdminGrowthService } from './admin-growth.service';

@Controller('admin/growth')
@UseGuards(AdminJwtAuthGuard)
export class AdminGrowthController {
  constructor(private readonly growth: AdminGrowthService) {}

  @Get('badges')
  listBadges() {
    return this.growth.listBadges();
  }

  @Post('badges')
  createBadge(@Body() dto: { key: string; name: string; icon: string; description: string; condition: object }) {
    return this.growth.createBadge(dto);
  }

  @Patch('badges/:id')
  updateBadge(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return this.growth.updateBadge(id, dto);
  }

  @Get('challenges')
  listChallenges() {
    return this.growth.listChallenges();
  }

  @Post('challenges')
  createChallenge(
    @Body()
    dto: {
      name: string;
      description: string;
      type: ChallengeType;
      targetValue: number;
      duration?: number;
      icon?: string;
    },
  ) {
    return this.growth.createChallenge(dto);
  }

  @Patch('challenges/:id')
  updateChallenge(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return this.growth.updateChallenge(id, dto);
  }
}
