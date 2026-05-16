import { Injectable, NotFoundException } from '@nestjs/common';
import { BookType, Prisma, TransactionType } from '@prisma/client';
import dayjs from 'dayjs';
import { PrismaService } from '../../prisma/prisma.service';

const SPACE_LABELS: Record<string, string> = {
  daily: '日常生活',
  love: '恋爱时刻',
  couple: '恋爱时刻',
  family: '家庭点滴',
  work: '职场日常',
  travel: '旅行记忆',
  campus: '校园时光',
};

const TEMPLATE_TYPES: BookType[] = ['daily', 'love', 'family', 'work', 'travel', 'campus'];

function num(v: unknown): number {
  if (v == null) return 0;
  return Number(v);
}

function pickLifeSpaceIdFromJson(json: unknown): string | null {
  if (!json || typeof json !== 'object') return null;
  const id = (json as { lifeSpaceId?: string }).lifeSpaceId;
  return id || null;
}

@Injectable()
export class AdminUserInsightService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { membership: true },
    });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  async getInsight(userId: string) {
    const user = await this.ensureUser(userId);
    const since30 = dayjs().subtract(29, 'day').startOf('day').toDate();
    const monthStart = dayjs().startOf('month').toDate();

    const [
      aiLogsAll,
      aiLogs30,
      transactions,
      transactions30,
      lifeSpaces,
      templates,
      corrections,
      categoryGroups,
    ] = await Promise.all([
      this.prisma.aiLog.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.aiLog.findMany({ where: { userId, createdAt: { gte: since30 } } }),
      this.prisma.transaction.findMany({
        where: { userId },
        include: { category: true, lifeSpace: true },
      }),
      this.prisma.transaction.findMany({
        where: { userId, occurredAt: { gte: since30 } },
        include: { category: true, lifeSpace: true },
      }),
      this.prisma.lifeSpace.findMany({ where: { userId }, orderBy: { sort: 'asc' } }),
      this.prisma.lifeSpaceTemplate.findMany({ where: { enabled: true }, orderBy: { sort: 'asc' } }),
      this.prisma.aiCorrection.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { userId, type: TransactionType.expense },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const sortedCategoryGroups = [...categoryGroups]
      .sort((a, b) => num(b._sum.amount) - num(a._sum.amount))
      .slice(0, 5);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: sortedCategoryGroups.map((g) => g.categoryId) } },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const aiStats = this.buildAiStats(aiLogsAll, aiLogs30);
    const billStats = this.buildBillStats(transactions, transactions30, monthStart, aiLogsAll);
    const { lifeSpaceCards, spaceDistribution } = this.buildLifeSpaces(
      userId,
      lifeSpaces,
      templates,
      transactions,
      aiLogsAll,
    );
    const tags = this.buildTags(user, aiStats, billStats, lifeSpaceCards);
    const summary = this.buildSummary(tags, aiStats, billStats);
    const behaviorGraph = this.buildBehaviorGraph(user, aiLogs30, transactions30, lifeSpaceCards);

    const timelinePage = await this.getAiTimeline(userId, 1, 20);

    return {
      profile: {
        id: user.id,
        nickname: user.nickname,
        phone: user.phone,
        email: user.email,
        openid: user.openid,
        avatarUrl: user.avatarUrl,
        status: user.status,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        memberLevel: user.membership?.level ?? 'free',
        memberExpireAt: user.membership?.expireAt ?? null,
      },
      tags,
      summary,
      aiStats,
      aiTrend: this.buildDailyTrend(aiLogs30, since30, 'ai'),
      intentDistribution: this.buildIntentDistribution(aiLogs30),
      inputTypeDistribution: this.buildInputTypeDistribution(aiLogs30),
      billStats,
      billTrend: this.buildBillTrend(transactions30, since30),
      categoryTop: sortedCategoryGroups.map((g) => ({
        categoryId: g.categoryId,
        name: categoryMap.get(g.categoryId) ?? '其它',
        amount: num(g._sum.amount),
        count: g._count,
      })),
      incomeExpenseRatio: this.buildIncomeExpenseRatio(transactions30),
      lifeSpaces: lifeSpaceCards,
      spaceDistribution,
      recentAiTimeline: timelinePage.items,
      correctionSummary: {
        total: await this.prisma.aiCorrection.count({ where: { userId } }),
        recent: corrections,
      },
      behaviorGraph,
    };
  }

  async getAiTimeline(userId: string, page = 1, pageSize = 20) {
    await this.ensureUser(userId);
    const take = Math.min(50, Math.max(1, pageSize));
    const skip = (Math.max(1, page) - 1) * take;

    const [rows, total] = await Promise.all([
      this.prisma.aiLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.aiLog.count({ where: { userId } }),
    ]);

    const items = rows.map((log) => {
      const resp = log.aiResponse as Record<string, unknown> | null;
      const txs = (resp?.transactions as Array<Record<string, unknown>>) || [];
      const firstTx = txs[0];
      const billCreated = log.confirmed && txs.length > 0;
      let replySummary = '';
      if (log.status === 'failed') replySummary = log.errorMessage || '调用失败';
      else if (log.intent === 'not_bill') replySummary = '非账单输入';
      else if (billCreated) replySummary = `已识别 ${txs.length} 笔账单`;
      else if (txs.length) replySummary = `识别 ${txs.length} 笔，待确认`;
      else replySummary = String(resp?.message || log.intent || '—');

      return {
        id: log.id,
        createdAt: log.createdAt,
        inputType: log.inputType ?? 'text',
        rawInput: log.rawInput,
        intent: log.intent,
        status: log.status ?? 'success',
        replySummary,
        billCreated,
        billAmount: firstTx ? num(firstTx.amount) : null,
        billCategory: firstTx ? String(firstTx.category || '') : null,
        durationMs: log.durationMs,
        userModified: log.userModified,
      };
    });

    return { items, total, page, pageSize: take };
  }

  async getCorrections(userId: string, page = 1, pageSize = 20) {
    await this.ensureUser(userId);
    const take = Math.min(50, Math.max(1, pageSize));
    const skip = (Math.max(1, page) - 1) * take;
    const [items, total] = await Promise.all([
      this.prisma.aiCorrection.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.aiCorrection.count({ where: { userId } }),
    ]);
    return { items, total, page, pageSize: take };
  }

  async getBehaviorGraph(userId: string) {
    const insight = await this.getInsight(userId);
    return insight.behaviorGraph;
  }

  private buildAiStats(all: Array<Prisma.AiLogGetPayload<object>>, recent: typeof all) {
    const success = all.filter((l) => l.status === 'success' || !l.status).length;
    const failed = all.filter((l) => l.status === 'failed').length;
    const timeout = all.filter((l) => l.status === 'timeout').length;
    const durations = all.filter((l) => l.durationMs != null).map((l) => l.durationMs!);
    const voice = all.filter((l) => l.inputType === 'voice').length;
    const text = all.filter((l) => l.inputType === 'text' || !l.inputType).length;
    const billIntents = new Set(['expense', 'income', 'transfer', 'bill', 'not_bill']);
    const billParse = all.filter((l) => billIntents.has(l.intent || '')).length;
    const chat = all.filter((l) => (l.intent || '').includes('chat')).length;
    const analysis = all.filter((l) => ['insight', 'analysis', 'report'].some((k) => (l.intent || '').includes(k))).length;

    return {
      totalCalls: all.length,
      callsLast30Days: recent.length,
      voiceCount: voice,
      textCount: text,
      chatCount: chat,
      billParseCount: billParse,
      analysisCount: analysis,
      ttsCount: 0,
      avgDurationMs: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
      failedCount: failed,
      timeoutCount: timeout,
      successRate: all.length ? Math.round((success / all.length) * 1000) / 10 : 100,
      confirmedCount: all.filter((l) => l.confirmed).length,
      userModifiedCount: all.filter((l) => l.userModified).length,
    };
  }

  private buildBillStats(
    all: Array<Prisma.TransactionGetPayload<{ include: { category: true; lifeSpace: true } }>>,
    recent: typeof all,
    monthStart: Date,
    aiLogs: Array<Prisma.AiLogGetPayload<object>>,
  ) {
    const monthTx = all.filter((t) => t.occurredAt >= monthStart);
    const expense = all.filter((t) => t.type === TransactionType.expense);
    const income = all.filter((t) => t.type === TransactionType.income);
    const aiSource = all.filter((t) => t.source === 'ai').length;
    const manual = all.length - aiSource;
    const monthExpense = monthTx.filter((t) => t.type === TransactionType.expense);
    const monthIncome = monthTx.filter((t) => t.type === TransactionType.income);
    const amounts = expense.map((t) => num(t.amount));
    const avgAmount = amounts.length ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;

    return {
      totalCount: all.length,
      aiGeneratedCount: aiSource,
      manualCount: manual,
      expenseCount: expense.length,
      incomeCount: income.length,
      transferCount: 0,
      monthExpense: monthExpense.reduce((s, t) => s + num(t.amount), 0),
      monthIncome: monthIncome.reduce((s, t) => s + num(t.amount), 0),
      avgAmount: Math.round(avgAmount * 100) / 100,
      userModifiedBillCount: aiLogs.filter((l) => l.userModified && l.confirmed).length,
      last30Count: recent.length,
    };
  }

  private buildDailyTrend(
    items: Array<{ createdAt: Date }>,
    since: Date,
    mode: 'ai' | 'bill',
  ) {
    const days: Array<{ date: string; count: number }> = [];
    for (let i = 0; i < 30; i++) {
      const d = dayjs(since).add(i, 'day');
      const start = d.startOf('day');
      const end = d.endOf('day');
      const count = items.filter((x) => {
        const t = dayjs(x.createdAt);
        return !t.isBefore(start) && !t.isAfter(end);
      }).length;
      days.push({ date: d.format('YYYY-MM-DD'), count });
    }
    return days;
  }

  private buildBillTrend(
    transactions: Array<{ occurredAt: Date }>,
    since: Date,
  ) {
    const wrapped = transactions.map((t) => ({ createdAt: t.occurredAt }));
    return this.buildDailyTrend(wrapped, since, 'bill');
  }

  private buildIntentDistribution(logs: Array<{ intent: string | null }>) {
    const map = new Map<string, number>();
    for (const l of logs) {
      const key = l.intent || 'unknown';
      map.set(key, (map.get(key) || 0) + 1);
    }
    return [...map.entries()].map(([intent, count]) => ({ intent, count }));
  }

  private buildInputTypeDistribution(logs: Array<{ inputType: string | null }>) {
    const voice = logs.filter((l) => l.inputType === 'voice').length;
    const text = logs.length - voice;
    return [
      { type: 'voice', count: voice },
      { type: 'text', count: text },
    ];
  }

  private buildIncomeExpenseRatio(transactions: Array<{ type: TransactionType; amount: unknown }>) {
    const expense = transactions
      .filter((t) => t.type === TransactionType.expense)
      .reduce((s, t) => s + num(t.amount), 0);
    const income = transactions
      .filter((t) => t.type === TransactionType.income)
      .reduce((s, t) => s + num(t.amount), 0);
    return [
      { type: 'expense', amount: expense },
      { type: 'income', amount: income },
    ];
  }

  private buildLifeSpaces(
    userId: string,
    spaces: Array<Prisma.LifeSpaceGetPayload<object>>,
    templates: Array<Prisma.LifeSpaceTemplateGetPayload<object>>,
    transactions: Array<Prisma.TransactionGetPayload<{ include: { lifeSpace: true } }>>,
    aiLogs: Array<Prisma.AiLogGetPayload<object>>,
  ) {
    const spaceById = new Map(spaces.map((s) => [s.id, s]));
    const dailySpace = spaces.find((s) => s.type === 'daily');

    const txBySpaceId = new Map<string, typeof transactions>();
    const nullTxs: typeof transactions = [];
    for (const t of transactions) {
      if (t.lifeSpaceId) {
        const list = txBySpaceId.get(t.lifeSpaceId) || [];
        list.push(t);
        txBySpaceId.set(t.lifeSpaceId, list);
      } else {
        nullTxs.push(t);
      }
    }
    if (nullTxs.length && dailySpace) {
      const list = txBySpaceId.get(dailySpace.id) || [];
      txBySpaceId.set(dailySpace.id, [...list, ...nullTxs]);
    }

    const aiBySpaceId = new Map<string, number>();
    for (const log of aiLogs) {
      const sid = log.lifeSpaceId || pickLifeSpaceIdFromJson(log.finalResult);
      if (sid) aiBySpaceId.set(sid, (aiBySpaceId.get(sid) || 0) + 1);
    }

    const typesToShow = templates.length
      ? templates.map((t) => t.type)
      : TEMPLATE_TYPES;

    const cards = typesToShow.map((type) => {
      const template = templates.find((t) => t.type === type);
      const space = spaces.find((s) => s.type === type);
      const spaceId = space?.id;
      const txs = spaceId ? txBySpaceId.get(spaceId) || [] : [];
      const expense = txs.filter((t) => t.type === TransactionType.expense);
      const income = txs.filter((t) => t.type === TransactionType.income);
      const categoryCount = new Map<string, number>();
      for (const t of expense) {
        const name = (t as { category?: { name: string } }).category?.name || '其它';
        categoryCount.set(name, (categoryCount.get(name) || 0) + 1);
      }
      const topCategories = [...categoryCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

      const lastUsed = txs.length
        ? txs.reduce((max, t) => (t.occurredAt > max ? t.occurredAt : max), txs[0].occurredAt)
        : null;

      return {
        id: spaceId || `virtual-${type}`,
        type,
        name: space?.name || template?.name || SPACE_LABELS[type] || type,
        icon: space?.icon || template?.icon || '📒',
        isVirtual: !space,
        createdAt: space?.createdAt ?? null,
        transactionCount: txs.length,
        expenseTotal: expense.reduce((s, t) => s + num(t.amount), 0),
        incomeTotal: income.reduce((s, t) => s + num(t.amount), 0),
        lastUsedAt: lastUsed,
        aiInteractionCount: spaceId ? aiBySpaceId.get(spaceId) || 0 : 0,
        topCategories,
      };
    });

    const totalExpense = cards.reduce((s, c) => s + c.expenseTotal, 0);
    const spaceDistribution = cards
      .filter((c) => c.expenseTotal > 0)
      .map((c) => ({
        name: c.name,
        value: c.expenseTotal,
        ratio: totalExpense ? Math.round((c.expenseTotal / totalExpense) * 1000) / 10 : 0,
      }));

    return { lifeSpaceCards: cards, spaceDistribution };
  }

  private buildTags(
    user: { lastLoginAt: Date | null; membership: { level: string } | null },
    ai: ReturnType<AdminUserInsightService['buildAiStats']>,
    bill: ReturnType<AdminUserInsightService['buildBillStats']>,
    spaces: Array<{ type: string; transactionCount: number }>,
  ) {
    const tags: string[] = [];
    if (ai.callsLast30Days >= 20) tags.push('AI高频用户');
    if (ai.totalCalls > 0 && ai.voiceCount / ai.totalCalls >= 0.4) tags.push('语音偏好用户');
    const topSpace = [...spaces].sort((a, b) => b.transactionCount - a.transactionCount)[0];
    if (topSpace?.type === 'love' || topSpace?.type === 'couple') tags.push('恋爱空间活跃');
    if (bill.monthExpense > 0 && bill.monthIncome > bill.monthExpense) tags.push('预算意识增强');
    if ((user.membership?.level ?? 'free') === 'free' && ai.callsLast30Days >= 15) tags.push('会员潜力用户');
    const daysSinceLogin = user.lastLoginAt
      ? dayjs().diff(dayjs(user.lastLoginAt), 'day')
      : 999;
    if (daysSinceLogin >= 14) tags.push('流失风险用户');
    if (!tags.length) tags.push('普通用户');
    return tags;
  }

  private buildSummary(
    tags: string[],
    ai: ReturnType<AdminUserInsightService['buildAiStats']>,
    bill: ReturnType<AdminUserInsightService['buildBillStats']>,
  ) {
    const parts: string[] = [];
    if (tags.includes('语音偏好用户')) parts.push('高度依赖语音记账');
    else if (ai.totalCalls > 0) parts.push('以文字与 AI 交互为主');
    if (tags.includes('恋爱空间活跃')) parts.push('主要记录情侣消费');
    if (bill.monthExpense > 0) parts.push(`本月支出约 ¥${bill.monthExpense.toFixed(0)}`);
    if (tags.includes('预算意识增强')) parts.push('最近预算意识有所增强');
    if (tags.includes('AI高频用户')) parts.push('属于高活跃 AI 用户');
    if (tags.includes('流失风险用户')) parts.push('近期登录较少，需关注留存');
    return parts.length
      ? `该用户${parts.join('，')}。`
      : '该用户数据较少，暂无法生成详细画像。';
  }

  private buildBehaviorGraph(
    user: { id: string; nickname: string; membership: { level: string } | null },
    aiLogs: Array<{ intent: string | null; createdAt: Date }>,
    transactions: Array<{ category: { name: string }; type: TransactionType; amount: unknown }>,
    spaces: Array<{ type: string; name: string; expenseTotal: number }>,
  ) {
    const nodes: Array<{ id: string; name: string; category: string; value?: number }> = [];
    const links: Array<{ source: string; target: string; value: number }> = [];
    const userNode = 'user';
    nodes.push({ id: userNode, name: user.nickname || '用户', category: 'user' });

    const memberId = `member_${user.membership?.level ?? 'free'}`;
    nodes.push({ id: memberId, name: user.membership?.level ?? 'free', category: 'member' });
    links.push({ source: userNode, target: memberId, value: 1 });

    for (const s of spaces.filter((x) => x.expenseTotal > 0).slice(0, 5)) {
      const id = `space_${s.type}`;
      if (!nodes.find((n) => n.id === id)) {
        nodes.push({ id, name: s.name, category: 'space', value: s.expenseTotal });
      }
      links.push({ source: userNode, target: id, value: Math.round(s.expenseTotal) });
    }

    const catMap = new Map<string, number>();
    for (const t of transactions.filter((x) => x.type === TransactionType.expense)) {
      const name = t.category.name;
      catMap.set(name, (catMap.get(name) || 0) + num(t.amount));
    }
    for (const [name, amount] of [...catMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)) {
      const id = `cat_${name}`;
      nodes.push({ id, name, category: 'category', value: amount });
      links.push({ source: userNode, target: id, value: Math.round(amount) });
    }

    const intentMap = new Map<string, number>();
    for (const l of aiLogs) {
      const k = l.intent || 'unknown';
      intentMap.set(k, (intentMap.get(k) || 0) + 1);
    }
    for (const [intent, count] of intentMap.entries()) {
      const id = `intent_${intent}`;
      nodes.push({ id, name: intent, category: 'ai', value: count });
      links.push({ source: userNode, target: id, value: count });
    }

    const hourBuckets = { night: 0, noon: 0, other: 0 };
    for (const l of aiLogs) {
      const h = dayjs(l.createdAt).hour();
      if (h >= 22 || h < 6) hourBuckets.night++;
      else if (h >= 11 && h < 14) hourBuckets.noon++;
      else hourBuckets.other++;
    }
    if (hourBuckets.night >= hourBuckets.noon && hourBuckets.night > 0) {
      nodes.push({ id: 'time_night', name: '夜间活跃', category: 'time' });
      links.push({ source: userNode, target: 'time_night', value: hourBuckets.night });
    } else if (hourBuckets.noon > 0) {
      nodes.push({ id: 'time_noon', name: '午间活跃', category: 'time' });
      links.push({ source: userNode, target: 'time_noon', value: hourBuckets.noon });
    }

    return { nodes, links };
  }
}
