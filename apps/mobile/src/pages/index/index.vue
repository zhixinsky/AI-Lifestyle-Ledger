<template>
  <view>
  <PageShell>
    <!-- 顶部问候 -->
    <view class="topbar">
      <view>
        <text class="greeting">Hi，{{ userName }}</text>
        <text class="sub-text">{{ aiGreeting }}</text>
      </view>
    </view>

    <!-- 今日支出 Hero -->
    <MoonaCard>
      <view class="hero-row">
        <view class="hero-left">
          <text class="hero-label">今日支出（元）</text>
          <text class="hero-amount">¥{{ formatAmount(summary.todayExpense) }}</text>
          <view class="hero-tags">
            <view class="tag">
              <text>本月 ¥{{ formatAmount(summary.monthExpense) }}</text>
            </view>
            <view class="tag income">
              <text>收入 ¥{{ formatAmount(summary.monthIncome) }}</text>
            </view>
          </view>
        </view>
        <view class="hero-right">
        <view class="budget-ring">
          <view class="ring-track" />
          <view class="ring-clip ring-clip-r">
            <view class="ring-half" :style="{ transform: 'rotate(' + ringRightDeg + 'deg)' }" />
          </view>
          <view class="ring-clip ring-clip-l">
            <view class="ring-half" :style="{ transform: 'rotate(' + ringLeftDeg + 'deg)' }" />
          </view>
          <view class="ring-center" />
          <text class="ring-text">{{ budgetPercent }}%</text>
        </view>
        <text class="ring-label">预算</text>
        </view>
      </view>
    </MoonaCard>

    <!-- 功能入口 -->
    <view class="widget-row">
      <!-- 您的账单 -->
      <view class="widget-card widget-bills" @tap="goBills">
        <view class="widget-glass" />
        <view class="widget-content">
          <view class="widget-text">
            <text class="widget-title">您的账单</text>
            <text class="widget-sub">收支明细查询</text>
          </view>
          <view class="widget-icon-area widget-icon-bills">
            <view class="wbl-receipt" />
            <view class="wbl-line wbl-line-1" />
            <view class="wbl-line wbl-line-2" />
            <view class="wbl-line wbl-line-3" />
          </view>
        </view>
        <view class="widget-shimmer" />
      </view>

      <!-- AI 分析 -->
      <view class="widget-card widget-ai" @tap="goAiChat">
        <view class="widget-glass" />
        <view class="widget-content">
          <view class="widget-text">
            <text class="widget-title">AI分析</text>
            <text class="widget-sub">消费趋势洞察</text>
          </view>
          <view class="widget-icon-area widget-icon-ai">
            <view class="wi-orb" />
            <view class="wi-ring" />
            <view class="wi-bar wi-bar-1" />
            <view class="wi-bar wi-bar-2" />
            <view class="wi-bar wi-bar-3" />
          </view>
        </view>
        <view class="widget-shimmer" />
      </view>

      <!-- 财富成长 -->
      <view class="widget-card widget-wealth" @tap="goSavingGoals">
        <view class="widget-glass" />
        <view class="widget-content">
          <view class="widget-text">
            <text class="widget-title">财富成长</text>
            <text class="widget-sub">资产持续增长</text>
          </view>
          <view class="widget-icon-area widget-icon-wealth">
            <view class="ww-coin" />
            <view class="ww-arrow" />
            <view class="ww-curve" />
          </view>
        </view>
        <view class="widget-shimmer" />
      </view>

      <!-- 预算管理 -->
      <view class="widget-card widget-budget" @tap="goBudget">
        <view class="widget-glass" />
        <view class="widget-content">
          <view class="widget-text">
            <text class="widget-title">预算管理</text>
            <text class="widget-sub">合理规划支出</text>
          </view>
          <view class="widget-icon-area widget-icon-budget">
            <view class="wb-ring-track" />
            <view class="wb-ring-fill" />
            <view class="wb-dot" />
            <view class="wb-bar wb-bar-1" />
            <view class="wb-bar wb-bar-2" />
          </view>
        </view>
        <view class="widget-shimmer" />
      </view>
    </view>

    <!-- AI 提醒 -->
    <MoonaCard class="ai-card" @tap="goAiChat">
      <view class="ai-header">
        <view class="ai-badge">
          <text>AI 提醒</text>
        </view>
        <view class="ai-dot" :style="{ background: insightColor }" />
      </view>
      <text class="ai-content">{{ insightText }}</text>
    </MoonaCard>

    <!-- 消费排行 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">消费分类排行</text>
        <text class="section-sub">连续记账 {{ summary.streakDays }} 天</text>
      </view>
      <MoonaCard>
        <view v-if="bars.length">
          <view v-for="bar in bars" :key="bar.label" class="bar-item">
            <text class="bar-name">{{ bar.label }}</text>
            <view class="bar-track">
              <view class="bar-fill" :style="{ width: barWidth(bar) + '%' }" />
            </view>
            <text class="bar-pct">{{ bar.value }}%</text>
          </view>
        </view>
        <view v-else class="empty">
          <text>暂无消费数据，记一笔试试</text>
        </view>
      </MoonaCard>
    </view>

    <!-- 最近账单 -->
    <view class="section" @tap="goBills">
      <view class="section-header">
        <text class="section-title">最近 3 笔</text>
        <text class="section-sub">本月 ¥{{ formatAmount(summary.monthExpense) }}</text>
      </view>
      <MoonaCard>
        <view v-if="summary.recentTransactions.length">
          <view v-for="(item, idx) in summary.recentTransactions" :key="item.id" :class="['bill-row', { 'bill-border': idx < summary.recentTransactions.length - 1 }]">
            <view class="bill-icon" :style="{ background: item.category?.color || '#eef2f6' }">
              <text>{{ item.category?.icon || '◎' }}</text>
            </view>
            <view class="bill-info">
              <text class="bill-name">{{ item.remark || item.category?.name || '账单' }}</text>
            </view>
            <text :class="['bill-amount', item.type]">{{ formatSignedMoney(item.amount, item.type) }}</text>
          </view>
        </view>
        <view v-else class="empty">
          <text>还没有账单记录</text>
        </view>
      </MoonaCard>
    </view>

    <!-- 预算进度 -->
    <view v-if="budgetOverview && budgetOverview.totalBudget > 0" class="section" @tap="goBudget">
      <view class="section-header">
        <text class="section-title">预算进度</text>
        <text class="section-sub">{{ budgetOverview.isOverspent ? '⚠️ 已超支' : '进行中' }}</text>
      </view>
      <MoonaCard>
        <view class="budget-progress">
          <view class="bp-info">
            <text class="bp-spent">¥{{ budgetOverview.totalSpent.toFixed(0) }}</text>
            <text class="bp-total"> / ¥{{ budgetOverview.totalBudget.toFixed(0) }}</text>
          </view>
          <view class="bp-track">
            <view
              class="bp-fill"
              :class="{ danger: budgetOverview.isOverspent }"
              :style="{ width: Math.min(budgetOverview.totalPercent, 100) + '%' }"
            />
          </view>
          <text class="bp-remain">
            {{ budgetOverview.isOverspent ? '超支' : '剩余' }} ¥{{ Math.abs(budgetOverview.totalRemaining).toFixed(0) }}
          </text>
        </view>
      </MoonaCard>
    </view>

    <!-- 财富成长 -->
    <view class="section" @tap="goSavingGoals">
      <view class="section-header">
        <text class="section-title">财富成长</text>
        <text class="section-sub" v-if="wealthOverview">{{ wealthOverview.wealthScore }}分</text>
      </view>
      <MoonaCard>
        <view v-if="wealthOverview" class="wealth-mini">
          <view class="wealth-mini-row">
            <view class="wealth-mini-item">
              <text class="wm-label">本月结余</text>
              <text class="wm-value">¥{{ wealthOverview.monthSurplus.toFixed(0) }}</text>
            </view>
            <view class="wealth-mini-item">
              <text class="wm-label">AI评分</text>
              <text class="wm-value wm-score">{{ wealthOverview.wealthScore }}</text>
            </view>
          </view>
          <view v-if="topGoal" class="wealth-mini-goal">
            <view class="goal-icon-sm" :style="{ background: topGoal.color + '20' }">
              <text>{{ topGoal.icon }}</text>
            </view>
            <view class="goal-detail">
              <text class="goal-name-sm">{{ topGoal.name }}</text>
              <view class="goal-bar-track">
                <view class="goal-bar-fill" :style="{ width: topGoal.percent + '%', background: topGoal.color }" />
              </view>
              <text class="goal-sub-sm">¥{{ topGoal.currentAmount.toFixed(0) }} / ¥{{ topGoal.targetAmount.toFixed(0) }}</text>
            </view>
          </view>
        </view>
        <view v-else class="empty"><text>点击查看财富成长</text></view>
      </MoonaCard>
    </view>

    <!-- 成长进度 -->
    <view v-if="badges.length" class="section" @tap="goGrowth">
      <view class="section-header">
        <text class="section-title">成长进度</text>
        <text class="section-sub">{{ badgeEarnedCount }}/{{ badgeTotal }} 勋章</text>
      </view>
      <MoonaCard>
        <view class="growth-mini">
          <view class="growth-badges">
            <view v-for="b in badges.slice(0, 6)" :key="b.id" :class="['growth-badge', { earned: b.earned }]">
              <text>{{ b.icon }}</text>
            </view>
          </view>
          <view class="growth-bar-track">
            <view class="growth-bar-fill" :style="{ width: (badgeTotal ? badgeEarnedCount / badgeTotal * 100 : 0) + '%' }" />
          </view>
        </view>
      </MoonaCard>
    </view>

    <AppTabbar current="index" />
  </PageShell>
  <LoginModal :visible="showLogin" @close="showLogin = false" @success="onLoginSuccess" />
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import PageShell from '@/components/PageShell.vue';
import MoonaCard from '@/components/MoonaCard.vue';
import AppTabbar from '@/components/AppTabbar.vue';
import LoginModal from '@/components/LoginModal.vue';
import { useFinanceStore } from '@/stores/finance';
import { useAiStore } from '@/stores/ai';
import { useAuthStore } from '@/stores/auth';
import { useMoney } from '@/composables/useMoney';
import { getApiBase, request } from '@/utils/request';
import { budgetApi } from '@/api/budgets';
import { wealthApi } from '@/api/wealth';
import { growthApi } from '@/api/growth';
import type { BudgetOverview, WealthOverview, WealthGoal, Badge } from '@/types/domain';

