import { request } from '@/utils/request';
import type {
  AiParsedTransaction,
  AiReport,
  AiInsight,
  AiChatMessage,
  AiChatResponse,
  UserProfile,
  Transaction,
} from '@/types/domain';

export interface ParseBillResult {
  logId: string;
  transactions: AiParsedTransaction[];
}

export const aiApi = {
  parseBill(input: string) {
    return request<ParseBillResult>('/ai/bills/parse', {
      method: 'POST',
      data: {
        input,
        occurredAt: new Date().toISOString()
      }
    });
  },
  confirmBill(logId: string, transactions: AiParsedTransaction[]) {
    return request<{ success: boolean; transactions: Transaction[] }>(`/ai/bills/${logId}/confirm`, {
      method: 'POST',
      data: { transactions }
    });
  },

  dailyReport(date?: string) {
    const query = date ? `?date=${date}` : '';
    return request<AiReport>(`/ai/report/daily${query}`);
  },
  monthlyReport(month?: string) {
    const query = month ? `?month=${month}` : '';
    return request<AiReport>(`/ai/report/monthly${query}`);
  },
  reportHistory(type: 'daily' | 'monthly' = 'daily') {
    return request<AiReport[]>(`/ai/report/history?type=${type}`);
  },
  insight() {
    return request<AiInsight>('/ai/insight');
  },
  userProfile() {
    return request<UserProfile>('/ai/profile');
  },
  chat(message: string, history: AiChatMessage[] = []) {
    return request<AiChatResponse>('/ai/chat', {
      method: 'POST',
      data: { message, history }
    });
  },
};
