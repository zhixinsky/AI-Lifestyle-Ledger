import { defineStore } from 'pinia';
import { aiApi } from '@/api/ai';
import type {
  AiParsedTransaction,
  AiChatMessage,
  AiInsight,
  AiReport,
  UserProfile,
} from '@/types/domain';

export const useAiStore = defineStore('ai', {
  state: () => ({
    logId: '',
    rawInput: '',
    parsedTransactions: [] as AiParsedTransaction[],

    chatMessages: [] as AiChatMessage[],
    chatLoading: false,
    suggestions: ['我这个月花了多少', '帮我分析消费习惯', '最近消费正常吗', '帮我做个预算'] as string[],

    insight: null as AiInsight | null,
    insightPool: [] as AiInsight[],
    insightCursor: 0,
    lastInsightFetchedAt: 0,
    insightFetching: false,
    lastInsightFetchFailedAt: 0,
    greeting: '',
    dailyReport: null as AiReport | null,
    monthlyReport: null as AiReport | null,
    profile: null as UserProfile | null,
  }),
  actions: {
    setParsed(rawInput: string, logId: string, transactions: AiParsedTransaction[]) {
      this.rawInput = rawInput;
      this.logId = logId;
      this.parsedTransactions = transactions;
    },
    clear() {
      this.logId = '';
      this.rawInput = '';
      this.parsedTransactions = [];
    },

    async sendMessage(message: string) {
      this.chatMessages.push({ role: 'user', content: message });
      this.chatLoading = true;
      try {
        const history = this.chatMessages.slice(0, -1).slice(-10);
        const result = await aiApi.chat(message, history);
        this.chatMessages.push({ role: 'assistant', content: result.reply });
        if (result.suggestions?.length) {
          this.suggestions = result.suggestions;
        }
      } catch {
        this.chatMessages.push({ role: 'assistant', content: '抱歉，AI 暂时无法响应，请稍后再试～' });
      } finally {
        this.chatLoading = false;
      }
    },
    clearChat() {
      this.chatMessages = [];
      this.suggestions = ['我这个月花了多少', '帮我分析消费习惯', '最近消费正常吗', '帮我做个预算'];
    },

    rotateInsight() {
      if (!this.insightPool.length) return;
      this.insightCursor = (this.insightCursor + 1) % this.insightPool.length;
      this.insight = this.insightPool[this.insightCursor] || this.insightPool[0] || this.insight;
    },

    async fetchInsightPool(count = 5, options: { force?: boolean } = {}) {
      if (this.insightFetching && !options.force) return;
      // 失败后做退避，避免短时间重复触发 callContainer system error
      if (!options.force && this.lastInsightFetchFailedAt && Date.now() - this.lastInsightFetchFailedAt < 2 * 60 * 1000) {
        return;
      }
      this.insightFetching = true;

      // 小程序云托管下频繁 callContainer 容易 102002，默认只打一次
      // #ifdef MP-WEIXIN
      const maxCount = 1;
      // #endif
      // #ifndef MP-WEIXIN
      const maxCount = Math.max(1, Math.min(count, 5));
      // #endif

      const items: AiInsight[] = [];
      for (let i = 0; i < maxCount; i++) {
        try {
          const one = await aiApi.insight();
          if (one?.text) items.push(one);
        } catch {
          // ignore single failure
        }
      }
      // 去重（按 text）
      const seen = new Set<string>();
      const dedup = items.filter((it) => {
        const key = `${it.type || ''}:${it.text || ''}`.trim();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (dedup.length) {
        this.insightPool = dedup;
        this.insightCursor = 0;
        this.insight = dedup[0]!;
        this.lastInsightFetchedAt = Date.now();
        this.lastInsightFetchFailedAt = 0;
        this.insightFetching = false;
        return;
      }
      // fallback：维持旧值或给默认文案
      if (!this.insight) {
        this.insight = { text: '记一笔账，让 AI 更了解你', type: 'tip' };
      }
      if (!this.insightPool.length && this.insight) {
        this.insightPool = [this.insight];
        this.insightCursor = 0;
      }
      this.lastInsightFetchedAt = Date.now();
      this.lastInsightFetchFailedAt = Date.now();
      this.insightFetching = false;
    },

    /** 兼容旧调用：拉取一批 insight（默认 5 条） */
    async loadInsight() {
      await this.fetchInsightPool(5);
    },
    async refreshInsight() {
      await this.fetchInsightPool(1, { force: true });
    },
    async loadGreeting() {
      try {
        const result = await aiApi.greeting();
        this.greeting = result.greeting || '';
      } catch {
        this.greeting = '';
      }
    },
    async loadDailyReport(date?: string) {
      this.dailyReport = await aiApi.dailyReport(date);
    },
    async loadMonthlyReport(month?: string) {
      this.monthlyReport = await aiApi.monthlyReport(month);
    },
    async loadProfile() {
      try {
        this.profile = await aiApi.userProfile();
      } catch {
        this.profile = null;
      }
    },
  },
});
