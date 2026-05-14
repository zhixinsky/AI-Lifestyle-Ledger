import { request } from '@/utils/request';
import type { MembershipStatus, Order } from '@/types/domain';

export interface WxPaymentParams {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: 'RSA' | 'MD5' | string;
  paySign: string;
}

export interface CreateOrderResponse {
  orderId: string;
  mock?: boolean;
  message?: string;
  wxParams?: WxPaymentParams;
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

  syncOrder(orderId: string) {
    return request<{ paid: boolean; tradeState?: string; order?: Order }>(`/payment/sync/${orderId}`, { method: 'POST' });
  },

  listOrders() {
    return request<Order[]>('/payment/orders');
  },
};
