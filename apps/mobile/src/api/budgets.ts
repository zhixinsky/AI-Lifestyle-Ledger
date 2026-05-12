import { request } from '@/utils/request';
import type { BudgetItem, BudgetOverview } from '@/types/domain';

export const budgetApi = {
  upsert(data: { amount: number; categoryId?: string; period?: 'weekly' | 'monthly'; month?: string }) {
    return request<BudgetItem>('/budgets', { method: 'POST', data });
  },

  list(month?: string) {
    return request<BudgetItem[]>(`/budgets${month ? `?month=${month}` : ''}`);
  },

  overview(month?: string) {
    return request<BudgetOverview>(`/budgets/overview${month ? `?month=${month}` : ''}`);
  },

  remove(id: string) {
    return request(`/budgets/${id}`, { method: 'DELETE' });
  },

  getAdvice(month?: string) {
    return request<{ advice: string }>(`/ai/budget-advice${month ? `?month=${month}` : ''}`);
  },
};
