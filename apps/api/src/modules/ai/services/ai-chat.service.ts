import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

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

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.1,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AiChat] HTTP ${response.status}: ${errorText}`);
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
      console.error('[AiChat] Fetch error:', err);
      return null;
    }
  }
}