const finance = useFinanceStore();
const aiStore = useAiStore();
const authStore = useAuthStore();
const { formatMoney, formatSignedMoney } = useMoney();

const showLogin = ref(false);
const budgetOverview = ref<BudgetOverview | null>(null);
const wealthOverview = ref<WealthOverview | null>(null);
const topGoal = ref<WealthGoal | null>(null);
const badges = ref<Badge[]>([]);
const badgeEarnedCount = computed(() => badges.value.filter((b) => b.earned).length);
const badgeTotal = computed(() => badges.value.length);

const userName = computed(() => authStore.user?.nickname || '小满');
const aiGreeting = ref('今天过得怎么样？');
const userAvatar = computed(() => {
  const url = authStore.user?.avatarUrl;
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${getApiBase().replace('/api', '')}${url}`;
});

const summary = computed(() => finance.dashboard || {
  todayExpense: 0,
  monthExpense: 0,
  monthIncome: 0,
  monthlyBudget: 5000,
  streakDays: 0,
  recentTransactions: []
});

const budgetPercent = computed(() => {
  const budget = summary.value.monthlyBudget || 5000;
  return Math.min(99, Math.round((summary.value.monthExpense / budget) * 100));
});

const ringRightDeg = computed(() => {
  const pct = budgetPercent.value;
  return pct <= 50 ? (pct / 50) * 180 : 180;
});
const ringLeftDeg = computed(() => {
  const pct = budgetPercent.value;
  return pct > 50 ? ((pct - 50) / 50) * 180 : 0;
});

const insightText = computed(() => aiStore.insight?.text || '记一笔账，让 AI 更了解你');
const insightType = computed(() => aiStore.insight?.type || 'tip');
const insightColorMap: Record<string, string> = {
  tip: '#00d4c8', warning: '#ff9f43', praise: '#7c8cff', info: '#667085'
};
const insightColor = computed(() => insightColorMap[insightType.value] || '#00d4c8');

const bars = computed(() => {
  const stats = finance.statistics;
  if (!stats?.categoryRatio?.length) return [];
  const totalAmount = stats.categoryRatio.reduce((sum, item) => sum + item.amount, 0) || 1;
  return stats.categoryRatio.slice(0, 4).map((item) => ({
    label: item.category,
    value: Math.round((item.amount / totalAmount) * 100),
    amount: item.amount,
  }));
});

function barWidth(bar: { value: number; amount: number }) {
  const maxAmount = bars.value.length ? bars.value[0].amount : 1;
  return Math.round((bar.amount / maxAmount) * 100);
}

function formatAmount(val: number) {
  return val.toFixed(2);
}

function goAiChat() {
  uni.switchTab({ url: '/pages/ai/index' });
}

function goProfile() {
  uni.switchTab({ url: '/pages/profile/index' });
}

function goBudget() {
  uni.navigateTo({ url: '/pages/budget/index' });
}

function goSavingGoals() {
  uni.navigateTo({ url: '/pages/saving-goals/index' });
}

function goBills() {
  uni.navigateTo({ url: '/pages/bills/index' });
}

function goGrowth() {
  uni.navigateTo({ url: '/pages/growth/index' });
}

function loadData() {
  Promise.all([
    authStore.loadProfile(),
    finance.loadCategories(),
    finance.loadDashboard(),
    finance.loadStatistics(),
    aiStore.loadInsight(),
    budgetApi.overview().then((r) => { budgetOverview.value = r; }).catch(() => {}),
    wealthApi.overview().then((r) => {
      wealthOverview.value = r;
      topGoal.value = r.goals.find((g: WealthGoal) => !g.completed) || r.goals[0] || null;
    }).catch(() => {}),
    growthApi.listBadges().then((r) => { badges.value = r; }).catch(() => {}),
  ]).catch(() => {});
  request<{ greeting: string }>('/ai/greeting').then((r) => {
    if (r.greeting) aiGreeting.value = r.greeting;
  }).catch(() => {});
}

function onLoginSuccess() {
  showLogin.value = false;
  loadData();
}

function onShowLogin() {
  showLogin.value = true;
}

onMounted(() => {
  // #ifdef MP-WEIXIN
  uni.hideTabBar();
  // #endif
  uni.$on('show-login', onShowLogin);
  if (authStore.isLoggedIn) {
    loadData();
  } else {
    showLogin.value = true;
  }
});

onUnmounted(() => {
  uni.$off('show-login', onShowLogin);
});
</script>

<style scoped>
/* 顶部问候 */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8rpx;
}

.greeting {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: #1e1e1e;
}

.sub-text {
  display: block;
  margin-top: 4rpx;
  font-size: 26rpx;
  color: #88909b;
}


/* Hero 卡片 */
.hero-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero-label {
  display: block;
  font-size: 24rpx;
  color: #667085;
}

.hero-amount {
  display: block;
  margin-top: 8rpx;
  font-size: 56rpx;
  font-weight: 800;
  color: #1e1e1e;
  letter-spacing: -2rpx;
}

.hero-tags {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
}

.tag {
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  background: #f0f1f3;
  font-size: 22rpx;
  color: #667085;
}

.tag.income {
  background: rgba(0, 212, 200, 0.1);
  color: #00a99f;
}

.hero-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.budget-ring {
  position: relative;
  width: 120rpx;
  height: 120rpx;
}

.ring-track {
  position: absolute;
  top: 0; left: 0;
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: #eef2f6;
}

.ring-clip {
  position: absolute;
  top: 0; left: 0;
  width: 120rpx;
  height: 120rpx;
  overflow: hidden;
}

.ring-clip-r {
  clip: rect(0, 120rpx, 120rpx, 60rpx);
}

.ring-clip-l {
  clip: rect(0, 60rpx, 120rpx, 0);
}

.ring-half {
  position: absolute;
  top: 0; left: 0;
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: #00d4c8;
  clip: rect(0, 60rpx, 120rpx, 0);
}

.ring-clip-r .ring-half {
  clip: rect(0, 120rpx, 120rpx, 60rpx);
}

.ring-center {
  position: absolute;
  top: 15rpx; left: 15rpx;
  width: 90rpx;
  height: 90rpx;
  border-radius: 50%;
  background: #fff;
}

.ring-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 28rpx;
  font-weight: 800;
  color: #1e1e1e;
  z-index: 1;
}

.ring-label {
  margin-top: 6rpx;
  font-size: 20rpx;
  color: #88909b;
}

/* 功能卡片 */
/* ━━━ AI 功能入口 Widget ━━━ */
.widget-row {
  display: flex;
  gap: 12rpx;
  margin: 28rpx 0;
}

.widget-card {
  flex: 1;
  position: relative;
  height: 120rpx;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease;
}

.widget-card:active {
  transform: scale(0.96);
}

.widget-glass {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1rpx solid rgba(255, 255, 255, 0.5);
  pointer-events: none;
}

.widget-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20rpx 16rpx 16rpx;
}

.widget-text {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.widget-title {
  font-size: 26rpx;
  font-weight: 800;
  letter-spacing: 0.5rpx;
}

.widget-sub {
  font-size: 16rpx;
  font-weight: 500;
  opacity: 0.7;
}

/* 流光效果 */
.widget-shimmer {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  z-index: 1;
  border-radius: 24rpx;
  pointer-events: none;
  background: linear-gradient(
    115deg,
    transparent 30%,
    rgba(255, 255, 255, 0.35) 48%,
    rgba(255, 255, 255, 0.12) 52%,
    transparent 70%
  );
  background-size: 300% 100%;
  animation: shimmer-flow 6s ease-in-out infinite;
}

@keyframes shimmer-flow {
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
}

/* 图标区域 */
.widget-icon-area {
  position: absolute;
  right: 12rpx;
  bottom: 14rpx;
  width: 68rpx;
  height: 68rpx;
}

/* ── AI 分析卡片 ── */
.widget-ai {
  background: linear-gradient(145deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.28));
  border-bottom: 4rpx solid rgba(139, 92, 246, 0.35);
}
.widget-ai .widget-title { color: #6d28d9; }
.widget-ai .widget-sub { color: #7c3aed; }

.wi-orb {
  position: absolute;
  right: 6rpx;
  top: 4rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(99, 102, 241, 0.25));
  box-shadow: 0 0 16rpx rgba(139, 92, 246, 0.25);
  animation: ai-breathe 3s ease-in-out infinite;
}

@keyframes ai-breathe {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.12); opacity: 1; }
}

.wi-ring {
  position: absolute;
  right: 0;
  top: -2rpx;
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(139, 92, 246, 0.15);
}

.wi-bar {
  position: absolute;
  bottom: 0;
  width: 10rpx;
  border-radius: 5rpx;
  background: linear-gradient(to top, rgba(139, 92, 246, 0.35), rgba(99, 102, 241, 0.15));
}
.wi-bar-1 { left: 8rpx; height: 28rpx; }
.wi-bar-2 { left: 24rpx; height: 40rpx; }
.wi-bar-3 { left: 40rpx; height: 20rpx; }

/* ── 财富成长卡片 ── */
.widget-wealth {
  background: linear-gradient(145deg, rgba(245, 208, 120, 0.22), rgba(212, 175, 55, 0.2));
  border-bottom: 4rpx solid rgba(212, 175, 55, 0.3);
}
.widget-wealth .widget-title { color: #92700c; }
.widget-wealth .widget-sub { color: #a16207; }

.ww-coin {
  position: absolute;
  right: 10rpx;
  top: 8rpx;
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(234, 194, 82, 0.5), rgba(212, 175, 55, 0.3));
  border: 2rpx solid rgba(212, 175, 55, 0.25);
  box-shadow: 0 2rpx 12rpx rgba(212, 175, 55, 0.15);
}

.ww-arrow {
  position: absolute;
  right: 28rpx;
  top: 16rpx;
  width: 16rpx;
  height: 16rpx;
  border-right: 3rpx solid rgba(180, 140, 20, 0.35);
  border-top: 3rpx solid rgba(180, 140, 20, 0.35);
  transform: rotate(-45deg);
}

.ww-curve {
  position: absolute;
  bottom: 4rpx;
  left: 0;
  right: 0;
  height: 32rpx;
  border-radius: 0 32rpx 0 0;
  border-top: 3rpx solid rgba(212, 175, 55, 0.2);
  border-right: 3rpx solid rgba(212, 175, 55, 0.2);
}

/* ── 您的账单卡片 ── */
.widget-bills {
  background: linear-gradient(145deg, rgba(16, 185, 129, 0.18), rgba(5, 150, 105, 0.25));
  border-bottom: 4rpx solid rgba(5, 150, 105, 0.3);
}
.widget-bills .widget-title { color: #047857; }
.widget-bills .widget-sub { color: #059669; }

.wbl-receipt {
  position: absolute;
  right: 10rpx;
  top: 0;
  width: 28rpx;
  height: 36rpx;
  border-radius: 4rpx 4rpx 0 0;
  background: rgba(16, 185, 129, 0.18);
  border-bottom: 4rpx dashed rgba(5, 150, 105, 0.2);
}

.wbl-line {
  position: absolute;
  height: 5rpx;
  border-radius: 3rpx;
  background: linear-gradient(to right, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.12));
}
.wbl-line-1 { right: 0; bottom: 22rpx; width: 44rpx; }
.wbl-line-2 { right: 6rpx; bottom: 12rpx; width: 32rpx; }
.wbl-line-3 { right: 2rpx; bottom: 2rpx; width: 38rpx; }

/* ── 预算管理卡片 ── */
.widget-budget {
  background: linear-gradient(145deg, rgba(56, 189, 248, 0.18), rgba(14, 165, 233, 0.25));
  border-bottom: 4rpx solid rgba(14, 165, 233, 0.3);
}
.widget-budget .widget-title { color: #0369a1; }
.widget-budget .widget-sub { color: #0284c7; }

.wb-ring-track {
  position: absolute;
  right: 8rpx;
  top: 2rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(56, 189, 248, 0.12);
}

.wb-ring-fill {
  position: absolute;
  right: 8rpx;
  top: 2rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 4rpx solid transparent;
  border-top-color: rgba(14, 165, 233, 0.4);
  border-right-color: rgba(14, 165, 233, 0.4);
  transform: rotate(30deg);
}

.wb-dot {
  position: absolute;
  right: 38rpx;
  top: 4rpx;
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: rgba(14, 165, 233, 0.4);
}

.wb-bar {
  position: absolute;
  bottom: 2rpx;
  height: 6rpx;
  border-radius: 3rpx;
  background: linear-gradient(to right, rgba(56, 189, 248, 0.3), rgba(14, 165, 233, 0.15));
}
.wb-bar-1 { left: 0; width: 42rpx; }
.wb-bar-2 { left: 0; bottom: 14rpx; width: 28rpx; }

/* AI 卡片 */
.ai-card {
  background: rgba(255, 255, 255, 0.9) !important;
}

.ai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ai-badge {
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  background: rgba(0, 212, 200, 0.1);
  font-size: 22rpx;
  color: #00a99f;
  font-weight: 600;
}

.ai-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
}

.ai-content {
  display: block;
  margin-top: 16rpx;
  font-size: 28rpx;
  color: #344054;
  line-height: 1.6;
}

/* 通用区块 */
.section {
  margin-top: 32rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4rpx;
  padding: 0 4rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1e1e1e;
}

.section-sub {
  font-size: 24rpx;
  color: #88909b;
}

/* 条形图 */
.bar-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 14rpx 0;
}

.bar-name {
  width: 80rpx;
  font-size: 24rpx;
  color: #344054;
  flex-shrink: 0;
}

.bar-track {
  flex: 1;
  height: 16rpx;
  border-radius: 8rpx;
  background: #eef2f6;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 8rpx;
  background: linear-gradient(90deg, #00d4c8, #7c8cff);
  transition: width 0.5s ease;
}

.bar-pct {
  width: 60rpx;
  text-align: right;
  font-size: 22rpx;
  color: #88909b;
  flex-shrink: 0;
}

/* 账单行 */
.bill-row {
  display: flex;
  align-items: center;
  padding: 18rpx 0;
}

.bill-border {
  border-bottom: 1rpx solid #f0f1f3;
}

.bill-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border-radius: 22rpx;
  flex-shrink: 0;
  font-size: 28rpx;
}

.bill-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  margin-left: 20rpx;
}

.bill-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #1e1e1e;
}

.bill-cat {
  font-size: 22rpx;
  color: #88909b;
}

.bill-amount {
  font-size: 30rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.bill-amount.expense {
  color: #1e1e1e;
}

.bill-amount.income {
  color: #00a99f;
}

.empty {
  padding: 40rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: #88909b;
}

/* 预算进度 */
.budget-progress {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.bp-info {
  display: flex;
  align-items: baseline;
}

.bp-spent {
  font-size: 36rpx;
  font-weight: 800;
  color: #1e1e1e;
}

.bp-total {
  font-size: 24rpx;
  color: #88909b;
}

.bp-track {
  height: 14rpx;
  border-radius: 7rpx;
  background: #f0f1f3;
  overflow: hidden;
}

.bp-fill {
  height: 100%;
  border-radius: 7rpx;
  background: linear-gradient(90deg, #00d4c8, #34d399);
  transition: width 0.5s;
}

.bp-fill.danger {
  background: linear-gradient(90deg, #ff6b6b, #ee5a24);
}

.bp-remain {
  font-size: 24rpx;
  color: #00a99f;
  text-align: right;
}

/* 财富成长卡片 */
.wealth-mini {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.wealth-mini-row {
  display: flex;
  gap: 32rpx;
}

.wealth-mini-item {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.wm-label {
  font-size: 22rpx;
  color: #88909b;
}

.wm-value {
  font-size: 32rpx;
  font-weight: 700;
  color: #1e1e1e;
}

.wm-score {
  color: #00a99f;
}

.wealth-mini-goal {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid #f0f1f3;
}

.goal-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.goal-icon-sm {
  width: 64rpx;
  height: 64rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  flex-shrink: 0;
}

.goal-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.goal-name-sm {
  font-size: 28rpx;
  font-weight: 600;
  color: #1e1e1e;
}

.goal-bar-track {
  height: 12rpx;
  border-radius: 6rpx;
  background: #f0f1f3;
  overflow: hidden;
}

.goal-bar-fill {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.5s;
}

.goal-sub-sm {
  font-size: 22rpx;
  color: #88909b;
}

/* 成长进度 */
.growth-mini {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.growth-badges {
  display: flex;
  gap: 12rpx;
}
.growth-badge {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #f0f1f3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  opacity: 0.4;
}
.growth-badge.earned {
  background: rgba(0, 212, 200, 0.1);
  opacity: 1;
}
.growth-bar-track {
  height: 10rpx;
  border-radius: 5rpx;
  background: #f0f1f3;
  overflow: hidden;
}
.growth-bar-fill {
  height: 100%;
  border-radius: 5rpx;
  background: linear-gradient(90deg, #00d4c8, #7cbcff);
  transition: width 0.3s;
}

</style>
