import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UserStatus } from '@prisma/client';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../decorators/current-admin.decorator';
import { AdminUsersService } from './admin-users.service';
import { AdminUserInsightService } from './admin-user-insight.service';
import type { Request } from 'express';

class ListUsersQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;
}

class PaginationQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}

@Controller('admin/users')
@UseGuards(AdminJwtAuthGuard)
export class AdminUsersController {
  constructor(
    private readonly users: AdminUsersService,
    private readonly insight: AdminUserInsightService,
  ) {}

  @Get()
  list(@Query() query: ListUsersQuery) {
    return this.users.list(query);
  }

  @Get(':id/insight')
  getInsight(@Param('id') id: string) {
    return this.insight.getInsight(id);
  }

  @Get(':id/ai-timeline')
  aiTimeline(@Param('id') id: string, @Query() query: PaginationQuery) {
    return this.insight.getAiTimeline(id, query.page, query.pageSize);
  }

  @Get(':id/corrections')
  corrections(@Param('id') id: string, @Query() query: PaginationQuery) {
    return this.insight.getCorrections(id, query.page, query.pageSize);
  }

  @Get(':id/behavior-graph')
  behaviorGraph(@Param('id') id: string) {
    return this.insight.getBehaviorGraph(id);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.users.detail(id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentAdmin() admin: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString();
    return this.users.updateStatus(admin.sub, id, dto.status, ip);
  }
}
