import { useAuthStore } from '@/stores/auth';
import { useLoginSheetStore } from '@/stores/login-sheet';

/** 未登录时触发全局登录抽屉，返回 false */
export function ensureLoggedIn(): boolean {
  const authStore = useAuthStore();
  if (authStore.isLoggedIn) return true;
  const loginSheet = useLoginSheetStore();
  uni.showToast({ title: '登录后可使用', icon: 'none' });
  loginSheet.open();
  return false;
}
