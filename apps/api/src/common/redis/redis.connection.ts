import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisConnection implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisConnection.name);
  private readonly connection: Redis;
  private readonly host: string;
  private readonly port: number;

  constructor() {
    const host = process.env.REDIS_HOST?.trim();
    if (!host) {
      throw new Error('REDIS_HOST is required for AI task queue Redis connection');
    }

    const port = Number(process.env.REDIS_PORT || 6379);
    if (!Number.isFinite(port)) {
      throw new Error('REDIS_PORT must be a valid number');
    }

    this.host = host;
    this.port = port;
    this.connection = new Redis({
      host,
      port,
      password: process.env.REDIS_PASSWORD,
      tls: {},
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  getClient() {
    return this.connection;
  }

  async onModuleInit() {
    await this.connection.ping();
    this.logger.log(`Redis target ${this.host}:${this.port}`);
    console.log('Redis connected successfully');
  }

  async onModuleDestroy() {
    await this.connection.quit().catch((err) => {
      this.logger.error(`Failed to close Redis connection: ${err instanceof Error ? err.message : String(err)}`);
    });
  }
}
