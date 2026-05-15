import { Module } from '@nestjs/common';
import { RedisModule } from '../../common/redis/redis.module';
import { AiModule } from '../ai/ai.module';
import { CategoriesModule } from '../categories/categories.module';
import { AiTaskController } from './ai-task.controller';
import { AiTaskService } from './ai-task.service';
import { AiTaskWorker } from './ai-task.worker';

@Module({
  imports: [RedisModule, AiModule, CategoriesModule],
  controllers: [AiTaskController],
  providers: [AiTaskService, AiTaskWorker],
})
export class AiTaskModule {}
