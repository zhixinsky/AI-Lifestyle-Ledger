<template>
  <PageShell>
    <view class="nav">
      <view class="nav-back" @tap="goBack">
        <view class="back-glass" />
        <image class="back-icon" :src="backIcon" />
      </view>
      <text class="nav-title">预算管理</text>
      <view class="nav-placeholder" />
    </view>

    <!-- 总预算概览 -->
    <MoonaCard class="overview-card">
      <view class="overview-top">
        <text class="overview-label">本月总预算</text>
        <view v-if="overview" class="overview-nums">
          <text class="overview-budget">¥ {{ overview.totalBudget.toFixed(0) }}</text>
        </view>
      </view>
      <view v-if="overview && overview.totalBudget > 0" class="progress-wrap">
        <view class="progress-track">
          <view
            class="progress-fill"
            :class="{ danger: overview.isOverspent }"
            :style="{ width: Math.min(overview.totalPercent, 100) + '%' }"
          />
        </view>
        <view class="progress-info">
          <text class="spent">已花 ¥{{ overview.totalSpent.toFixed(0) }}</text>
          <text :class="['remain', { danger: overview.isOverspent }]">
            {{ overview.isOverspent ? '超支' : '剩余' }} ¥{{ Math.abs(overview.totalRemaining).toFixed(0) }}
          </text>
        </view>
      </view>
      <view v-else class="empty-hint">
        <text>还没有设置预算，点击下方添加</text>
      </view>
    </MoonaCard>

    <!-- AI 建议 -->
    <view v-if="advice" class="ai-advice">
      <MoonaCard>
        <view class="advice-header">
          <text class="advice-icon">💡</text>
          <text class="advice-title">AI 建议</text>
        </view>
        <text class="advice-text">{{ advice }}</text>
      </MoonaCard>
    </view>

    <!-- 分类预算列表 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">分类预算</text>
        <view class="add-btn" @tap="showAddDialog = true">
          <text>+ 添加</text>
        </view>
      </view>

      <MoonaCard v-if="budgets.length">
        <view v-for="(item, idx) in budgets" :key="item.id" :class="['budget-item', { bordered: idx < budgets.length - 1 }]">
          <view class="budget-left">
            <view class="budget-icon" :style="{ background: item.category?.color || '#eef2f6' }">
              <text>{{ item.category?.icon || '💰' }}</text>
            </view>
            <view class="budget-info">
              <text class="budget-name">{{ item.category?.name || '总预算' }}</text>
              <text class="budget-sub">¥{{ item.spent.toFixed(0) }} / ¥{{ item.amount.toFixed(0) }}</text>
            </view>
          </view>
          <view class="budget-right">
            <view class="mini-progress">
              <view
                class="mini-fill"
                :class="{ danger: item.isOverspent }"
                :style="{ width: Math.min(item.percent, 100) + '%' }"
              />
            </view>
            <text :class="['budget-pct', { danger: item.isOverspent }]">{{ item.percent }}%</text>
            <view class="del-btn" @tap="removeBudget(item.id)">
              <text>✕</text>
            </view>
          </view>
        </view>
      </MoonaCard>
      <MoonaCard v-else>
        <view class="empty">
          <text>暂无分类预算</text>
        </view>
      </MoonaCard>
    </view>

    <!-- 添加预算弹窗 -->
    <view v-if="showAddDialog" class="dialog-mask" @tap="showAddDialog = false">
      <view class="dialog-panel" @tap.stop>
        <text class="dialog-title">添加预算</text>

        <view class="form-group">
          <text class="form-label">类型</text>
          <view class="type-tabs">
            <view :class="['type-tab', { active: !addForm.categoryId }]" @tap="addForm.categoryId = ''">
              <text>总预算</text>
            </view>
            <view :class="['type-tab', { active: !!addForm.categoryId }]" @tap="pickCategory">
              <text>{{ addForm.categoryId ? selectedCategoryName : '选择分类' }}</text>
            </view>
          </view>
        </view>

        <view v-if="addForm.categoryId" class="form-group">
          <text class="form-label">分类</text>
          <scroll-view scroll-x class="cat-scroll">
            <view
              v-for="cat in expenseCategories"
              :key="cat.id"
              :class="['cat-chip', { active: addForm.categoryId === cat.id }]"
              @tap="addForm.categoryId = cat.id"
            >
              <text>{{ cat.icon }} {{ cat.name }}</text>
            </view>
          </scroll-view>
        </view>

        <view class="form-group">
          <text class="form-label">预算金额</text>
          <input
            v-model="addForm.amount"
            type="digit"
            placeholder="输入金额"
            class="form-input"
          />
        </view>

        <view class="dialog-actions">
          <view class="dialog-cancel" @tap="showAddDialog = false"><text>取消</text></view>
          <view class="dialog-confirm" @tap="submitBudget"><text>确定</text></view>
        </view>
      </view>
    </view>

    <view style="height: 60rpx;" />
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { backIcon } from '@/utils/icons';
import PageShell from '@/components/PageShell.vue';
import MoonaCard from '@/components/MoonaCard.vue';
import { budgetApi } from '@/api/budgets';
import { useFinanceStore } from '@/stores/finance';
import type { BudgetItem, BudgetOverview } from '@/types/domain';

const finance = useFinanceStore();
const budgets = ref<BudgetItem[]>([]);
const overview = ref<BudgetOverview | null>(null);
const advice = ref('');
const showAddDialog = ref(false);

