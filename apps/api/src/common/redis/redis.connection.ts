import Redis from 'ioredis';

export function createRedisConnection() {
  return new Redis({
    host: process.env.UPSTASH_REDIS_HOST,
    port: Number(process.env.UPSTASH_REDIS_PORT || 6379),
    password: process.env.UPSTASH_REDIS_PASSWORD,
    tls: {},
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}
