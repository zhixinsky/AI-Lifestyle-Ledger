import { defineStore } from 'pinia';
import { authApi } from '@/api/auth';
import type { User } from '@/types/domain';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: uni.getStorageSync('token') as string | '',
    user: null as User | null
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token)
  },
  actions: {
    async login(phone: string, code: string) {
      const result = await authApi.login({ phone, code });
      this.token = result.accessToken;
      this.user = result.user;
      uni.setStorageSync('token', result.accessToken);
    },
    async loadProfile() {
      if (!this.token) return;
      this.user = await authApi.profile();
    },
    logout() {
      this.token = '';
      this.user = null;
      uni.removeStorageSync('token');
    }
  }
});
