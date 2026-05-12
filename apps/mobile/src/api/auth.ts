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
  login(payload: LoginPayload) {
    return request<LoginResult>('/auth/login', { method: 'POST', data: payload });
  },
  profile() {
    return request<User>('/users/me');
  },
  updateProfile(data: { nickname?: string; avatarUrl?: string }) {
    return request<User>('/users/me', { method: 'PATCH', data });
  },
};
