import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiTaskService } from './ai-task.service';
import { CreateAiTaskDto } from './dto/create-ai-task.dto';

@UseGuards(JwtAuthGuard)
@Controller('ai/tasks')
export class AiTaskController {
  constructor(private readonly aiTasks: AiTaskService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAiTaskDto) {
    return this.aiTasks.create(user.sub, dto);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.aiTasks.get(user.sub, id);
  }
}
