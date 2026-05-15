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
  refreshSession(code: string) {
    return request<{ success: boolean }>('/auth/refresh-session', { method: 'POST', data: { code } });
  },
  profile() {
    return request<User>('/users/me');
  },
  /** POST /api/user/profile：微信快捷登录完善资料（云存储 fileID） */
  postUserProfile(data: { nickname?: string; avatarUrl?: string; smartGreetingEnabled?: boolean }) {
    return request<User>('/user/profile', { method: 'POST', data });
  },
  /** PATCH /api/user/profile（与 PATCH /api/users/me 等价） */
  updateProfile(data: { nickname?: string; avatarUrl?: string; smartGreetingEnabled?: boolean }) {
    return request<User>('/user/profile', { method: 'PATCH', data });
  },
};
