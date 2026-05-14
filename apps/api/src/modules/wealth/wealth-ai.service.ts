import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';
import { AiChatService } from '../ai/services/ai-chat.service';
import { WealthService } from './wealth.service';

@Injectable()
export class WealthAiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiChat: AiChatService,
    private readonly wealth: WealthService,
  ) {}

  async getCachedAdvice(userId: string) {
    const month = dayjs().format('YYYY-MM');
    const snapshot = await this.prisma.wealthSnapshot.findUnique({
      where: { userId_month: { userId, month } },
    });

    if (snapshot?.adviceJson && !(await this.hasNewerTransactions(userId, snapshot.updatedAt))) {
      return snapshot.adviceJson as { summary: string; suggestions: string[]; encouragement: string };
    }

    const prevMonth = dayjs().subtract(1, 'month').format('YYYY-MM');
    const prevSnapshot = await this.prisma.wealthSnapshot.findUnique({
      where: { userId_month: { userId, month: prevMonth } },
    });

    if (prevSnapshot?.adviceJson) {
      return prevSnapshot.adviceJson as { summary: string; suggestions: string[]; encouragement: string };
    }

    return null;
  }

  async refreshAdvice(userId: string) {
    await this.wealth.refreshMonth(userId, undefined, { updateGoals: false });
    const advice = await this.generateAdvice(userId);
    const month = dayjs().format('YYYY-MM');

    await this.prisma.wealthSnapshot.upsert({
      where: { userId_month: { userId, month } },
      create: { userId, month, adviceJson: advice as any },
      update: { adviceJson: advice as any },
    });

    return advice;
  }

  async refreshAdviceAsync(userId: string) {
    setImmediate(() => {
      this.refreshAdvice(userId).catch((e) => {
        console.error('[WealthAi] Background advice refresh failed:', e.message);
      });
    });
  }

  private async hasNewerTransactions(userId: string, snapshotUpdatedAt: Date) {
    const latest = await this.prisma.transaction.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });
    return Boolean(latest?.updatedAt && latest.updatedAt > snapshotUpdatedAt);
  }

  private async generateAdvice(userId: string) {
    const overview = await this.wealth.getOverview(userId);

    const trendStr = overview.trend
      .map((t) => `${t.month}: 收入¥${t.income} 支出¥${t.expense} 结余¥${t.surplus}`)
      .join('\n');

    const goalsStr = overview.goals.length
      ? overview.goals
          .map((g: any) => `${g.icon} ${g.name}: 目标¥${g.targetAmount}, 已达成${g.percent}%, 预计${g.predictDate || '未知'}完成`)
          .join('\n')
      : '暂无目标';

    const prompt = `你是 Moona，一个温暖的 AI 财务成长顾问。请基于用户的财富数据，给出简短、温暖、实用的建议。

用户财富概况：
本月结余：¥${overview.monthSurplus}
结余率：${overview.surplusRate}%
财富评分：${overview.wealthScore}/100
评分变化：${overview.scoreChange > 0 ? '+' : ''}${overview.scoreChange}

近6个月趋势：
${trendStr}

目标进度：
${goalsStr}

请返回 JSON 格式（不要 markdown 代码块）：
{
  "summary": "一句话总结当前财富状态",
  "suggestions": ["建议1", "建议2", "建议3"],
  "encouragement": "一句鼓励的话"
}`;

    const raw = await this.aiChat.complete([
      { role: 'system', content: '你是 Moona，温暖贴心的 AI 财务成长顾问。回答简洁自然，有温度。' },
      { role: 'user', content: prompt },
    ]);

    try {
      const cleaned = (raw || '').replace(/```(?:json)?\s*\n?|\n?```\s*$/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return {
        summary: overview.statusText,
        suggestions: ['保持记账习惯，AI 会越来越了解你', '尝试设置一个小目标，让财富有方向'],
        encouragement: '每一笔记录都是财富成长的开始 ✨',
      };
    }
  }
}
