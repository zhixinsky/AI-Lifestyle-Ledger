import { BadRequestException } from '@nestjs/common';

export function parseAiJson<T>(content: string): T {
  const trimmed = content.trim();
  const jsonText = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
    : trimmed;

  try {
    return JSON.parse(jsonText) as T;
  } catch {
    const match = jsonText.match(/\{[\s\S]*\}/);
    if (!match) throw new BadRequestException('AI 返回不是合法 JSON');
    return JSON.parse(match[0]) as T;
  }
}
