import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async list() {
    await this.categoriesService.ensureDefaults();
    return this.categoriesService.list();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: { name: string; icon: string; color: string; type: 'expense' | 'income' }) {
    return this.categoriesService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sort')
  updateSort(@Body() body: { items: { id: string; sort: number }[] }) {
    return this.categoriesService.updateSort(body.items);
  }
}
