<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';
import { useLoginSheetStore } from '@/stores/login-sheet';
import { useAiStore } from '@/stores/ai';
import { useAuthStore } from '@/stores/auth';
import { useFinanceStore } from '@/stores/finance';
import { initCloudContainer } from '@/utils/request';

const loginSheet = useLoginSheetStore();
const aiStore = useAiStore();
const authStore = useAuthStore();
const financeStore = useFinanceStore();

onLaunch(() => {
  console.log('Moona launched');
  uni.$on('show-login', () => loginSheet.open());
  uni.$on('auth-expired', () => {
    authStore.logout();
    financeStore.reset();
  });
  // 记账数据更新后：立刻刷新 AI 提醒/观察
  uni.$on('transactions-updated', () => {
    if (authStore.isLoggedIn) {
      Promise.all([
        financeStore.loadDashboard().catch(() => {}),
        financeStore.loadTransactions().catch(() => {}),
        financeStore.loadStatistics({ period: 'month' }).catch(() => {}),
        aiStore.refreshInsight().catch(() => {}),
        aiStore.loadGreeting().catch(() => {}),
      ]).catch(() => {});
    }
  });
  // 登录成功：立即拉一次
  uni.$on('login-success', () => {
    if (authStore.isLoggedIn) {
      aiStore.refreshInsight().catch(() => {});
      aiStore.loadGreeting().catch(() => {});
    }
  });

  // 每 30 分钟重新分析一次（刷新一批），每 3 分钟轮换展示
  setInterval(() => {
    if (!authStore.isLoggedIn) return;
    const last = aiStore.lastInsightFetchedAt || 0;
    if (Date.now() - last >= 30 * 60 * 1000) {
      aiStore.fetchInsightPool(1).catch(() => {});
    }
  }, 60 * 1000);

  setInterval(() => {
    if (!authStore.isLoggedIn) return;
    aiStore.rotateInsight();
  }, 3 * 60 * 1000);
  // #ifdef MP-WEIXIN
  initCloudContainer();
  // #endif
});
</script>

<style>
page {
  min-height: 100%;
  background: #f7f8fa;
  color: #1e1e1e;
  font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

view,
text,
button,
input,
textarea {
  box-sizing: border-box;
}

button {
  margin: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

button::after {
  border: none;
}

/* 隐藏原生 tabBar */
uni-tabbar,
.uni-tabbar-bottom {
  display: none !important;
}
</style>
