import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AiCorrectionType, PromptExampleScene } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';
import { AdminAiService } from './admin-ai.service';

@Controller('admin/ai')
@UseGuards(AdminJwtAuthGuard)
export class AdminAiController {
  constructor(private readonly ai: AdminAiService) {}

  @Get('logs')
  listLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('intent') intent?: string,
  ) {
    return this.ai.listLogs({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      userId,
      status,
      intent,
    });
  }

  @Get('logs/:id')
  getLog(@Param('id') id: string) {
    return this.ai.getLog(id);
  }

  @Get('corrections')
  listCorrections(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('correctionType') correctionType?: AiCorrectionType,
  ) {
    return this.ai.listCorrections({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      correctionType,
    });
  }

  @Get('corrections/stats')
  correctionStats() {
    return this.ai.correctionStats();
  }

  @Get('corrections/export')
  exportCorrections(@Query('format') format: 'jsonl' | 'csv' = 'jsonl') {
    return this.ai.exportCorrections(format);
  }

  @Get('corrections/:id')
  getCorrection(@Param('id') id: string) {
    return this.ai.getCorrection(id);
  }

  @Post('corrections/:id/add-to-examples')
  addToExamples(@Param('id') id: string) {
    return this.ai.addCorrectionToExamples(id);
  }

  @Get('prompt-examples')
  listExamples(@Query('scene') scene?: PromptExampleScene) {
    return this.ai.listPromptExamples(scene);
  }

  @Post('prompt-examples')
  createExample(
    @Body()
    dto: {
      scene: PromptExampleScene;
      inputText: string;
      expectedJson: object;
      enabled?: boolean;
      sort?: number;
    },
  ) {
    return this.ai.createPromptExample(dto);
  }

  @Patch('prompt-examples/:id')
  updateExample(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return this.ai.updatePromptExample(id, dto);
  }

  @Delete('prompt-examples/:id')
  deleteExample(@Param('id') id: string) {
    return this.ai.deletePromptExample(id);
  }
}
