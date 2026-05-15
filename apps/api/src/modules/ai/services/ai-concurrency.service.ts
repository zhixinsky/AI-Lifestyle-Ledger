import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AiRunResult<T> {
  value?: T;
  busy?: boolean;
  timeout?: boolean;
  message?: string;
}

@Injectable()
export class AiConcurrencyService {
  private currentAiRequests = 0;

  constructor(private readonly config: ConfigService) {}

  async run<T>(runner: (signal: AbortSignal) => Promise<T>): Promise<AiRunResult<T>> {
    const maxConcurrency = Number(this.config.get<string>('AI_SYNC_MAX_CONCURRENCY') || 5);
    if (this.currentAiRequests >= maxConcurrency) {
      return {
        busy: true,
        message: '米粒现在有点忙，稍等一下再试试～',
      };
    }

    this.currentAiRequests += 1;
    const timeoutMs = Number(this.config.get<string>('AI_TIMEOUT_MS') || 10000);
    const controller = new AbortController();
    let timedOut = false;

    let timeoutHandle: NodeJS.Timeout | undefined;
    const timeout = new Promise<AiRunResult<T>>((resolve) => {
      timeoutHandle = setTimeout(() => {
        timedOut = true;
        controller.abort();
        resolve({
          timeout: true,
          message: '米粒思考得有点久，可以再试一次哦～',
        });
      }, timeoutMs);
    });

    try {
      return await Promise.race([
        runner(controller.signal).then((value) => ({ value })),
        timeout,
      ]);
    } catch (err) {
      if (timedOut) {
        return {
          timeout: true,
          message: '米粒思考得有点久，可以再试一次哦～',
        };
      }
      throw err;
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      this.currentAiRequests = Math.max(0, this.currentAiRequests - 1);
    }
  }
}
