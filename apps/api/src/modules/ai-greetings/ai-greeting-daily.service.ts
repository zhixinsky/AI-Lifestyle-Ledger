import { Injectable, Logger } from '@nestjs/common';
import { AiGreetingPeriod, AiGreetingSource, TransactionType } from '@prisma/client';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { PrismaService } from '../prisma/prisma.service';
import { AiChatService } from '../ai/services/ai-chat.service';
import {
  ALL_GREETING_PERIODS,
  DEFAULT_SUBTITLES_BY_PERIOD,
  DEFAULT_TITLE_BY_PERIOD,
} from './default-subtitles';

dayjs.extend(utc);
dayjs.extend(timezone);
const TZ = 'Asia/Shanghai';

export interface LightProfile {
  nickname: string;
  txLast7Days: number;
  avgTxPerDay7: string;
  topExpenseCategories: string[];
  usedAiAnalysisRecently: boolean;
  lifeSpaceName: string | null;
  membership: string;
}

@Injectable()
export class AiGreetingDailyService {
  private readonly logger = new Logger(AiGreetingDailyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiChat: AiChatService,
  ) {}

  shanghaiTodayYmd(d = new Date()): string {
    return dayjs(d).tz(TZ).format('YYYY-MM-DD');
  }

  parseYmdToDate(ymd: string): Date {
    const [y, m, d] = ymd.split('-').map((x) => parseInt(x, 10));
    if (!y || m < 1 || m > 12 || d < 1 || d > 31) {
      return dayjs().tz(TZ).startOf('day').toDate();
    }
    return dayjs.tz(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, TZ).startOf('day').toDate();
  }

  async findTodayRow(userId: string, date: Date, period: AiGreetingPeriod) {
    return this.prisma.aiGreetingDaily.findUnique({
      where: { userId_date_period: { userId, date, period } },
    });
  }

