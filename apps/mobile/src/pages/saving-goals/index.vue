<template>
  <PageShell>
    <!-- 导航 -->
    <view class="nav">
      <view class="nav-back" @tap="goBack">
        <view class="back-glass" />
        <image class="back-icon" :src="backIcon" />
      </view>
      <text class="nav-title">财富成长</text>
      <view style="width:68rpx;" />
    </view>

    <!-- Hero 区 -->
    <view class="hero">
      <view class="hero-glass">
        <view class="hero-top">
          <view class="hero-left">
            <text class="hero-label">本月预计结余</text>
            <view class="hero-amount-row">
              <text class="hero-amount">¥ {{ overview?.monthSurplus?.toFixed(0) || '0' }}</text>
              <view v-if="overview && overview.scoreChange !== 0" :class="['hero-change', overview.scoreChange > 0 ? 'up' : 'down']">
                <text>{{ overview.scoreChange > 0 ? '↑' : '↓' }} {{ Math.abs(overview.scoreChange) }}</text>
              </view>
            </view>
            <text class="hero-status">{{ overview?.statusText || '开始记账，了解你的财富' }}</text>
          </view>
          <view class="hero-right">
            <view class="score-ring">
              <view class="score-ring-bg" />
              <view class="score-ring-fill" :style="{ background: scoreRingGradient }" />
              <view class="score-ring-center">
                <text class="score-num">{{ overview?.wealthScore || 0 }}</text>
                <text class="score-label">分</text>
              </view>
            </view>
            <text class="score-title">财富评分</text>
          </view>
        </view>
        <view class="hero-meta">
          <view class="meta-item">
            <text class="meta-label">收入</text>
            <text class="meta-value">¥{{ overview?.monthIncome?.toFixed(0) || '0' }}</text>
          </view>
          <view class="meta-divider" />
          <view class="meta-item">
            <text class="meta-label">支出</text>
            <text class="meta-value">¥{{ overview?.monthExpense?.toFixed(0) || '0' }}</text>
          </view>
          <view class="meta-divider" />
          <view class="meta-item">
            <text class="meta-label">结余率</text>
            <text class="meta-value">{{ overview?.surplusRate || 0 }}%</text>
          </view>
        </view>
      </view>
    </view>

    <!-- AI米粒 建议 -->
    <view class="section">
      <text class="section-title">AI米粒 成长建议</text>
      <MoonaCard v-if="advice">
        <text class="advice-summary">{{ advice.summary }}</text>
        <view class="advice-list">
          <view v-for="(s, i) in advice.suggestions" :key="i" class="advice-item">
            <text class="advice-dot">•</text>
            <text class="advice-text">{{ s }}</text>
          </view>
        </view>
        <view class="advice-encourage">
          <text>{{ advice.encouragement }}</text>
        </view>
      </MoonaCard>
      <MoonaCard v-else>
        <view class="advice-skeleton">
          <view class="sk-line sk-w80" />
          <view class="sk-line sk-w100" />
          <view class="sk-line sk-w60" />
          <view class="sk-line sk-w90" />
        </view>
      </MoonaCard>
    </view>

    <!-- 结余趋势 -->
    <view class="section">
      <text class="section-title">结余趋势</text>
      <MoonaCard>
        <view v-if="overview?.trend?.length" class="trend-chart">
          <view v-for="item in overview.trend" :key="item.month" class="trend-col">
            <text class="trend-val" :class="{ negative: item.surplus < 0 }">
              {{ item.surplus >= 0 ? '+' : '' }}{{ item.surplus.toFixed(0) }}
            </text>
            <view class="trend-bar-wrap">
              <view
                class="trend-bar"
                :class="{ negative: item.surplus < 0 }"
                :style="{ height: barHeight(item.surplus) + '%' }"
              />
            </view>
            <text class="trend-month">{{ item.month.slice(5) }}月</text>
          </view>
        </view>
        <view v-else class="empty"><text>记账满一个月后展示趋势</text></view>
      </MoonaCard>
    </view>

    <!-- 目标列表 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">我的目标</text>
        <view class="add-btn" @tap="openCreate"><text>+ 新建</text></view>
      </view>

      <view v-if="goals.length" class="goals-list">
        <MoonaCard v-for="goal in goals" :key="goal.id" class="goal-card">
          <view class="goal-top">
            <view class="goal-icon-wrap" :style="{ background: goal.color + '18' }">
              <text class="goal-icon">{{ goal.icon }}</text>
            </view>
            <view class="goal-info">
              <text class="goal-name">{{ goal.name }}</text>
              <text class="goal-predict" v-if="goal.predictDate && !goal.completed">
                预计 {{ goal.predictDate }} 完成
              </text>
              <text class="goal-predict" v-else-if="goal.completed">已达成 🎉</text>
            </view>
            <view class="goal-pct-ring">
              <view class="mini-ring-bg" />
              <view class="mini-ring-fill" :style="{ background: miniRingGradient(goal) }" />
              <view class="mini-ring-center">
                <text class="mini-ring-num">{{ goal.percent }}</text>
                <text class="mini-ring-pct">%</text>
              </view>
            </view>
          </view>
          <view class="goal-bottom">
            <view class="goal-amounts">
              <text class="goal-current" :style="{ color: goal.color }">¥{{ goal.currentAmount.toFixed(0) }}</text>
              <text class="goal-sep">/</text>
              <text class="goal-target">¥{{ goal.targetAmount.toFixed(0) }}</text>
            </view>
            <view class="goal-bar-track">
              <view class="goal-bar-fill" :style="{ width: goal.percent + '%', background: goal.color }" />
            </view>
            <view class="goal-footer">
              <text class="goal-alloc">分配 {{ goal.allocPercent }}% 结余</text>
              <view class="goal-del" @tap.stop="removeGoal(goal.id)"><text>删除</text></view>
            </view>
          </view>
        </MoonaCard>
      </view>

      <MoonaCard v-else class="empty-goals">
        <view class="empty-center">
          <text class="empty-icon">🎯</text>
          <text class="empty-text">设一个目标，让财富有方向</text>
          <view class="empty-btn" @tap="openCreate"><text>创建目标</text></view>
        </view>
      </MoonaCard>
    </view>

    <!-- 创建目标弹窗 -->
    <view v-if="showCreate" class="dialog-mask" @tap="showCreate = false">
      <view class="dialog-panel" @tap.stop>
        <text class="dialog-title">新建目标</text>

        <view class="form-group">
          <text class="form-label">目标名称</text>
          <input v-model="createForm.name" placeholder="例如：MacBook Pro" class="form-input" />
        </view>

        <view class="form-group">
          <text class="form-label">目标金额</text>
          <input v-model="createForm.targetAmount" type="digit" placeholder="例如：15000" class="form-input" />
        </view>

        <view class="form-group">
          <text class="form-label">截止日期（可选）</text>
          <picker mode="date" :value="createForm.deadline" @change="onDateChange">
            <view class="form-input picker-display">
              <text>{{ createForm.deadline || '选择日期' }}</text>
            </view>
          </picker>
        </view>

        <view class="form-group">
          <text class="form-label">结余分配比例</text>
          <view class="alloc-row">
            <slider
              :value="createForm.allocPercent"
              :min="10"
              :max="100"
              :step="10"
              activeColor="#00d4c8"
              @change="onAllocChange"
              class="alloc-slider"
            />
            <text class="alloc-val">{{ createForm.allocPercent }}%</text>
          </view>
        </view>

        <view class="form-group">
          <text class="form-label">图标</text>
          <view class="icon-grid">
            <view v-for="ic in goalIcons" :key="ic" :class="['icon-item', { active: createForm.icon === ic }]" @tap="createForm.icon = ic">
              <text>{{ ic }}</text>
            </view>
          </view>
        </view>

        <view class="form-group">
          <text class="form-label">颜色</text>
          <view class="color-grid">
            <view v-for="cl in goalColors" :key="cl" :class="['color-item', { active: createForm.color === cl }]" :style="{ background: cl }" @tap="createForm.color = cl" />
          </view>
        </view>

        <view class="dialog-actions">
          <view class="dialog-cancel" @tap="showCreate = false"><text>取消</text></view>
          <view class="dialog-confirm" @tap="submitCreate"><text>创建</text></view>
        </view>
      </view>
    </view>

    <view style="height: 40rpx;" />
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { backIcon } from '@/utils/icons';
import PageShell from '@/components/PageShell.vue';
import MoonaCard from '@/components/MoonaCard.vue';
import { wealthApi } from '@/api/wealth';
import type { WealthOverview, WealthGoal, WealthAdvice } from '@/types/domain';

