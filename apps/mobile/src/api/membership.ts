import { request } from '@/utils/request';
import type { MembershipStatus, Order } from '@/types/domain';

export const membershipApi = {
  getStatus() {
    return request<MembershipStatus>('/membership/status');
  },

  setAutoRenew(autoRenew: boolean) {
    return request('/membership/auto-renew', { method: 'POST', data: { autoRenew } });
  },

  createOrder(data: { type?: string; amount: number; description?: string }) {
    return request('/payment/create-order', { method: 'POST', data });
  },

  mockPay(orderId: string) {
    return request(`/payment/mock-pay/${orderId}`, { method: 'POST' });
  },

  listOrders() {
    return request<Order[]>('/payment/orders');
  },
};
