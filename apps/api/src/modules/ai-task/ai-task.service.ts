import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisConnection } from '../../common/redis/redis.connection';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAiTaskDto } from './dto/create-ai-task.dto';

export const AI_TASK_QUEUE_NAME = 'ai-tasks';

@Injectable()
export class AiTaskService implements OnModuleDestroy {
  private readonly logger = new Logger(AiTaskService.name);
  private readonly queue: Queue;

  constructor(
    private readonly prisma: PrismaService,
    redisConnection: RedisConnection,
  ) {
    this.queue = new Queue(AI_TASK_QUEUE_NAME, { connection: redisConnection.getClient() });
  }

  async create(userId: string, dto: CreateAiTaskDto) {
    if (!dto.inputText?.trim() && !dto.audioUrl?.trim()) {
      throw new BadRequestException('inputText or audioUrl is required');
    }

    const task = await this.prisma.aiTask.create({
      data: {
        userId,
        type: dto.type,
        inputText: dto.inputText?.trim(),
        audioUrl: dto.audioUrl?.trim(),
        intent: dto.intent,
      },
    });

    try {
      await this.queue.add(
        dto.type,
        { taskId: task.id },
        {
          attempts: 2,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: { age: 3600, count: 1000 },
          removeOnFail: { age: 24 * 3600, count: 1000 },
        },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to enqueue AI task ${task.id}: ${message}`, err instanceof Error ? err.stack : undefined);
      await this.prisma.aiTask.update({
        where: { id: task.id },
        data: {
          status: 'failed',
          errorMessage: message,
          finishedAt: new Date(),
        },
      });
      throw err;
    }

    return { taskId: task.id };
  }

  async get(userId: string, id: string) {
    const task = await this.prisma.aiTask.findFirst({
      where: { id, userId },
      select: {
        id: true,
        type: true,
        intent: true,
        status: true,
        resultJson: true,
        errorMessage: true,
        retryCount: true,
        createdAt: true,
        startedAt: true,
        finishedAt: true,
      },
    });

    if (!task) {
      throw new NotFoundException('AI task not found');
    }

    return task;
  }

  async onModuleDestroy() {
    await this.queue.close().catch((err) => {
      this.logger.error(`Failed to close AI task queue: ${err instanceof Error ? err.message : String(err)}`);
    });
  }
}
