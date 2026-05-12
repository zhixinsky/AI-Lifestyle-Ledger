import { request } from '@/utils/request';
import type { User } from '@/types/domain';

export interface LoginPayload {
  phone: string;
  code: string;
}

export interface LoginResult {
  accessToken: string;
  user: User;
}

export const authApi = {
  sendCode(phone: string) {
    return request<{ success: boolean }>('/auth/send-code', { method: 'POST', data: { phone } });
  },
  login(payload: LoginPayload) {
    return request<LoginResult>('/auth/login', { method: 'POST', data: payload });
  },
  wxLogin(code: string) {
    return request<LoginResult>('/auth/wx-login', { method: 'POST', data: { code } });
  },
  profile() {
    return request<User>('/users/me');
  },
  updateProfile(data: { nickname?: string; avatarUrl?: string }) {
    return request<User>('/users/me', { method: 'PATCH', data });
  },
  uploadAvatar(base64Data: string) {
    return request<{ url: string }>('/upload/avatar', { method: 'POST', data: { avatar: base64Data } });
  },
};
