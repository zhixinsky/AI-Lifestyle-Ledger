import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ArticleCategory } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { Request } from 'express';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../decorators/current-admin.decorator';
import { AdminArticlesService } from './admin-articles.service';

class ArticleBodyDto {
  @IsString()
  title: string;

  @IsString()
  summary: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsEnum(ArticleCategory)
  category?: ArticleCategory;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number;
}

@Controller('admin/articles')
@UseGuards(AdminJwtAuthGuard)
export class AdminArticlesController {
  constructor(private readonly articles: AdminArticlesService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('category') category?: ArticleCategory,
    @Query('published') published?: string,
  ) {
    return this.articles.list({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      category,
      published: published === undefined ? undefined : published === 'true',
    });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.articles.get(id);
  }

  @Post()
  create(@CurrentAdmin() admin: { sub: string }, @Body() dto: ArticleBodyDto, @Req() req: Request) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString();
    return this.articles.create(admin.sub, dto, ip);
  }

  @Patch(':id')
  update(
    @CurrentAdmin() admin: { sub: string },
    @Param('id') id: string,
    @Body() dto: ArticleBodyDto,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString();
    return this.articles.update(admin.sub, id, dto, ip);
  }

  @Delete(':id')
  remove(@CurrentAdmin() admin: { sub: string }, @Param('id') id: string, @Req() req: Request) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString();
    return this.articles.remove(admin.sub, id, ip);
  }
}
