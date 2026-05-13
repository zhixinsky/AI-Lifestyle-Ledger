import { Injectable } from '@nestjs/common';
import { UserMemoryType } from '@prisma/client';
import * as dayjs from 'dayjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AiChatService } from './ai-chat.service';

interface MemoryCandidate {
  type: UserMemoryType;
  key: string;
  value: string;
  confidence?: number;
  ttlDays?: number;
  pinned?: boolean;
}

@Injectable()
export class UserMemoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiChat: AiChatService,
  ) {}

  async extractFromChat(userId: string, userMessage: string, assistantReply: string) {
    const content = `${userMessage}\n${assistantReply}`.trim();
    if (!content || content.length < 4) return [];

    const result = await this.aiChat.complete([
      {
        role: 'system',
        content: [
          '你是用户财务记忆提取器，只从对话中提取未来可用于财务建议的稳定或近期关键信息。',
          '不要保存闲聊、一次性情绪、隐私敏感细节、身份证号、银行卡号、密码、完整地址。',
          '短期状态如“这个月好穷”“最近预算紧”应设置 ttlDays 到本月底或 30 天内。',
          '长期偏好/目标如“想少点外卖”“想存旅游基金”可以 pinned=true。',
          '只返回严格 JSON：{"memories":[{"type":"finance_state|preference|goal|warning|profile","key":"英文短键","value":"中文摘要","confidence":0.8,"ttlDays":30,"pinned":false}]}',
          '最多 3 条，没有则返回 {"memories":[]}',
        ].join('\n'),
      },
      {
        role: 'user',
        content: `用户对话：\n${content}`,
      },
    ]);

    const candidates = this.parseCandidates(result);
    const saved = [];
    for (const candidate of candidates) {
      const row = await this.upsertMemory(userId, candidate);
      if (row) saved.push(row);
    }
    return saved;
  }

  async getMemoryContext(userId: string, limit = 8) {
    const now = new Date();
    const memories = await this.prisma.userMemory.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: [{ pinned: 'desc' }, { lastSeenAt: 'desc' }],
      take: limit,
    });

    if (!memories.length) return '';

    return memories
      .map((m) => {
        const label = this.typeLabel(m.type);
        const expiry = m.expiresAt ? `（有效到${dayjs(m.expiresAt).format('MM-DD')}）` : '';
        return `- ${label}：${m.value}${expiry}`;
      })
      .join('\n');
  }

  private parseCandidates(raw: string | null): MemoryCandidate[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as { memories?: MemoryCandidate[] };
      const items = Array.isArray(parsed.memories) ? parsed.memories : [];
      return items
        .filter((item) => this.isValidType(item.type) && item.key && item.value)
        .slice(0, 3)
        .map((item) => ({
          type: item.type,
          key: item.key.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80),
          value: item.value.trim().slice(0, 300),
          confidence: Math.max(0.1, Math.min(Number(item.confidence || 0.7), 1)),
          ttlDays: item.ttlDays,
          pinned: !!item.pinned,
        }));
    } catch {
      return this.heuristicCandidates(raw);
    }
  }

  private heuristicCandidates(text: string): MemoryCandidate[] {
    const lowered = text.toLowerCase();
    const items: MemoryCandidate[] = [];
    if (text.includes('穷') || text.includes('没钱') || text.includes('预算紧') || text.includes('省钱')) {
      items.push({
        type: UserMemoryType.finance_state,
        key: 'budget_pressure',
        value: '用户表达近期资金紧张，希望获得省钱提醒',
        confidence: 0.65,
        ttlDays: 30,
      });
    }
    if (text.includes('少点外卖') || text.includes('控制外卖') || lowered.includes('takeout')) {
      items.push({
        type: UserMemoryType.goal,
        key: 'reduce_takeout',
        value: '用户想减少外卖支出',
        confidence: 0.75,
        pinned: true,
      });
    }
    return items.slice(0, 3);
  }

  private async upsertMemory(userId: string, memory: MemoryCandidate) {
    if (!memory.key || !memory.value) return null;
    const expiresAt = memory.pinned
      ? null
      : memory.ttlDays
        ? dayjs().add(Math.max(1, Math.min(memory.ttlDays, 180)), 'day').toDate()
        : dayjs().endOf('month').toDate();

    return this.prisma.userMemory.upsert({
      where: { userId_key: { userId, key: memory.key } },
      create: {
        userId,
        type: memory.type,
        key: memory.key,
        value: memory.value,
        confidence: memory.confidence || 0.7,
        source: 'chat',
        pinned: !!memory.pinned,
        expiresAt,
        lastSeenAt: new Date(),
      },
      update: {
        type: memory.type,
        value: memory.value,
        confidence: memory.confidence || 0.7,
        pinned: !!memory.pinned,
        expiresAt,
        lastSeenAt: new Date(),
      },
    });
  }

  private isValidType(type: unknown): type is UserMemoryType {
    return typeof type === 'string' && Object.values(UserMemoryType).includes(type as UserMemoryType);
  }

  private typeLabel(type: UserMemoryType) {
    const labels: Record<UserMemoryType, string> = {
      [UserMemoryType.finance_state]: '财务状态',
      [UserMemoryType.preference]: '偏好',
      [UserMemoryType.goal]: '目标',
      [UserMemoryType.warning]: '风险提醒',
      [UserMemoryType.profile]: '用户画像',
    };
    return labels[type] || '记忆';
  }
}
