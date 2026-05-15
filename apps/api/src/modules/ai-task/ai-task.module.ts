import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { CategoriesModule } from '../categories/categories.module';
import { AiTaskController } from './ai-task.controller';
import { AiTaskService } from './ai-task.service';
import { AiTaskWorker } from './ai-task.worker';

@Module({
  imports: [AiModule, CategoriesModule],
  controllers: [AiTaskController],
  providers: [AiTaskService, AiTaskWorker],
})
export class AiTaskModule {}
