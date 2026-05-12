import { request } from '@/utils/request';
import type { SavingGoal } from '@/types/domain';

export const savingGoalApi = {
  create(data: { name: string; targetAmount: number; deadline?: string; icon?: string; color?: string }) {
    return request<SavingGoal>('/saving-goals', { method: 'POST', data });
  },

  list() {
    return request<SavingGoal[]>('/saving-goals');
  },

  update(id: string, data: { name?: string; targetAmount?: number; currentAmount?: number; deadline?: string; icon?: string; color?: string }) {
    return request<SavingGoal>(`/saving-goals/${id}`, { method: 'PATCH', data });
  },

  deposit(id: string, amount: number) {
    return request<SavingGoal>(`/saving-goals/${id}/deposit`, { method: 'POST', data: { amount } });
  },

  remove(id: string) {
    return request(`/saving-goals/${id}`, { method: 'DELETE' });
  },
};