const addForm = ref({
  categoryId: '',
  amount: '',
});

const expenseCategories = computed(() =>
  finance.categories.filter((c) => c.type === 'expense')
);

const selectedCategoryName = computed(() => {
  const cat = expenseCategories.value.find((c) => c.id === addForm.value.categoryId);
  return cat ? `${cat.icon} ${cat.name}` : '选择分类';
});

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
  } else {
    uni.switchTab({ url: '/pages/mili/index' });
  }
}

function pickCategory() {
  if (!addForm.value.categoryId && expenseCategories.value.length) {
    addForm.value.categoryId = expenseCategories.value[0].id;
  }
}

async function loadData() {
  try {
    const [list, ov] = await Promise.all([
      budgetApi.list(),
      budgetApi.overview(),
    ]);
    budgets.value = list;
    overview.value = ov;
  } catch (e) {
    console.error('Load budgets failed:', e);
  }
}

async function loadAdvice() {
  try {
    const res = await budgetApi.getAdvice();
    advice.value = res.advice;
  } catch {
    /* ignore */
  }
}

async function submitBudget() {
  const amount = parseFloat(addForm.value.amount);
  if (!amount || amount <= 0) {
    uni.showToast({ title: '请输入有效金额', icon: 'none' });
    return;
  }

  try {
    await budgetApi.upsert({
      amount,
      categoryId: addForm.value.categoryId || undefined,
    });
    showAddDialog.value = false;
    addForm.value = { categoryId: '', amount: '' };
    await loadData();
    uni.showToast({ title: '设置成功', icon: 'success' });
  } catch (e: any) {
    uni.showToast({ title: e.message || '设置失败', icon: 'none' });
  }
}

async function removeBudget(id: string) {
  try {
    await budgetApi.remove(id);
    await loadData();
    uni.showToast({ title: '已删除', icon: 'success' });
  } catch (e: any) {
    uni.showToast({ title: e.message || '删除失败', icon: 'none' });
  }
}

onMounted(async () => {
  await finance.loadCategories();
  await loadData();
  loadAdvice();
});
</script>

<style scoped>
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-back {
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

.nav-placeholder {
  width: 60rpx;
}

/* 总预算 */
.overview-card {
  margin-top: 20rpx;
}

.overview-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.overview-label {
  font-size: 26rpx;
  color: #88909b;
}

.overview-budget {
  font-size: 40rpx;
  font-weight: 800;
  color: #1e1e1e;
}

.progress-wrap {
  margin-top: 8rpx;
}

.progress-track {
  height: 16rpx;
  border-radius: 8rpx;
  background: #f0f1f3;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 8rpx;
  background: linear-gradient(90deg, #00d4c8, #34d399);
  transition: width 0.5s;
}

.progress-fill.danger {
  background: linear-gradient(90deg, #ff6b6b, #ee5a24);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 10rpx;
}

.spent {
  font-size: 24rpx;
  color: #88909b;
}

.remain {
  font-size: 24rpx;
  color: #00a99f;
  font-weight: 600;
}

.remain.danger {
  color: #ff6b6b;
}

.empty-hint {
  padding: 24rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: #88909b;
}

/* AI 建议 */
.ai-advice {
  margin-top: 24rpx;
}

.advice-header {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 12rpx;
}

.advice-icon {
  font-size: 32rpx;
}

.advice-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1e1e1e;
}

.advice-text {
  font-size: 26rpx;
  color: #344054;
  line-height: 1.7;
  white-space: pre-wrap;
}

/* 分类预算 */
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

.budget-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
}

.budget-item.bordered {
  border-bottom: 1rpx solid #f0f1f3;
}

.budget-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.budget-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.budget-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.budget-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #1e1e1e;
}

.budget-sub {
  font-size: 22rpx;
  color: #88909b;
}

.budget-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.mini-progress {
  width: 100rpx;
  height: 8rpx;
  border-radius: 4rpx;
  background: #f0f1f3;
  overflow: hidden;
}

.mini-fill {
  height: 100%;
  border-radius: 4rpx;
  background: #00d4c8;
  transition: width 0.5s;
}

.mini-fill.danger {
  background: #ff6b6b;
}

.budget-pct {
  font-size: 24rpx;
  color: #88909b;
  width: 60rpx;
  text-align: right;
}

.budget-pct.danger {
  color: #ff6b6b;
  font-weight: 600;
}

.del-btn {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  color: #c0c6ce;
}

/* 弹窗 */
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

.type-tabs {
  display: flex;
  gap: 12rpx;
}

.type-tab {
  flex: 1;
  padding: 14rpx 0;
  text-align: center;
  border-radius: 16rpx;
  background: #f5f6f8;
  font-size: 26rpx;
  color: #344054;
}

.type-tab.active {
  background: #1e1e1e;
  color: #fff;
  font-weight: 600;
}

.cat-scroll {
  white-space: nowrap;
  padding: 4rpx 0;
}

.cat-chip {
  display: inline-flex;
  padding: 10rpx 20rpx;
  margin-right: 12rpx;
  border-radius: 16rpx;
  background: #f5f6f8;
  font-size: 24rpx;
  color: #344054;
}

.cat-chip.active {
  background: #00d4c8;
  color: #fff;
}

.form-input {
  height: 80rpx;
  padding: 0 20rpx;
  border-radius: 16rpx;
  background: #f5f6f8;
  font-size: 30rpx;
  color: #1e1e1e;
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

.empty {
  padding: 48rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: #88909b;
}
</style>
