import { defineStore } from 'pinia';
import { transactionApi } from '@/api/transactions';
import type { Category, DashboardSummary, StatSummary, Transaction } from '@/types/domain';

export const useFinanceStore = defineStore('finance', {
  state: () => ({
    categories: [] as Category[],
    transactions: [] as Transaction[],
    dashboard: null as DashboardSummary | null,
    statistics: null as StatSummary | null
  }),
  actions: {
    async loadCategories() {
      try {
        this.categories = await transactionApi.categories();
      } catch (e) {
        console.error('[finance] loadCategories failed:', e);
      }
    },
    async addCategory(data: { name: string; icon: string; color: string; type: 'expense' | 'income' }) {
      const cat = await transactionApi.createCategory(data);
      this.categories.push(cat);
      return cat;
    },
    async removeCategory(id: string) {
      await transactionApi.deleteCategory(id);
      this.categories = this.categories.filter((c) => c.id !== id);
    },
    async loadDashboard() {
      this.dashboard = await transactionApi.dashboard();
    },
    async loadTransactions(params?: { month?: string; keyword?: string; categoryId?: string }) {
      this.transactions = await transactionApi.list(params);
    },
    async loadStatistics(params?: { month?: string; period?: 'week' | 'month' | 'year'; type?: 'expense' | 'income' }) {
      this.statistics = await transactionApi.statistics(params);
    }
  }
});
