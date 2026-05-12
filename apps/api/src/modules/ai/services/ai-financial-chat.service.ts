import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import * as dayjs from 'dayjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AiChatService } from './ai-chat.service';
import { AiPromptService } from './ai-prompt.service';

interface ChatHistory {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AiFinancialChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiChat: AiChatService,
    private readonly prompts: AiPromptService,
  ) {}

  async chat(userId: string, message: string, history: ChatHistory[] = []) {
    const context = await this.buildUserContext(userId);
    const systemPrompt = this.prompts.getFinancialChatPrompt();

    const messages = [
      { role: 'system' as const, content: `${systemPrompt}\n\n用户财务概况：\n${context}` },
      ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user' as const, content: message },
    ];

    const result = await this.aiChat.complete(messages);

    if (!result) {
      return {
        reply: '抱歉，AI 暂时无法响应，请稍后再试～',
        suggestions: ['查看今日消费', '本月账单分析'],
      };
    }

    try {
      return JSON.parse(result);
    } catch {
      return { reply: result, suggestions: [] };
    }
  }

  private async buildUserContext(userId: string): Promise<string> {
    const now = dayjs();
    const monthStart = now.startOf('month').toDate();
    const monthEnd = now.endOf('month').toDate();
    const todayStart = now.startOf('day').toDate();
    const todayEnd = now.endOf('day').toDate();

    const [monthTransactions, todayTransactions, profile] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId, occurredAt: { gte: monthStart, lte: monthEnd } },
        include: { category: true },
        orderBy: { occurredAt: 'desc' },
      }),
      this.prisma.transaction.findMany({
        where: { userId, occurredAt: { gte: todayStart, lte: todayEnd } },
        include: { category: true },
      }),
      this.prisma.userProfile.findUnique({ where: { userId } }),
    ]);

    const monthExpense = monthTransactions
      .filter((t) => t.type === TransactionType.expense)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const monthIncome = monthTransactions
      .filter((t) => t.type === TransactionType.income)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const todayExpense = todayTransactions
      .filter((t) => t.type === TransactionType.expense)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const categoryMap = new Map<string, number>();
    monthTransactions
      .filter((t) => t.type === TransactionType.expense)
      .forEach((t) => {
        categoryMap.set(t.category.name, (categoryMap.get(t.category.name) || 0) + Number(t.amount));
      });
    const topCategories = [...categoryMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => `${name}: ¥${amount}`)
      .join('、');

    const recentBills = monthTransactions.slice(0, 10).map((t) => {
      const time = dayjs(t.occurredAt).format('MM-DD');
      const label = t.type === 'expense' ? '支出' : '收入';
      return `${time} ${label} ${t.category.name} ¥${Number(t.amount)} ${t.remark || ''}`;
    }).join('\n');

    const surplus = monthIncome - monthExpense;
    const surplusRate = monthIncome > 0 ? Math.round((surplus / monthIncome) * 100) : 0;

    const wealthSnapshot = await this.prisma.wealthSnapshot.findUnique({
      where: { userId_month: { userId, month: now.format('YYYY-MM') } },
    }).catch(() => null);

    const goals = await this.prisma.savingGoal.findMany({
      where: { userId, completed: false },
      take: 3,
    });

    const goalStr = goals.length
      ? goals.map((g) => `${g.name}: 目标¥${Number(g.targetAmount)}, 已达¥${Number(g.currentAmount)}`).join('、')
      : '';

    const lines = [
      `当前日期：${now.format('YYYY-MM-DD')}`,
      `今日支出：¥${todayExpense}`,
      `本月支出：¥${monthExpense}`,
      `本月收入：¥${monthIncome}`,
      `本月结余：¥${surplus}（结余率${surplusRate}%）`,
      `本月记账 ${monthTransactions.length} 笔`,
      wealthSnapshot ? `财富评分：${wealthSnapshot.wealthScore}/100` : '',
      topCategories ? `消费前 5 类：${topCategories}` : '',
      goalStr ? `进行中的目标：${goalStr}` : '',
      profile?.persona ? `消费人格：${profile.persona}` : '',
      recentBills ? `\n近期账单：\n${recentBills}` : '',
    ];

    return lines.filter(Boolean).join('\n');
  }

  private greetingCache = new Map<string, { text: string; slot: string }>();

  private getTimeSlotKey(): string {
    const h = dayjs().hour();
    const day = dayjs().format('YYYY-MM-DD');
    const slot = h < 11 ? 'morning' : h < 14 ? 'noon' : h < 18 ? 'afternoon' : 'evening';
    return `${day}-${slot}`;
  }

  async getGreeting(userId: string): Promise<{ greeting: string }> {
    const slotKey = this.getTimeSlotKey();
    const cached = this.greetingCache.get(userId);
    if (cached && cached.slot === slotKey) {
      return { greeting: cached.text };
    }

    const now = dayjs();
    const monthStart = now.startOf('month').toDate();
    const monthEnd = now.endOf('month').toDate();
    const yesterdayStart = now.subtract(1, 'day').startOf('day').toDate();
    const yesterdayEnd = now.subtract(1, 'day').endOf('day').toDate();

    const [recentTx, yesterdayTx, user] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId, occurredAt: { gte: monthStart, lte: monthEnd } },
        include: { category: true },
        orderBy: { occurredAt: 'desc' },
        take: 20,
      }),
      this.prisma.transaction.findMany({
        where: { userId, occurredAt: { gte: yesterdayStart, lte: yesterdayEnd } },
        include: { category: true },
      }),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ]);

    const categories = recentTx.map((t) => t.category.name);
    const uniqueCats = [...new Set(categories)].join('、');
    const yesterdayTotal = yesterdayTx
      .filter((t) => t.type === TransactionType.expense)
      .reduce((s, t) => s + Number(t.amount), 0);
    const streakDays = user?.streakDays || 0;
    const hour = now.hour();
    const timeSlot = hour < 11 ? '早上' : hour < 14 ? '中午' : hour < 18 ? '下午' : '晚上';

    const prompt = `你是 Moona，用户的 AI 记账助手。请生成一句简短、温暖的个性化问候语（15字以内），替代"今天过得怎么样？"。

时间段：${timeSlot}
用户连续记账：${streakDays}天
昨日消费：¥${yesterdayTotal}
近期消费分类：${uniqueCats || '暂无'}
${categories.includes('医疗') ? '用户近期有医疗支出，请表达关心' : ''}
${categories.includes('旅行') || categories.includes('交通') ? '用户近期有出行' : ''}
${streakDays >= 7 ? '用户坚持记账超过一周，可以鼓励' : ''}
${yesterdayTotal > 500 ? '昨日消费较高' : ''}
${recentTx.length === 0 ? '用户还没开始记账' : ''}

要求：
- 只输出问候语本身，不要引号、前缀
- 语气亲切自然，像朋友聊天
- 可以结合消费场景给出关心或小建议
- 不要重复"今天过得怎么样"`;

    try {
      const result = await this.aiChat.complete([
        { role: 'system', content: '你是 Moona，一个温暖贴心的 AI 记账助手，请用简短自然的语气。' },
        { role: 'user', content: prompt },
      ]);
      const text = (result || '').replace(/["""]/g, '').trim() || '今天也要好好生活哦~';
      this.greetingCache.set(userId, { text, slot: slotKey });
      return { greeting: text };
    } catch {
      return { greeting: '今天也要好好生活哦~' };
    }
  }

  async getBudgetAdvice(userId: string, budgetOverview: any) {
    const context = await this.buildUserContext(userId);

    const budgetInfo = [
      `总预算：¥${budgetOverview.totalBudget}`,
      `已花费：¥${budgetOverview.totalSpent}`,
      `剩余：¥${budgetOverview.totalRemaining}`,
      `使用进度：${budgetOverview.totalPercent}%`,
      budgetOverview.isOverspent ? '⚠️ 已超支！' : '',
    ].filter(Boolean).join('\n');

    const categoryInfo = budgetOverview.categoryBudgets?.length
      ? budgetOverview.categoryBudgets
          .map((b: any) => `${b.category?.name || '总预算'}: 预算¥${b.amount}, 已花¥${b.spent}, ${b.isOverspent ? '已超支' : `剩余¥${b.remaining}`}`)
          .join('\n')
      : '暂无分类预算';

    const prompt = `你是一个温暖的 AI 财务顾问。请基于用户的预算和消费数据，给出简短、实用的建议。

用户财务概况：
${context}

预算情况：
${budgetInfo}

分类预算明细：
${categoryInfo}

请给出：
1. 一句话总结当前预算状态
2. 2-3 条具体可执行的省钱建议
3. 一句鼓励的话

用简洁自然的语气，不要列太多数字。`;

    const reply = await this.aiChat.complete([
      { role: 'system', content: '你是 Moona，一个温暖贴心的 AI 财务助手。' },
      { role: 'user', content: prompt },
    ]);

    return { advice: reply };
  }
}