const overview = ref<WealthOverview | null>(null);
const goals = computed(() => overview.value?.goals || []);
const advice = ref<WealthAdvice | null>(null);
const showCreate = ref(false);

const goalIcons = ['🎯', '✈️', '🏠', '🚗', '💻', '📱', '🎓', '💍', '🎮', '🏖️', '💪', '🎁'];
const goalColors = ['#00d4c8', '#34d399', '#6366f1', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'];

const createForm = ref({
  name: '',
  targetAmount: '',
  deadline: '',
  icon: '🎯',
  color: '#00d4c8',
  allocPercent: 100,
});

const scoreRingGradient = computed(() => {
  const score = overview.value?.wealthScore || 0;
  const deg = (score / 100) * 360;
  return `conic-gradient(#00d4c8 0deg, #34d399 ${deg}deg, #f0f1f3 ${deg}deg, #f0f1f3 360deg)`;
});

function miniRingGradient(goal: WealthGoal) {
  const deg = (goal.percent / 100) * 360;
  return `conic-gradient(${goal.color} 0deg, ${goal.color} ${deg}deg, #f0f1f3 ${deg}deg, #f0f1f3 360deg)`;
}

function barHeight(surplus: number) {
  if (!overview.value?.trend?.length) return 0;
  const maxAbs = Math.max(...overview.value.trend.map((t) => Math.abs(t.surplus)), 1);
  return Math.round((Math.abs(surplus) / maxAbs) * 100);
}

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) { uni.navigateBack(); }
  else { uni.switchTab({ url: '/pages/index/index' }); }
}

