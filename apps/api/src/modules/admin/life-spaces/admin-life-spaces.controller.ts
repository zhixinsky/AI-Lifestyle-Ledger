import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { BookType } from '@prisma/client';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';
import { AdminLifeSpacesService } from './admin-life-spaces.service';

@Controller('admin')
@UseGuards(AdminJwtAuthGuard)
export class AdminLifeSpacesController {
  constructor(private readonly lifeSpaces: AdminLifeSpacesService) {}

  @Get('life-space-templates')
  listTemplates() {
    return this.lifeSpaces.listTemplates();
  }

  @Post('life-space-templates')
  create(@Body() dto: Record<string, unknown>) {
    return this.lifeSpaces.createTemplate(dto as never);
  }

  @Patch('life-space-templates/:id')
  update(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return this.lifeSpaces.updateTemplate(id, dto);
  }

  @Get('life-spaces/stats')
  stats() {
    return this.lifeSpaces.stats();
  }
}
