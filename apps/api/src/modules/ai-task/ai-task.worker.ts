import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { Job, Worker } from 'bullmq';
import { createRedisConnection } from '../../common/redis/redis.connection';
import { BillParserService } from '../ai/services/bill-parser.service';
import { AiFinancialChatService } from '../ai/services/ai-financial-chat.service';
import type { ParsedBillTransaction } from '../ai/types/parsed-bill';
import { CategoriesService } from '../categories/categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { AI_TASK_QUEUE_NAME } from './ai-task.service';

interface AiTaskJobData {
  taskId: string;
}

@Injectable()
export class AiTaskWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiTaskWorker.name);
  private readonly connection = createRedisConnection();
  private worker?: Worker<AiTaskJobData>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly billParser: BillParserService,
    private readonly chatService: AiFinancialChatService,
    private readonly categories: CategoriesService,
  ) {}

  onModuleInit() {
    this.worker = new Worker<AiTaskJobData>(
      AI_TASK_QUEUE_NAME,
      (job) => this.process(job),
      {
        connection: this.connection,
        concurrency: Number(process.env.AI_QUEUE_CONCURRENCY || 3),
      },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`AI task job failed ${job?.id || 'unknown'}: ${err.message}`, err.stack);
    });
    this.worker.on('error', (err) => {
      this.logger.error(`AI task worker error: ${err.message}`, err.stack);
    });
  }

  private async process(job: Job<AiTaskJobData>) {
    const { taskId } = job.data;
    const startedAt = new Date();

    await this.prisma.aiTask.update({
      where: { id: taskId },
      data: {
        status: 'processing',
        startedAt,
        errorMessage: null,
        retryCount: job.attemptsMade,
      },
    });

    try {
      const task = await this.prisma.aiTask.findUniqueOrThrow({ where: { id: taskId } });
      const resultJson = await this.runTask(task);
      const intent = this.extractIntent(task.intent, resultJson);

      await this.prisma.aiTask.update({
        where: { id: taskId },
        data: {
          status: 'success',
          resultJson,
          intent,
          errorMessage: null,
          retryCount: job.attemptsMade,
          finishedAt: new Date(),
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isFinalAttempt = job.attemptsMade + 1 >= (job.opts.attempts || 1);

      this.logger.error(`AI task ${taskId} failed: ${message}`, err instanceof Error ? err.stack : undefined);
      await this.prisma.aiTask.update({
        where: { id: taskId },
        data: {
          status: isFinalAttempt ? 'failed' : 'pending',
          errorMessage: message,
          retryCount: job.attemptsMade + 1,
          finishedAt: isFinalAttempt ? new Date() : null,
        },
      });

      throw err;
    }
  }

  private async runTask(task: { id: string; userId: string | null; type: string; inputText: string | null }) {
    if (!task.userId) {
      throw new Error('AI task has no userId');
    }

    if (task.type === 'parse_bill') {
      const parsed = await this.billParser.parse(task.inputText || '');
      const transactions = await this.attachCategoryIds(parsed.transactions);
      const log = await this.prisma.aiLog.create({
        data: {
          userId: task.userId,
          rawInput: task.inputText || '',
          aiResponse: { transactions },
        },
      });

      return {
        logId: log.id,
        transactions,
      } as Prisma.InputJsonObject;
    }

    if (task.type === 'chat') {
      return await this.chatService.chat(task.userId, task.inputText || '', []) as Prisma.InputJsonObject;
    }

    throw new Error(`Unsupported AI task type: ${task.type}`);
  }

  private async attachCategoryIds(transactions: ParsedBillTransaction[]) {
    await this.categories.ensureDefaults();
    const categories = await this.categories.list();

    return transactions.map((item) => {
      const fallbackName = item.type === TransactionType.income ? '其它收入' : '其它';
      const category = categories.find((entry) => entry.name === item.category && entry.type === item.type)
        || categories.find((entry) => entry.name === fallbackName && entry.type === item.type)
        || categories[0];

      return {
        ...item,
        category: category.name,
        categoryId: category.id,
      };
    });
  }

  private extractIntent(fallback: string | null, resultJson: Prisma.InputJsonValue) {
    if (fallback) return fallback;
    if (typeof resultJson === 'object' && resultJson && !Array.isArray(resultJson) && 'transactions' in resultJson) {
      return 'parse_bill';
    }
    return null;
  }

  async onModuleDestroy() {
    await this.worker?.close().catch((err) => {
      this.logger.error(`Failed to close AI task worker: ${err instanceof Error ? err.message : String(err)}`);
    });
    await this.connection.quit().catch((err) => {
      this.logger.error(`Failed to close Redis connection: ${err instanceof Error ? err.message : String(err)}`);
    });
  }
}
