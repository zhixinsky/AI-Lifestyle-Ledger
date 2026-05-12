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

    async loadInsight() {
      try {
        this.insight = await aiApi.insight();
      } catch {
        this.insight = { text: '记一笔账，让 AI 更了解你', type: 'tip' };
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
