import { request } from '@/utils/request';
import type { WealthOverview, WealthGoal, WealthAdvice } from '@/types/domain';

export const wealthApi = {
  overview(month?: string) {
    return request<WealthOverview>(`/wealth/overview${month ? `?month=${month}` : ''}`);
  },

  refresh(month?: string) {
    return request<WealthOverview>(`/wealth/refresh${month ? `?month=${month}` : ''}`, { method: 'POST' });
  },

  listGoals() {
    return request<WealthGoal[]>('/wealth/goals');
  },

  createGoal(data: { name: string; targetAmount: number; deadline?: string; icon?: string; color?: string; allocPercent?: number }) {
    return request<WealthGoal>('/wealth/goals', { method: 'POST', data });
  },

  updateGoal(id: string, data: { name?: string; targetAmount?: number; deadline?: string; icon?: string; color?: string; allocPercent?: number }) {
    return request<WealthGoal>(`/wealth/goals/${id}`, { method: 'PATCH', data });
  },

  removeGoal(id: string) {
    return request(`/wealth/goals/${id}`, { method: 'DELETE' });
  },

  getAdvice() {
    return request<WealthAdvice>('/wealth/advice');
  },
};
