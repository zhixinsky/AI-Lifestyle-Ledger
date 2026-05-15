import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AiRunResult<T> {
  value?: T;
  busy?: boolean;
  timeout?: boolean;
  message?: string;
}

/** 默认 45s：DashScope / OpenAI 兼容接口常见响应 10–20s，10s 会误报超时 */
const DEFAULT_AI_TIMEOUT_MS = 45000;

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
    const timeoutMs = Number(this.config.get<string>('AI_TIMEOUT_MS') || DEFAULT_AI_TIMEOUT_MS);
    const controller = new AbortController();
    let timedOut = false;

    try {
      return await new Promise<AiRunResult<T>>((resolve) => {
        let settled = false;
        let timeoutHandle: NodeJS.Timeout | undefined;

        const settle = (result: AiRunResult<T>) => {
          if (settled) return;
          settled = true;
          if (timeoutHandle) clearTimeout(timeoutHandle);
          resolve(result);
        };

        timeoutHandle = setTimeout(() => {
          timedOut = true;
          controller.abort();
          console.warn(`[AiConcurrency] AI request timeout after ${timeoutMs}ms`);
          settle({
            timeout: true,
            message: '米粒思考得有点久，可以再试一次哦～',
          });
        }, timeoutMs);

        runner(controller.signal)
          .then((value) => {
            if (timedOut) return;
            settle({ value });
          })
          .catch((err) => {
            if (timedOut) {
              settle({
                timeout: true,
                message: '米粒思考得有点久，可以再试一次哦～',
              });
              return;
            }
            console.error('[AiConcurrency] runner error:', err);
            throw err;
          });
      });
    } catch (err) {
      if (timedOut) {
        return {
          timeout: true,
          message: '米粒思考得有点久，可以再试一次哦～',
        };
      }
      throw err;
    } finally {
      this.currentAiRequests = Math.max(0, this.currentAiRequests - 1);
    }
  }
}
