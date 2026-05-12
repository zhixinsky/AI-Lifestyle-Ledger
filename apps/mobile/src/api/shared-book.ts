import { request } from '@/utils/request';
import type { SharedBook, AAStats, Transaction } from '@/types/domain';

export const sharedBookApi = {
  create(data: { name: string; type?: string }) {
    return request<SharedBook>('/shared-book', { method: 'POST', data });
  },

  join(inviteCode: string) {
    return request<SharedBook>('/shared-book/join', { method: 'POST', data: { inviteCode } });
  },

  list() {
    return request<SharedBook[]>('/shared-book');
  },

  getDetail(id: string) {
    return request<SharedBook>(`/shared-book/${id}`);
  },

  listTransactions(id: string, page = 1) {
    return request<{ items: Transaction[]; total: number }>(`/shared-book/${id}/transactions?page=${page}`);
  },

  getAAStats(id: string) {
    return request<AAStats>(`/shared-book/${id}/aa-stats`);
  },

  setRole(bookId: string, userId: string, role: string) {
    return request(`/shared-book/${bookId}/members/${userId}/role`, { method: 'POST', data: { role } });
  },

  leave(id: string) {
    return request(`/shared-book/${id}/leave`, { method: 'POST' });
  },

  delete(id: string) {
    return request(`/shared-book/${id}`, { method: 'DELETE' });
  },
};
