<template>
  <PageShell>
    <!-- 导航 -->
    <view class="nav">
      <view class="nav-left">
        <text class="nav-title">账单</text>
        <view class="nav-after-title">
          <view class="month-picker-btn" @tap.stop="openPicker">
            <text class="picker-label">{{ pickerDisplay }}</text>
            <text class="picker-arrow">▾</text>
          </view>
          <view v-if="!isCurrentMonth" class="back-today" @tap.stop="goToday">
            <text>今</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 年月选择弹窗 -->
    <view v-if="showPicker" class="picker-mask" @tap="showPicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header">
          <text class="picker-cancel" @tap="showPicker = false">取消</text>
          <text class="picker-title">选择时间</text>
          <text class="picker-confirm" @tap="confirmPicker">确定</text>
        </view>
        <picker-view
          class="picker-view"
          :value="pickerValue"
          indicator-style="height: 44px;"
          @change="onPickerChange"
        >
          <picker-view-column>
            <view v-for="y in yearList" :key="y" class="picker-item">
              <text>{{ y }}年</text>
            </view>
          </picker-view-column>
          <picker-view-column>
            <view v-for="m in monthList" :key="m" class="picker-item">
              <text>{{ m }}月</text>
            </view>
          </picker-view-column>
        </picker-view>
      </view>
    </view>

    <!-- 支出 / 收入 切换 -->
    <view class="type-switch">
      <view
        :class="['type-tab', { active: filterType === 'expense' }]"
        @tap="switchType('expense')"
      >
        <text class="type-label">支出</text>
        <text class="type-amount expense">¥ {{ formatAmount(stats?.totalExpense || 0) }}</text>
      </view>
      <view
        :class="['type-tab', { active: filterType === 'income' }]"
        @tap="switchType('income')"
      >
        <text class="type-label">收入</text>
        <text class="type-amount income">¥ {{ formatAmount(stats?.totalIncome || 0) }}</text>
      </view>
      <view class="type-indicator" :style="{ left: filterType === 'expense' ? '4rpx' : 'calc(50% + 4rpx)' }" />
    </view>

    <!-- 周 / 月 / 年 切换 -->
    <view class="period-tabs">
      <view
        v-for="p in periods"
        :key="p.key"
        :class="['period-tab', { active: period === p.key }]"
        @tap="switchPeriod(p.key)"
      >
        <text>{{ p.label }}</text>
      </view>
    </view>

    <!-- 时间范围显示 -->
    <view class="time-range">
      <text class="time-text">{{ displayRange }}</text>
    </view>

    <!-- 搜索 -->
    <view class="search-bar">
      <view class="search-inner">
        <text class="search-icon">🔍</text>
        <input v-model="keyword" placeholder="搜索备注或分类" confirm-type="search" @confirm="reload" />
      </view>
    </view>

    <!-- 分类占比 -->
    <view class="section">
      <text class="section-title">{{ filterType === 'expense' ? '支出' : '收入' }}分类占比</text>
      <MoonaCard>
        <view v-if="ratios.length">
          <view v-for="item in ratios" :key="item.category" class="ratio-item">
            <view class="ratio-dot" :style="{ background: item.color }" />
            <text class="ratio-name">{{ item.category }}</text>
            <view class="ratio-bar-wrap">
              <view class="ratio-bar" :style="{ width: item.percent + '%', background: item.color }" />
            </view>
            <text class="ratio-pct">{{ item.percent }}%</text>
          </view>
        </view>
        <view v-else class="empty">
          <text>暂无数据</text>
        </view>
      </MoonaCard>
    </view>

    <!-- 账单列表 -->
    <view class="section">
      <text class="section-title">明细</text>
      <MoonaCard>
        <view v-if="filteredTransactions.length">
          <view
            v-for="(item, idx) in filteredTransactions"
            :key="item.id"
            :class="['bill-row', { bordered: idx < filteredTransactions.length - 1 }]"
          >
            <view class="bill-icon" :style="{ background: item.category?.color || '#eef2f6' }" @tap.stop="openCatPicker(item)">
              <text>{{ item.category?.icon || '◎' }}</text>
            </view>
            <view class="bill-info" @tap.stop="openNameEdit(item)">
              <text class="bill-name">{{ item.remark || item.category?.name || '账单' }}</text>
            </view>
            <text :class="['bill-amount', item.type]" @tap.stop="openAmountEdit(item)">{{ formatSignedMoney(item.amount, item.type) }}</text>
          </view>
        </view>
        <view v-else class="empty">
          <text>暂无账单记录</text>
        </view>
      </MoonaCard>
    </view>

    <!-- 分类选择弹窗 -->
    <view v-if="showCatPicker" class="edit-mask" @tap="showCatPicker = false">
      <view class="edit-sheet" @tap.stop>
        <text class="edit-sheet-title">选择分类</text>
        <view class="cat-grid">
          <view
            v-for="cat in pickerCategories"
            :key="cat.id"
            :class="['cat-cell', { selected: cat.id === editingItem?.categoryId }]"
            @tap="confirmCatChange(cat)"
          >
            <view class="cat-circle" :style="{ background: cat.color }">
              <text class="cat-emoji">{{ cat.icon }}</text>
            </view>
            <text class="cat-label">{{ cat.name }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 名称编辑弹窗 -->
    <view v-if="showNameEdit" class="edit-mask" @tap="showNameEdit = false">
      <view class="edit-sheet edit-sheet-sm" @tap.stop>
        <text class="edit-sheet-title">编辑名称</text>
        <input class="edit-input" v-model="editNameVal" :focus="showNameEdit" @confirm="confirmNameEdit" />
        <view class="edit-actions">
          <button class="edit-cancel" @tap="showNameEdit = false">取消</button>
          <button class="edit-confirm" @tap="confirmNameEdit">确定</button>
        </view>
      </view>
    </view>

    <!-- 金额编辑弹窗 -->
    <view v-if="showAmountEdit" class="edit-mask" @tap="showAmountEdit = false">
      <view class="edit-sheet edit-sheet-sm" @tap.stop>
        <text class="edit-sheet-title">编辑金额</text>
        <input class="edit-input" type="digit" v-model="editAmountVal" :focus="showAmountEdit" @confirm="confirmAmountEdit" />
        <view class="edit-actions">
          <button class="edit-cancel" @tap="showAmountEdit = false">取消</button>
          <button class="edit-confirm" @tap="confirmAmountEdit">确定</button>
        </view>
      </view>
    </view>

    <view style="height: 60rpx;" />

    <AppTabbar current="bills" />
  </PageShell>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import PageShell from '@/components/PageShell.vue';
import MoonaCard from '@/components/MoonaCard.vue';
import AppTabbar from '@/components/AppTabbar.vue';
import { useFinanceStore } from '@/stores/finance';
import { useAuthStore } from '@/stores/auth';
import { useMoney } from '@/composables/useMoney';
import { transactionApi } from '@/api/transactions';
import type { Transaction, Category } from '@/types/domain';

const finance = useFinanceStore();
const authStore = useAuthStore();
const keyword = ref('');
const { formatSignedMoney } = useMoney();

const editingItem = ref<Transaction | null>(null);
const showCatPicker = ref(false);
const showNameEdit = ref(false);
const showAmountEdit = ref(false);
const editNameVal = ref('');
const editAmountVal = ref('');

const pickerCategories = computed(() =>
  finance.categories.filter((c) => c.type === editingItem.value?.type)
);

function openCatPicker(item: Transaction) {
  editingItem.value = item;
  showCatPicker.value = true;
}

async function confirmCatChange(cat: Category) {
  if (!editingItem.value) return;
  try {
    await transactionApi.update(editingItem.value.id, { categoryId: cat.id });
    showCatPicker.value = false;
    await fetchData();
    uni.showToast({ title: '已更新', icon: 'success' });
    try {
      uni.$emit('transactions-updated');
    } catch {
      /* ignore */
    }
  } catch {
    uni.showToast({ title: '更新失败', icon: 'none' });
  }
}

function openNameEdit(item: Transaction) {
  editingItem.value = item;
  editNameVal.value = item.remark || item.category?.name || '';
  showNameEdit.value = true;
}

async function confirmNameEdit() {
  if (!editingItem.value) return;
  const val = editNameVal.value.trim();
  if (!val) return;
  try {
    const isCategoryName = !editingItem.value.remark && val === editingItem.value.category?.name;
    if (!isCategoryName) {
      await transactionApi.update(editingItem.value.id, { remark: val });
    }
    showNameEdit.value = false;
    await fetchData();
    uni.showToast({ title: '已更新', icon: 'success' });
    try {
      uni.$emit('transactions-updated');
    } catch {
      /* ignore */
    }
  } catch {
    uni.showToast({ title: '更新失败', icon: 'none' });
  }
}

function openAmountEdit(item: Transaction) {
  editingItem.value = item;
  editAmountVal.value = String(item.amount);
  showAmountEdit.value = true;
}

async function confirmAmountEdit() {
  if (!editingItem.value) return;
  const val = Number(editAmountVal.value);
  if (!val || val <= 0) {
    uni.showToast({ title: '请输入有效金额', icon: 'none' });
    return;
  }
  try {
    await transactionApi.update(editingItem.value.id, { amount: Math.round(val * 100) / 100 });
    showAmountEdit.value = false;
    await fetchData();
    uni.showToast({ title: '已更新', icon: 'success' });
    try {
      uni.$emit('transactions-updated');
    } catch {
      /* ignore */
    }
  } catch {
    uni.showToast({ title: '更新失败', icon: 'none' });
  }
}

const filterType = ref<'expense' | 'income'>('expense');
const period = ref<'week' | 'month' | 'year'>('month');

const now = new Date();
const selectedYear = ref(now.getFullYear());
const selectedMonth = ref(now.getMonth() + 1);
const showPicker = ref(false);

const yearList = computed(() => {
  const cur = now.getFullYear();
  const list: number[] = [];
  for (let y = cur - 5; y <= cur + 1; y++) list.push(y);
  return list;
});
const monthList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const pickerValue = ref([
  yearList.value.indexOf(selectedYear.value),
  selectedMonth.value - 1,
]);

const pickerDisplay = computed(() => `${selectedYear.value}年${selectedMonth.value}月`);

const isCurrentMonth = computed(() =>
  selectedYear.value === now.getFullYear() && selectedMonth.value === (now.getMonth() + 1)
);

function goToday() {
  selectedYear.value = now.getFullYear();
  selectedMonth.value = now.getMonth() + 1;
  fetchData();
}

const selectedMonthStr = computed(() => {
  const m = String(selectedMonth.value).padStart(2, '0');
  return `${selectedYear.value}-${m}`;
});

let pendingIndex: number[] = [];

function openPicker() {
  const yi = yearList.value.indexOf(selectedYear.value);
  const mi = selectedMonth.value - 1;
  pendingIndex = [yi >= 0 ? yi : 0, mi];
  pickerValue.value = [...pendingIndex];
  showPicker.value = true;
}

function onPickerChange(e: any) {
  pendingIndex = [e.detail.value[0], e.detail.value[1]];
}

function confirmPicker() {
  const yi = Math.max(0, Math.min(pendingIndex[0], yearList.value.length - 1));
  const mi = Math.max(0, Math.min(pendingIndex[1], 11));
  selectedYear.value = yearList.value[yi];
  selectedMonth.value = monthList[mi];
  showPicker.value = false;
  fetchData();
}

const periods = [
  { key: 'week' as const, label: '周' },
  { key: 'month' as const, label: '月' },
  { key: 'year' as const, label: '年' },
];

const transactions = computed(() => finance.transactions);
const stats = computed(() => finance.statistics);

const filteredTransactions = computed(() =>
  transactions.value.filter((t) => t.type === filterType.value)
);

const displayRange = computed(() => {
  const m = stats.value?.month;
  if (!m) return pickerDisplay.value;
  if (period.value === 'year') return `${selectedYear.value}年`;
  if (period.value === 'week') return `${m} 当周`;
  const [y, mo] = m.split('-');
  return `${y}年${Number(mo)}月`;
});

const ratios = computed(() => stats.value?.categoryRatio || []);

function formatAmount(val: number) {
  return val.toFixed(2);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${mo}/${da} ${hh}:${mm}`;
}

function switchType(type: 'expense' | 'income') {
  if (filterType.value === type) return;
  filterType.value = type;
}

function switchPeriod(p: 'week' | 'month' | 'year') {
  if (period.value === p) return;
  period.value = p;
}

async function fetchData() {
  if (!authStore.isLoggedIn) {
    finance.transactions = [];
    finance.statistics = null;
    return;
  }
  finance.statistics = null;
  await Promise.all([
    finance.loadTransactions({ month: selectedMonthStr.value, keyword: keyword.value }),
    finance.loadStatistics({ month: selectedMonthStr.value, period: period.value, type: filterType.value }),
  ]);
}

async function reload() {
  await fetchData();
}

watch([filterType, period], async () => {
  await fetchData();
});

onShow(() => {
  fetchData();
  if (authStore.isLoggedIn && !finance.categories.length) {
    finance.loadCategories();
  }
});
</script>

<style scoped>
.nav {
  display: flex;
  align-items: center;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex: 1;
  min-width: 0;
}

.nav-after-title {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-left: 8rpx;
  flex-shrink: 0;
}

.nav-title {
  font-size: 38rpx;
  font-weight: 800;
  color: #1e1e1e;
  flex-shrink: 0;
}

.back-today {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52rpx;
  height: 52rpx;
  border-radius: 14rpx;
  background: #00a99f;
  color: #fff;
  font-size: 24rpx;
  font-weight: 700;
  box-shadow: 0 4rpx 12rpx rgba(0, 169, 159, 0.3);
}

.month-picker-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 10rpx 20rpx;
  border-radius: 16rpx;
  background: rgba(0, 0, 0, 0.04);
}

.picker-label {
  font-size: 26rpx;
  color: #344054;
  font-weight: 500;
}

.picker-arrow {
  font-size: 22rpx;
  color: #88909b;
}

/* 年月选择弹窗 */
.picker-mask {
  position: fixed;
  top: 0; right: 0; bottom: 0; left: 0;
  z-index: 99999;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.picker-panel {
  width: 100%;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 40rpx);
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #f0f1f3;
}

.picker-cancel {
  font-size: 28rpx;
  color: #88909b;
}

.picker-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1e1e1e;
}

.picker-confirm {
  font-size: 28rpx;
  color: #00a99f;
  font-weight: 600;
}

.picker-view {
  width: 100%;
  height: 420rpx;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  line-height: 44px;
  font-size: 32rpx;
  color: #1e1e1e;
}

/* 支出 / 收入 切换 */
.type-switch {
  position: relative;
  display: flex;
  margin-top: 24rpx;
  padding: 6rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.type-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  padding: 20rpx 0;
  border-radius: 20rpx;
  position: relative;
  z-index: 2;
  transition: all 0.3s;
}

.type-label {
  font-size: 24rpx;
  color: #88909b;
  transition: color 0.3s;
}

.type-tab.active .type-label {
  color: #1e1e1e;
  font-weight: 600;
}

.type-amount {
  font-size: 36rpx;
  font-weight: 800;
  transition: color 0.3s;
}

.type-amount.expense {
  color: #c0c6ce;
}

.type-tab.active .type-amount.expense {
  color: #1e1e1e;
}

.type-amount.income {
  color: #c0c6ce;
}

.type-tab.active .type-amount.income {
  color: #00a99f;
}

.type-indicator {
  position: absolute;
  top: 6rpx;
  bottom: 6rpx;
  width: calc(50% - 8rpx);
  border-radius: 20rpx;
  background: #fff;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  transition: left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 1;
}

/* 周 / 月 / 年 */
.period-tabs {
  display: flex;
  gap: 12rpx;
  margin-top: 24rpx;
  justify-content: center;
}

.period-tab {
  padding: 12rpx 40rpx;
  border-radius: 32rpx;
  font-size: 26rpx;
  color: #88909b;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: all 0.3s;
}

.period-tab.active {
  background: #1e1e1e;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
}

/* 时间范围 */
.time-range {
  text-align: center;
  margin-top: 16rpx;
}

.time-text {
  font-size: 24rpx;
  color: #88909b;
}

/* 搜索 */
.search-bar {
  margin-top: 20rpx;
}

.search-inner {
  display: flex;
  align-items: center;
  gap: 12rpx;
  height: 76rpx;
  padding: 0 24rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.search-icon {
  font-size: 28rpx;
  flex-shrink: 0;
}

.search-inner input {
  flex: 1;
  height: 76rpx;
  font-size: 28rpx;
  color: #1e1e1e;
}

/* 通用 */
.section {
  margin-top: 28rpx;
}

.section-title {
  display: block;
  margin-bottom: 4rpx;
  padding: 0 4rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #1e1e1e;
}

/* 分类占比 */
.ratio-item {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 14rpx 0;
}

.ratio-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 4rpx;
  flex-shrink: 0;
}

.ratio-name {
  width: 80rpx;
  font-size: 24rpx;
  color: #344054;
  flex-shrink: 0;
}

.ratio-bar-wrap {
  flex: 1;
  height: 14rpx;
  border-radius: 7rpx;
  background: #f0f1f3;
  overflow: hidden;
}

.ratio-bar {
  height: 100%;
  border-radius: 7rpx;
  transition: width 0.5s ease;
}

.ratio-pct {
  width: 56rpx;
  text-align: right;
  font-size: 22rpx;
  color: #88909b;
  flex-shrink: 0;
}

/* 账单列表 */
.bill-row {
  display: flex;
  align-items: center;
  padding: 18rpx 0;
}

.bill-row.bordered {
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

.bill-date {
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
  padding: 48rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: #88909b;
}

/* 编辑弹窗 */
.edit-mask {
  position: fixed;
  top: 0; right: 0; bottom: 0; left: 0;
  z-index: 99999;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.edit-sheet {
  width: 100%;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 32rpx 32rpx calc(env(safe-area-inset-bottom, 0px) + 32rpx);
  max-height: 70vh;
  overflow-y: auto;
}

.edit-sheet-sm {
  max-height: 40vh;
}

.edit-sheet-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #1e1e1e;
  margin-bottom: 28rpx;
  text-align: center;
}

.cat-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.cat-cell {
  width: calc(20% - 16rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.cat-cell.selected .cat-circle {
  box-shadow: 0 0 0 4rpx #00a99f;
}

.cat-circle {
  width: 80rpx;
  height: 80rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: box-shadow 0.2s;
}

.cat-emoji {
  font-size: 36rpx;
}

.cat-label {
  font-size: 22rpx;
  color: #344054;
  text-align: center;
}

.edit-input {
  width: 100%;
  height: 88rpx;
  border: 2rpx solid #e5e7eb;
  border-radius: 20rpx;
  padding: 0 24rpx;
  font-size: 32rpx;
  color: #1e1e1e;
  background: #f9fafb;
}

.edit-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 28rpx;
}

.edit-cancel, .edit-confirm {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 20rpx;
  font-size: 28rpx;
  font-weight: 600;
  text-align: center;
}

.edit-cancel {
  background: #f0f1f3;
  color: #344054;
}

.edit-confirm {
  background: #00a99f;
  color: #fff;
}
</style>
