import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisConnection implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisConnection.name);
  private readonly connection = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD,
    tls: {},
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  getClient() {
    return this.connection;
  }

  async onModuleInit() {
    await this.connection.ping();
    console.log('Redis connected successfully');
  }

  async onModuleDestroy() {
    await this.connection.quit().catch((err) => {
      this.logger.error(`Failed to close Redis connection: ${err instanceof Error ? err.message : String(err)}`);
    });
  }
}