  async buildLightProfile(userId: string): Promise<LightProfile> {
    const now = dayjs().tz(TZ);
    const start7 = now.subtract(7, 'day').startOf('day').toDate();
    const end = now.endOf('day').toDate();
    const start30 = now.subtract(30, 'day').startOf('day').toDate();

    const [user, txs7, txs30Expense, aiReport, aiLog] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          membership: true,
          lifeSpaces: { where: { isVisible: true }, orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }], take: 8 },
        },
      }),
      this.prisma.transaction.findMany({
        where: { userId, occurredAt: { gte: start7, lte: end } },
      }),
      this.prisma.transaction.findMany({
        where: { userId, type: TransactionType.expense, occurredAt: { gte: start30, lte: end } },
        include: { category: true },
      }),
      this.prisma.aiReport.findFirst({ where: { userId, createdAt: { gte: start30 } } }),
      this.prisma.aiLog.findFirst({ where: { userId, createdAt: { gte: start30 } } }),
    ]);

    const catTotals = new Map<string, number>();
    for (const t of txs30Expense) {
      const n = t.category?.name || '其它';
      catTotals.set(n, (catTotals.get(n) || 0) + Number(t.amount));
    }
    const topExpenseCategories = [...catTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    const dailySpace = user?.lifeSpaces?.find((s) => s.type === 'daily') || user?.lifeSpaces?.[0];
    const level = user?.membership?.level || 'free';
    const expire = user?.membership?.expireAt;
    const membership =
      level === 'free'
        ? '免费用户'
        : `${level}${expire ? `，到期 ${dayjs(expire).tz(TZ).format('YYYY-MM-DD')}` : ''}`;

    const n = txs7.length;
    const avg = (n / 7).toFixed(1);

    return {
      nickname: user?.nickname || '用户',
      txLast7Days: n,
      avgTxPerDay7: avg,
      topExpenseCategories: topExpenseCategories,
      usedAiAnalysisRecently: Boolean(aiReport || aiLog),
      lifeSpaceName: dailySpace?.name || null,
      membership,
    };
  }

  pickFiveDefaults(period: AiGreetingPeriod): string[] {
    const pool = DEFAULT_SUBTITLES_BY_PERIOD[period] || [];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(5, shuffled.length));
  }

  private buildPrompt(profile: LightProfile, targetDateYmd: string): string {
    const cats = profile.topExpenseCategories.length ? profile.topExpenseCategories.join('、') : '暂无';
    return `你是 Moona 的「米粒」记账助手文案策划。请基于用户轻量画像，为「日历日 ${targetDateYmd}（上海时区）」一次性生成 7 个时间段的问候主标题与 5 条副文案。

用户画像：
- 昵称：${profile.nickname}
- 近 7 天记账笔数：${profile.txLast7Days}（日均约 ${profile.avgTxPerDay7} 笔）
- 近 30 天高频支出分类：${cats}
- 近 30 天是否使用过 AI 分析/识别：${profile.usedAiAnalysisRecently ? '是' : '否'}
- 当前生活空间：${profile.lifeSpaceName || '未设置'}
- 会员状态：${profile.membership}

时间段定义（须严格使用下列英文键）：
- midnight：00:00-04:59
- morning：05:00-08:59
- forenoon：09:00-11:29
- noon：11:30-13:59
- afternoon：14:00-17:59
- evening：18:00-21:59
- night：22:00-23:59

输出要求：
1. 只输出一个 JSON 对象，不要 markdown、不要解释。
2. 结构严格为：
{
  "midnight": {"title":"主标题8字以内","subtitles":["副1","副2","副3","副4","副5"]},
  "morning": {"title":"...","subtitles":["","","","",""]},
  ... 共 7 个键，缺一不可
}
3. 每个 subtitles 必须恰好 5 条；每条 8～28 个汉字为宜，口语自然，与记账/生活相关，避免说教。
4. 结合画像轻微个性化，但不要出现真实手机号；不要输出数组以外的键。`;
  }

  private parseAiPayload(raw: string | null): Record<string, { title?: string; subtitles?: string[] }> | null {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Record<string, { title?: string; subtitles?: string[] }>;
      return parsed;
    } catch {
      return null;
    }
  }

  private normalizePeriodPayload(
    period: AiGreetingPeriod,
    payload: { title?: string; subtitles?: string[] } | undefined,
  ): { title: string; subtitles: string[]; source: AiGreetingSource } {
    const subs = (payload?.subtitles || [])
      .map((s) => (typeof s === 'string' ? s.trim() : ''))
      .filter(Boolean);
    const title = (payload?.title || '').trim() || DEFAULT_TITLE_BY_PERIOD[period];
    if (subs.length >= 5) {
      return { title, subtitles: subs.slice(0, 5), source: AiGreetingSource.ai };
    }
    return {
      title: DEFAULT_TITLE_BY_PERIOD[period],
      subtitles: this.pickFiveDefaults(period),
      source: AiGreetingSource.default,
    };
  }

  async upsertRow(
    userId: string,
    date: Date,
    period: AiGreetingPeriod,
    title: string,
    subtitles: string[],
    source: AiGreetingSource,
  ) {
    await this.prisma.aiGreetingDaily.upsert({
      where: { userId_date_period: { userId, date, period } },
      create: { userId, date, period, title, subtitles, source },
      update: { title, subtitles, source },
    });
  }

  async generateDayForUser(userId: string, date: Date): Promise<void> {
    const ymd = dayjs(date).tz(TZ).format('YYYY-MM-DD');
    const profile = await this.buildLightProfile(userId);
    const prompt = this.buildPrompt(profile, ymd);

    let merged: Record<AiGreetingPeriod, { title: string; subtitles: string[]; source: AiGreetingSource }> | null =
      null;

    try {
      const result = await this.aiChat.complete([
        {
          role: 'system',
          content:
            '你是 JSON 生成器，只输出合法 JSON 对象，键为 midnight,morning,forenoon,noon,afternoon,evening,night。',
        },
        { role: 'user', content: prompt },
      ]);
      const parsed = this.parseAiPayload(result);
      if (parsed) {
        merged = {} as Record<AiGreetingPeriod, { title: string; subtitles: string[]; source: AiGreetingSource }>;
        for (const period of ALL_GREETING_PERIODS) {
          const n = this.normalizePeriodPayload(period, parsed[period]);
          merged[period] = n;
        }
      }
    } catch (e) {
      this.logger.warn(`[AiGreeting] AI call failed user=${userId}: ${(e as Error).message}`);
    }

    if (!merged) {
      merged = {} as Record<AiGreetingPeriod, { title: string; subtitles: string[]; source: AiGreetingSource }>;
      for (const period of ALL_GREETING_PERIODS) {
        merged[period] = {
          title: DEFAULT_TITLE_BY_PERIOD[period],
          subtitles: this.pickFiveDefaults(period),
          source: AiGreetingSource.default,
        };
      }
    }

    for (const period of ALL_GREETING_PERIODS) {
      const block = merged[period]!;
      await this.upsertRow(userId, date, period, block.title, block.subtitles, block.source);
    }
  }

  async listActiveUserIdsLast7Days(): Promise<string[]> {
    const since = dayjs().tz(TZ).subtract(7, 'day').startOf('day').toDate();
    const grouped = await this.prisma.transaction.groupBy({
      by: ['userId'],
      where: { occurredAt: { gte: since } },
    });
    return grouped.map((g) => g.userId);
  }

  /** 凌晨批量：为指定日历日（上海）写入全量时段 */
  async runBatchForShanghaiDate(targetDate: Date): Promise<{ users: number; errors: number }> {
    const userIds = await this.listActiveUserIdsLast7Days();
    const enabled = await this.prisma.user.findMany({
      where: { id: { in: userIds }, smartGreetingEnabled: true },
      select: { id: true },
    });
    const ids = enabled.map((u) => u.id);
    let errors = 0;
    for (const uid of ids) {
      try {
        await this.generateDayForUser(uid, targetDate);
        await new Promise((r) => setTimeout(r, 250));
      } catch (e) {
        errors += 1;
        this.logger.error(`[AiGreeting] batch user failed ${uid}: ${(e as Error).message}`);
        try {
          for (const period of ALL_GREETING_PERIODS) {
            await this.upsertRow(
              uid,
              targetDate,
              period,
              DEFAULT_TITLE_BY_PERIOD[period],
              this.pickFiveDefaults(period),
              AiGreetingSource.default,
            );
          }
        } catch (e2) {
          this.logger.error(`[AiGreeting] default fallback failed ${uid}: ${(e2 as Error).message}`);
        }
      }
    }
    return { users: ids.length, errors };
  }
}
