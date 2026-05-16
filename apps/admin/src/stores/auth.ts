import { defineStore } from 'pinia';
import { ref } from 'vue';
import request, { clearAdminToken, getAdminToken, setAdminToken } from '@/utils/request';

export type AdminInfo = {
  id: string;
  username: string;
  nickname: string;
  role: string;
};

export const useAuthStore = defineStore('auth', () => {
  const token = ref(getAdminToken());
  const admin = ref<AdminInfo | null>(null);

  async function login(username: string, password: string) {
    const res = await request.post<{ token: string; admin: AdminInfo }>('/admin/auth/login', {
      username,
      password,
    });
    token.value = res.token;
    admin.value = res.admin;
    setAdminToken(res.token);
    return res;
  }

  async function fetchMe() {
    if (!token.value) return null;
    admin.value = await request.get<AdminInfo>('/admin/auth/me');
    return admin.value;
  }

  async function logout() {
    try {
      await request.post('/admin/auth/logout');
    } catch {
      /* ignore */
    }
    token.value = '';
    admin.value = null;
    clearAdminToken();
  }

  return { token, admin, login, fetchMe, logout };
});
