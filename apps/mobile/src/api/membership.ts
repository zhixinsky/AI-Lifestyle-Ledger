import { request } from '@/utils/request';
import type { MembershipStatus, Order } from '@/types/domain';

export interface VirtualPaymentParams {
  mode: string;
  signData: string;
  paySig: string;
  signature: string;
}

export interface CreateOrderResponse {
  orderId: string;
  mock?: boolean;
  message?: string;
  virtualPayParams?: VirtualPaymentParams;
}

export const membershipApi = {
  getStatus() {
    return request<MembershipStatus>('/membership/status');
  },

  setAutoRenew(autoRenew: boolean) {
    return request('/membership/auto-renew', { method: 'POST', data: { autoRenew } });
  },

  createOrder(data: { type?: string; planId: string; amount?: number; description?: string }) {
    return request<CreateOrderResponse>('/payment/create-order', { method: 'POST', data });
  },

  mockPay(orderId: string) {
    return request(`/payment/mock-pay/${orderId}`, { method: 'POST' });
  },

  syncOrder(orderId: string, clientPaid = false) {
    return request<{ paid: boolean; order?: Order }>(`/payment/sync/${orderId}`, { method: 'POST', data: { clientPaid } });
  },

  listOrders() {
    return request<Order[]>('/payment/orders');
  },
};
