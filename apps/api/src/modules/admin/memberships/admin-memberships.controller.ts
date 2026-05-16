import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { MemberLevel, OrderStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { Request } from 'express';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../decorators/current-admin.decorator';
import { AdminMembershipsService } from './admin-memberships.service';

class UpdateMembershipDto {
  @IsOptional()
  @IsEnum(MemberLevel)
  level?: MemberLevel;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  extendDays?: number;
}

@Controller('admin')
@UseGuards(AdminJwtAuthGuard)
export class AdminMembershipsController {
  constructor(private readonly memberships: AdminMembershipsService) {}

  @Get('memberships')
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('level') level?: MemberLevel,
  ) {
    return this.memberships.listMemberships({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      level,
    });
  }

  @Patch('memberships/:userId')
  update(
    @CurrentAdmin() admin: { sub: string },
    @Param('userId') userId: string,
    @Body() dto: UpdateMembershipDto,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString();
    return this.memberships.updateMembership(admin.sub, userId, dto, ip);
  }

  @Get('orders')
  orders(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: OrderStatus,
  ) {
    return this.memberships.listOrders({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      status,
    });
  }
}
