import { request } from '@/utils/request';

export interface AccountProfile {
  id: string;
  nickname: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
  hasPassword: boolean;
  wechatBound: boolean;
  phoneBound: boolean;
  createdAt: string;
  updatedAt: string;
}

export const accountApi = {
  profile() {
    return request<AccountProfile>('/account/profile');
  },
  sendPhoneCode(phone: string) {
    return request<{ success: boolean }>('/account/send-phone-code', { method: 'POST', data: { phone } });
  },
  bindPhone(phone: string, code: string) {
    return request<AccountProfile>('/account/bind-phone', { method: 'POST', data: { phone, code } });
  },
  sendEmailCode(email: string) {
    return request<{ success: boolean }>('/account/send-email-code', { method: 'POST', data: { email } });
  },
  bindEmail(email: string, code: string) {
    return request<AccountProfile>('/account/bind-email', { method: 'POST', data: { email, code } });
  },
  setPassword(password: string, confirmPassword: string) {
    return request<{ success: boolean }>('/account/set-password', { method: 'POST', data: { password, confirmPassword } });
  },
  changePassword(oldPassword: string, newPassword: string, confirmPassword: string) {
    return request<{ success: boolean }>('/account/change-password', {
      method: 'POST',
      data: { oldPassword, newPassword, confirmPassword },
    });
  },
  logout() {
    return request<{ success: boolean }>('/account/logout', { method: 'POST' });
  },
  deleteAccount() {
    return request<{ success: boolean }>('/account/delete-account', { method: 'POST', data: { confirm: 'DELETE' } });
  },
};
