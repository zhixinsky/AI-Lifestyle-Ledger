import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const RETRYABLE_HTTP_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const RETRYABLE_ERROR_CODES = new Set(['EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'UND_ERR_CONNECT_TIMEOUT']);

@Injectable()
export class AiChatService {
  constructor(private readonly config: ConfigService) {}

  async complete(messages: ChatMessage[]) {
    const apiKey = this.config.get<string>('XIAOMI_MIMO_API_KEY')
      || this.config.get<string>('MIMO_API_KEY')
      || this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) return null;

    const baseUrl = this.config.get<string>('XIAOMI_MIMO_BASE_URL')
      || this.config.get<string>('MIMO_BASE_URL')
      || this.config.get<string>('OPENAI_BASE_URL')
      || 'https://api.openai.com/v1';
    const model = this.config.get<string>('XIAOMI_MIMO_MODEL')
      || this.config.get<string>('MIMO_MODEL')
      || this.config.get<string>('OPENAI_MODEL')
      || 'gpt-4o-mini';
    const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
    console.log(`[AiChat] Calling ${url} with model=${model}`);

    const payload = {
      model,
      messages,
      temperature: 0.1,
    };
    const maxAttempts = Number(this.config.get<string>('AI_CHAT_FETCH_ATTEMPTS') || 3);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[AiChat] HTTP ${response.status}: ${errorText}`);
          if (attempt < maxAttempts && RETRYABLE_HTTP_STATUS.has(response.status)) {
            await this.sleep(this.retryDelay(attempt));
            continue;
          }
          return null;
        }

        const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
        let content = data.choices?.[0]?.message?.content || null;
        if (content) {
          content = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
        }
        console.log(`[AiChat] Response length: ${content?.length || 0}`);
        return content;
      } catch (err) {
        console.error(`[AiChat] Fetch error attempt ${attempt}/${maxAttempts}:`, err);
        if (attempt >= maxAttempts || !this.isRetryableFetchError(err)) {
          return null;
        }
        await this.sleep(this.retryDelay(attempt));
      }
    }

    return null;
  }

  private isRetryableFetchError(err: unknown) {
    const code = this.extractErrorCode(err);
    return !code || RETRYABLE_ERROR_CODES.has(code);
  }

  private extractErrorCode(err: unknown): string | undefined {
    if (!err || typeof err !== 'object') return undefined;
    const maybeError = err as { code?: string; cause?: { code?: string } };
    return maybeError.code || maybeError.cause?.code;
  }

  private retryDelay(attempt: number) {
    return Math.min(500 * 2 ** (attempt - 1), 2000);
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
