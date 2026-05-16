import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  AnnouncementPosition,
  AnnouncementTarget,
  AnnouncementType,
} from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import type { Request } from 'express';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../decorators/current-admin.decorator';
import { AdminAnnouncementsService } from './admin-announcements.service';

class AnnouncementDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(AnnouncementType)
  type?: AnnouncementType;

  @IsOptional()
  @IsEnum(AnnouncementPosition)
  position?: AnnouncementPosition;

  @IsOptional()
  @IsEnum(AnnouncementTarget)
  target?: AnnouncementTarget;

  @IsOptional()
  targetUserIds?: string[];

  @IsOptional()
  @IsString()
  startAt?: string;

  @IsOptional()
  @IsString()
  endAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsBoolean()
  requireRead?: boolean;
}

@Controller('admin/announcements')
@UseGuards(AdminJwtAuthGuard)
export class AdminAnnouncementsController {
  constructor(private readonly announcements: AdminAnnouncementsService) {}

  @Get()
  list(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('published') published?: string) {
    return this.announcements.list({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      published: published === undefined ? undefined : published === 'true',
    });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.announcements.get(id);
  }

  @Post()
  create(@CurrentAdmin() admin: { sub: string }, @Body() dto: AnnouncementDto, @Req() req: Request) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString();
    return this.announcements.create(admin.sub, {
      ...dto,
      startAt: dto.startAt ? new Date(dto.startAt) : undefined,
      endAt: dto.endAt ? new Date(dto.endAt) : undefined,
    }, ip);
  }

  @Patch(':id')
  update(
    @CurrentAdmin() admin: { sub: string },
    @Param('id') id: string,
    @Body() dto: AnnouncementDto,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString();
    return this.announcements.update(admin.sub, id, {
      ...dto,
      startAt: dto.startAt ? new Date(dto.startAt) : undefined,
      endAt: dto.endAt ? new Date(dto.endAt) : undefined,
    }, ip);
  }

  @Delete(':id')
  remove(@CurrentAdmin() admin: { sub: string }, @Param('id') id: string, @Req() req: Request) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString();
    return this.announcements.remove(admin.sub, id, ip);
  }
}
