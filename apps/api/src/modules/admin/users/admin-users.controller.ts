import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UserStatus } from '@prisma/client';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../decorators/current-admin.decorator';
import { AdminUsersService } from './admin-users.service';
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

@Controller('admin/users')
@UseGuards(AdminJwtAuthGuard)
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  list(@Query() query: ListUsersQuery) {
    return this.users.list(query);
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
