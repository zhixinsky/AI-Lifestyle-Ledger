import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ArticleCategory } from '@prisma/client';
import { DiscoverService } from './discover.service';

@Controller('discover')
export class DiscoverController {
  constructor(private readonly discoverService: DiscoverService) {}

  @Get('articles')
  @UseGuards(AuthGuard('jwt'))
  async listArticles(
    @Query('category') category?: string,
    @Query('page') page?: string,
  ) {
    const cat = category as ArticleCategory | undefined;
    return this.discoverService.listArticles(cat, page ? parseInt(page) : 1);
  }

  @Get('articles/:id')
  @UseGuards(AuthGuard('jwt'))
  async getArticle(@Param('id') id: string) {
    return this.discoverService.getArticle(id);
  }

  @Post('seed')
  async seed() {
    return this.discoverService.seedArticles();
  }
}
