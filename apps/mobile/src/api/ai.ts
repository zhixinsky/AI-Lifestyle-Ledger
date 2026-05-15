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

export type AiTaskType = 'parse_bill' | 'chat';
export type AiTaskStatus = 'pending' | 'processing' | 'success' | 'failed';

export interface AiTask {
  id: string;
  type: AiTaskType;
  intent?: string | null;
  status: AiTaskStatus;
  resultJson?: unknown;
  errorMessage?: string | null;
  retryCount: number;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
}

export interface CreateAiTaskResult {
  taskId: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  createTask(data: { type: AiTaskType; inputText?: string; audioUrl?: string; intent?: string }) {
    return request<CreateAiTaskResult>('/ai/tasks', {
      method: 'POST',
      data
    });
  },
  getTask(id: string) {
    return request<AiTask>(`/ai/tasks/${id}`);
  },
  async waitTask<T>(id: string, options: { timeoutMs?: number; intervalMs?: number; onTick?: (elapsedMs: number) => void } = {}) {
    const timeoutMs = options.timeoutMs ?? 15000;
    const intervalMs = options.intervalMs ?? 800;
    const start = Date.now();

    while (Date.now() - start <= timeoutMs) {
      const elapsed = Date.now() - start;
      options.onTick?.(elapsed);
      const task = await this.getTask(id);
      if (task.status === 'success') {
        return task.resultJson as T;
      }
      if (task.status === 'failed') {
        throw new Error(task.errorMessage || 'AI 任务处理失败');
      }
      await sleep(intervalMs);
    }

    throw new Error('AI 任务处理超时');
  },
};
