import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisConnection implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisConnection.name);
  private readonly connection: Redis;
  private readonly host: string;
  private readonly port: number;

  constructor() {
    const host = (process.env.UPSTASH_REDIS_HOST || process.env.REDIS_HOST)?.trim();
    if (!host) {
      throw new Error('UPSTASH_REDIS_HOST or REDIS_HOST is required for AI task queue Redis connection');
    }

    const port = Number(process.env.UPSTASH_REDIS_PORT || process.env.REDIS_PORT || 6379);
    if (!Number.isFinite(port)) {
      throw new Error('UPSTASH_REDIS_PORT or REDIS_PORT must be a valid number');
    }

    this.host = host;
    this.port = port;
    this.connection = new Redis({
      host,
      port,
      password: process.env.UPSTASH_REDIS_PASSWORD || process.env.REDIS_PASSWORD,
      tls: {},
      family: 4,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => Math.min(times * 1000, 30000),
    });

    this.connection.on('error', (err) => {
      this.logger.warn(`Redis connection error: ${err.message}`);
    });
    this.connection.on('reconnecting', () => {
      this.logger.warn(`Redis reconnecting to ${this.host}:${this.port}`);
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
