import { useAuthStore } from '@/stores/auth';

/** 未登录时触发全局登录抽屉，返回 false */
export function ensureLoggedIn(): boolean {
  const authStore = useAuthStore();
  if (authStore.isLoggedIn) return true;
  uni.$emit('show-login');
  return false;
}
