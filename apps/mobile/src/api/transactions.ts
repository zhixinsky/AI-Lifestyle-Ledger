import { request } from '@/utils/request';
import type { Category, DashboardSummary, StatSummary, Transaction, TransactionType } from '@/types/domain';

export interface TransactionPayload {
  type: TransactionType;
  amount: number;
  categoryId: string;
  occurredAt: string;
  remark?: string;
  tags?: string[];
  voucherUrl?: string;
}

export const transactionApi = {
  list(params?: { month?: string; keyword?: string; categoryId?: string }) {
    const query = params ? Object.entries(params).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&') : '';
    return request<Transaction[]>(`/transactions${query ? `?${query}` : ''}`);
  },
  create(payload: TransactionPayload) {
    return request<Transaction>('/transactions', { method: 'POST', data: payload });
  },
  update(id: string, payload: Partial<TransactionPayload>) {
    return request<Transaction>(`/transactions/${id}`, { method: 'PATCH', data: payload });
  },
  remove(id: string) {
    return request<{ success: boolean }>(`/transactions/${id}`, { method: 'DELETE' });
  },
  categories() {
    return request<Category[]>('/categories');
  },
  createCategory(data: { name: string; icon: string; color: string; type: TransactionType }) {
    return request<Category>('/categories', { method: 'POST', data });
  },
  deleteCategory(id: string) {
    return request<{ success: boolean }>(`/categories/${id}`, { method: 'DELETE' });
  },
  dashboard() {
    return request<DashboardSummary>('/statistics/dashboard');
  },
  statistics(params?: { month?: string; period?: 'week' | 'month' | 'year'; type?: 'expense' | 'income' }) {
    const query = params ? Object.entries(params).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&') : '';
    return request<StatSummary>(`/statistics${query ? `?${query}` : ''}`);
  }
};