function onDateChange(e: any) { createForm.value.deadline = e.detail.value; }
function onAllocChange(e: any) { createForm.value.allocPercent = e.detail.value; }

function openCreate() {
  createForm.value = { name: '', targetAmount: '', deadline: '', icon: '🎯', color: '#00d4c8', allocPercent: 100 };
  showCreate.value = true;
}

async function loadData() {
  try {
    overview.value = await wealthApi.overview();
  } catch (e) {
    console.error('Load wealth overview failed:', e);
  }
}

async function loadAdvice() {
  try {
    advice.value = await wealthApi.getAdvice();
    await loadData();
  } catch { /* ignore */ }
}

async function doRefresh() {
  uni.showLoading({ title: '计算中...' });
  try {
    overview.value = await wealthApi.refresh();
    uni.showToast({ title: '已更新', icon: 'success' });
    loadAdvice();
  } catch {
    uni.showToast({ title: '更新失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
}

async function submitCreate() {
  const amount = parseFloat(createForm.value.targetAmount);
  if (!createForm.value.name.trim()) { uni.showToast({ title: '请输入目标名称', icon: 'none' }); return; }
  if (!amount || amount <= 0) { uni.showToast({ title: '请输入有效金额', icon: 'none' }); return; }

  try {
    await wealthApi.createGoal({
      name: createForm.value.name,
      targetAmount: amount,
      deadline: createForm.value.deadline || undefined,
      icon: createForm.value.icon,
      color: createForm.value.color,
      allocPercent: createForm.value.allocPercent,
    });
    showCreate.value = false;
    await loadData();
    uni.showToast({ title: '创建成功', icon: 'success' });
  } catch (e: any) {
    uni.showToast({ title: e.message || '创建失败', icon: 'none' });
  }
}

async function removeGoal(goalId: string) {
  try {
    await wealthApi.removeGoal(goalId);
    await loadData();
    uni.showToast({ title: '已删除', icon: 'success' });
  } catch (e: any) {
    uni.showToast({ title: e.message || '删除失败', icon: 'none' });
  }
}

onMounted(() => {
  loadAdvice();
});
</script>

<style scoped>
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8rpx 0;
}

.nav-back,
.nav-action {
  position: relative;
  width: 68rpx;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.back-glass {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06),
              inset 0 1rpx 0 rgba(255, 255, 255, 0.8);
}

.back-icon {
  position: relative;
  z-index: 1;
  width: 36rpx;
  height: 36rpx;
  margin-left: -2rpx;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1e1e1e;
}

/* ===== Hero ===== */
.hero {
  margin-top: 20rpx;
}

.hero-glass {
  padding: 32rpx;
  border-radius: 28rpx;
  background: linear-gradient(145deg, rgba(0, 212, 200, 0.08), rgba(52, 211, 153, 0.06));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1rpx solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.04);
}

.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.hero-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.hero-label {
  font-size: 24rpx;
  color: #88909b;
}

.hero-amount-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.hero-amount {
  font-size: 48rpx;
  font-weight: 800;
  color: #1e1e1e;
}

.hero-change {
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.hero-change.up {
  background: rgba(0, 212, 200, 0.12);
  color: #00a99f;
}

.hero-change.down {
  background: rgba(255, 107, 107, 0.12);
  color: #ff6b6b;
}

.hero-status {
  font-size: 24rpx;
  color: #00a99f;
  font-weight: 500;
  margin-top: 4rpx;
}

/* Score Ring */
.hero-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.score-ring {
  position: relative;
  width: 120rpx;
  height: 120rpx;
}

.score-ring-bg {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  border-radius: 50%;
  background: #f0f1f3;
}

.score-ring-fill {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  border-radius: 50%;
}

.score-ring-center {
  position: absolute;
  top: 12rpx; right: 12rpx; bottom: 12rpx; left: 12rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rpx;
}

.score-num {
  font-size: 32rpx;
  font-weight: 800;
  color: #00a99f;
}

.score-label {
  font-size: 18rpx;
  color: #88909b;
  margin-top: 4rpx;
}

.score-title {
  font-size: 20rpx;
  color: #88909b;
}

/* Hero Meta */
.hero-meta {
  display: flex;
  align-items: center;
  margin-top: 24rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(0, 0, 0, 0.04);
}

.meta-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.meta-label {
  font-size: 22rpx;
  color: #88909b;
}

.meta-value {
  font-size: 28rpx;
  font-weight: 700;
  color: #1e1e1e;
}

.meta-divider {
  width: 1rpx;
  height: 48rpx;
  background: rgba(0, 0, 0, 0.06);
}

/* ===== Sections ===== */
.section {
  margin-top: 28rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
  padding: 0 4rpx;
}

.section-title {
  display: block;
  margin-bottom: 8rpx;
  padding: 0 4rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #1e1e1e;
}

.add-btn {
  padding: 6rpx 20rpx;
  border-radius: 16rpx;
  background: #00d4c8;
  color: #fff;
  font-size: 24rpx;
  font-weight: 600;
}

/* ===== Trend Chart ===== */
.trend-chart {
  display: flex;
  align-items: flex-end;
  gap: 8rpx;
  height: 240rpx;
  padding-top: 20rpx;
}

.trend-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  height: 100%;
}

.trend-val {
  font-size: 20rpx;
  font-weight: 600;
  color: #00a99f;
}

.trend-val.negative {
  color: #ff6b6b;
}

.trend-bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.trend-bar {
  width: 70%;
  border-radius: 8rpx 8rpx 0 0;
  background: linear-gradient(180deg, #00d4c8, #34d399);
  transition: height 0.5s;
  min-height: 4rpx;
}

.trend-bar.negative {
  background: linear-gradient(180deg, #ff6b6b, #ff9f43);
}

.trend-month {
  font-size: 20rpx;
  color: #88909b;
}

/* ===== Goals ===== */
.goals-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.goal-card {
  margin-top: 0 !important;
}

.goal-top {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.goal-icon-wrap {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.goal-icon {
  font-size: 36rpx;
}

.goal-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.goal-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1e1e1e;
}

.goal-predict {
  font-size: 22rpx;
  color: #88909b;
}

/* Mini Ring */
.goal-pct-ring {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  flex-shrink: 0;
}

.mini-ring-bg {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  border-radius: 50%;
  background: #f0f1f3;
}

.mini-ring-fill {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  border-radius: 50%;
}

.mini-ring-center {
  position: absolute;
  top: 10rpx; right: 10rpx; bottom: 10rpx; left: 10rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-ring-num {
  font-size: 22rpx;
  font-weight: 800;
  color: #1e1e1e;
}

.mini-ring-pct {
  font-size: 14rpx;
  color: #88909b;
}

/* Goal Bottom */
.goal-bottom {
  margin-top: 16rpx;
}

.goal-amounts {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
  margin-bottom: 10rpx;
}

.goal-current {
  font-size: 30rpx;
  font-weight: 700;
}

.goal-sep {
  font-size: 24rpx;
  color: #c0c6ce;
}

.goal-target {
  font-size: 24rpx;
  color: #88909b;
}

.goal-bar-track {
  height: 10rpx;
  border-radius: 5rpx;
  background: #f0f1f3;
  overflow: hidden;
}

.goal-bar-fill {
  height: 100%;
  border-radius: 5rpx;
  transition: width 0.5s;
}

.goal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10rpx;
}

.goal-alloc {
  font-size: 22rpx;
  color: #88909b;
}

.goal-del {
  font-size: 22rpx;
  color: #c0c6ce;
}

/* ===== Empty ===== */
.empty {
  padding: 48rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: #88909b;
}

.empty-goals {
  margin-top: 8rpx;
}

.empty-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 48rpx 0;
}

.empty-icon {
  font-size: 64rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #88909b;
}

.empty-btn {
  margin-top: 12rpx;
  padding: 14rpx 48rpx;
  border-radius: 20rpx;
  background: #00d4c8;
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
}

/* ===== AI Advice ===== */
.advice-summary {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1e1e1e;
  margin-bottom: 16rpx;
}

.advice-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.advice-item {
  display: flex;
  gap: 10rpx;
}

.advice-dot {
  color: #00d4c8;
  font-size: 26rpx;
  flex-shrink: 0;
}

.advice-text {
  font-size: 26rpx;
  color: #344054;
  line-height: 1.6;
}

.advice-encourage {
  margin-top: 16rpx;
  padding: 14rpx 20rpx;
  border-radius: 16rpx;
  background: rgba(0, 212, 200, 0.06);
  font-size: 26rpx;
  color: #00a99f;
  text-align: center;
}

/* ===== Skeleton ===== */
.advice-skeleton {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.sk-line {
  height: 24rpx;
  border-radius: 12rpx;
  background: linear-gradient(90deg, #f0f1f3 25%, #e8e9eb 50%, #f0f1f3 75%);
  background-size: 200% 100%;
  animation: skShimmer 1.5s infinite;
}

.sk-w60 { width: 60%; }
.sk-w80 { width: 80%; }
.sk-w90 { width: 90%; }
.sk-w100 { width: 100%; }

@keyframes skShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ===== Dialog ===== */
.dialog-mask {
  position: fixed;
  top: 0; right: 0; bottom: 0; left: 0;
  z-index: 99999;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-panel {
  width: 85%;
  max-height: 80vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 28rpx;
  padding: 36rpx;
}

.dialog-title {
  display: block;
  text-align: center;
  font-size: 32rpx;
  font-weight: 700;
  color: #1e1e1e;
  margin-bottom: 28rpx;
}

.form-group {
  margin-bottom: 24rpx;
}

.form-label {
  display: block;
  font-size: 24rpx;
  color: #88909b;
  margin-bottom: 10rpx;
}

.form-input {
  height: 80rpx;
  padding: 0 20rpx;
  border-radius: 16rpx;
  background: #f5f6f8;
  font-size: 28rpx;
  color: #1e1e1e;
}

.picker-display {
  display: flex;
  align-items: center;
}

.alloc-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.alloc-slider {
  flex: 1;
}

.alloc-val {
  font-size: 28rpx;
  font-weight: 700;
  color: #00a99f;
  width: 72rpx;
  text-align: right;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12rpx;
}

.icon-item {
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  background: #f5f6f8;
  font-size: 32rpx;
}

.icon-item.active {
  background: #e0f7f6;
  box-shadow: 0 0 0 3rpx #00d4c8;
}

.color-grid {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}

.color-item {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
}

.color-item.active {
  box-shadow: 0 0 0 4rpx #fff, 0 0 0 7rpx currentColor;
}

.dialog-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 28rpx;
}

.dialog-cancel,
.dialog-confirm {
  flex: 1;
  height: 76rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.dialog-cancel {
  background: #f5f6f8;
  color: #344054;
}

.dialog-confirm {
  background: #00d4c8;
  color: #fff;
}
</style>
