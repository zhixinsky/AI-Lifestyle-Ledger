<template>
  <view v-if="visible" class="editor-root" :class="{ 'is-sheet': variant === 'sheet' }">
    <view v-if="variant === 'sheet'" class="sheet-backdrop" @tap="emit('close')" />
    <view class="editor-mask" :class="{ 'editor-mask-sheet': variant === 'sheet' }">
    <!-- 顶栏（始终显示） -->
    <view class="top-bar" :style="{ marginTop: statusBarHeight + 'px' }">
      <view class="nav-back" @tap="emit('close')">
        <view class="back-glass" />
        <image class="back-icon" :src="backIcon" mode="aspectFit" />
      </view>
      <view class="type-tabs">
        <view
          :class="['type-tab', { active: modelValue.type === 'expense' }]"
          @tap="update('type', 'expense')"
        ><text>支出</text></view>
        <view
          :class="['type-tab', { active: modelValue.type === 'income' }]"
          @tap="update('type', 'income')"
        ><text>收入</text></view>
      </view>
      <view class="nav-placeholder" />
    </view>

    <!-- 分类网格（始终显示，可滚动） -->
    <view class="cat-area" :style="{ paddingBottom: step === 2 ? drawerHeight + 'px' : '0' }">
      <view class="cat-grid">
        <view
          v-for="cat in filteredCategories"
          :key="cat.id"
          :class="['cat-cell', { selected: modelValue.categoryId === cat.id }]"
          @tap="selectCategory(cat.id)"
        >
          <view class="cat-circle" :class="{ selected: modelValue.categoryId === cat.id }">
            <text class="cat-emoji">{{ cat.icon }}</text>
          </view>
          <text class="cat-label">{{ cat.name }}</text>
        </view>
        <view class="cat-cell" @tap="goSettings">
          <view class="cat-circle settings-circle">
            <text class="cat-emoji">⚙️</text>
          </view>
          <text class="cat-label">设置</text>
        </view>
      </view>
      <view v-if="!filteredCategories.length" class="cat-empty">
        <text>暂无分类数据</text>
      </view>
    </view>

    <!-- 底部键盘抽屉（选中分类后从底部滑入） -->
    <view v-if="step === 2" class="drawer-wrap">
      <view class="drawer">
        <!-- 选中分类 + 金额 -->
        <view class="drawer-header">
          <view class="selected-cat" @tap="goBackStep1">
            <view class="selected-circle">
              <text>{{ selectedCategoryIcon }}</text>
            </view>
            <text class="selected-name">{{ selectedCategoryName }}</text>
            <text class="change-hint">▾</text>
          </view>
          <text class="amount-display">{{ displayAmount }}</text>
        </view>

        <!-- 备注 -->
        <view class="remark-row">
          <text class="remark-label">备注：</text>
          <input
            class="remark-input"
            placeholder="点击填写备注"
            :value="modelValue.remark"
            @input="onRemarkInput"
          />
        </view>

        <!-- 数字键盘 -->
        <view class="keypad">
          <view class="key-row">
            <view class="key num" @tap="pressKey('7')"><text>7</text></view>
            <view class="key num" @tap="pressKey('8')"><text>8</text></view>
            <view class="key num" @tap="pressKey('9')"><text>9</text></view>
            <view class="key func" @tap="openDatePicker">
              <text class="key-icon">📅</text>
              <text class="key-sub">{{ dateLabel }}</text>
            </view>
          </view>
          <view class="key-row">
            <view class="key num" @tap="pressKey('4')"><text>4</text></view>
            <view class="key num" @tap="pressKey('5')"><text>5</text></view>
            <view class="key num" @tap="pressKey('6')"><text>6</text></view>
            <view class="key func op" :class="{ 'op-active': currentOp === '+' }" @tap="pressOp('+')"><text>+</text></view>
          </view>
          <view class="key-row">
            <view class="key num" @tap="pressKey('1')"><text>1</text></view>
            <view class="key num" @tap="pressKey('2')"><text>2</text></view>
            <view class="key num" @tap="pressKey('3')"><text>3</text></view>
            <view class="key func op" :class="{ 'op-active': currentOp === '-' }" @tap="pressOp('-')"><text>−</text></view>
          </view>
          <view class="key-row">
            <view class="key num" @tap="pressKey('.')"><text>.</text></view>
            <view class="key num" @tap="pressKey('0')"><text>0</text></view>
            <view class="key num" @tap="pressKey('del')"><text>⌫</text></view>
            <view class="key done" @tap="onDone">
              <text>{{ hasExpression ? '=' : (saving ? '...' : '完成') }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 日期选择弹窗（滚轮） -->
    <view v-if="showDatePicker" class="date-mask" @tap="showDatePicker = false">
      <view class="date-sheet" @tap.stop>
        <view class="date-bar">
          <view @tap="showDatePicker = false"><text class="date-bar-btn">取消</text></view>
          <text class="date-bar-title">选择日期</text>
          <view @tap="confirmDate"><text class="date-bar-btn confirm">确定</text></view>
        </view>
        <picker-view
          class="picker-wheel"
          :value="pickerIndexes"
          @change="onWheelChange"
          indicator-style="height: 44px;"
        >
          <picker-view-column>
            <view v-for="y in yearList" :key="y" class="wheel-item">
              <text>{{ y }}年</text>
            </view>
          </picker-view-column>
          <picker-view-column>
            <view v-for="m in monthList" :key="m" class="wheel-item">
              <text>{{ String(m).padStart(2, '0') }}月</text>
            </view>
          </picker-view-column>
          <picker-view-column>
            <view v-for="d in dayList" :key="d" class="wheel-item">
              <text>{{ String(d).padStart(2, '0') }}日</text>
            </view>
          </picker-view-column>
        </picker-view>
      </view>
    </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Category } from '@/types/domain';
import type { TransactionPayload } from '@/api/transactions';
import { useFinanceStore } from '@/stores/finance';
import { backIcon } from '@/utils/icons';

const finance = useFinanceStore();

const statusBarHeight = (() => {
  try { return uni.getSystemInfoSync().statusBarHeight || 44; } catch { return 44; }
})();

const capsuleRight = (() => {
  // #ifdef MP-WEIXIN
  try {
    const rect = wx.getMenuButtonBoundingClientRect();
    const sysInfo = uni.getSystemInfoSync();
    return sysInfo.windowWidth - rect.left + 8;
  } catch { return 0; }
  // #endif
  return 0;
})();

const props = defineProps<{
  visible: boolean;
  saving: boolean;
  modelValue: TransactionPayload;
  categories: Category[];
  /** fullscreen：全屏；sheet：底部抽屉（AI米粒手动记账） */
  variant?: 'fullscreen' | 'sheet';
}>();

const emit = defineEmits<{
  'update:modelValue': [value: TransactionPayload];
  save: [];
  close: [];
}>();

const step = ref(1);
const showDatePicker = ref(false);
const drawerHeight = 420;

// ---- 计算器状态 ----
const leftOperand = ref('');
const rightOperand = ref('');
const currentOp = ref<'+' | '-' | ''>('');

const hasExpression = computed(() => currentOp.value !== '' && rightOperand.value !== '');

const displayAmount = computed(() => {
  if (currentOp.value && rightOperand.value) {
    return `${leftOperand.value}${currentOp.value}${rightOperand.value}`;
  }
  if (currentOp.value) {
    return `${leftOperand.value}${currentOp.value}`;
  }
  return leftOperand.value || '0.00';
});

function calcResult(): number {
  const l = Number(leftOperand.value) || 0;
  const r = Number(rightOperand.value) || 0;
  if (currentOp.value === '+') return l + r;
  if (currentOp.value === '-') return Math.max(0, l - r);
  return l;
}

function syncAmount() {
  const val = currentOp.value && rightOperand.value
    ? calcResult()
    : Number(leftOperand.value) || 0;
  update('amount', Math.round(val * 100) / 100);
}

// ---- watch ----
watch(() => props.visible, (val) => {
  if (val) {
    step.value = 1;
    leftOperand.value = '';
    rightOperand.value = '';
    currentOp.value = '';
    if (!props.categories.length) {
      finance.loadCategories();
    }
  }
});

// ---- computed ----
const filteredCategories = computed(() =>
  props.categories.filter((c) => c.type === props.modelValue.type)
);

const selectedCategory = computed(() =>
  props.categories.find((c) => c.id === props.modelValue.categoryId)
);
const selectedCategoryIcon = computed(() => selectedCategory.value?.icon || '◎');
const selectedCategoryName = computed(() => selectedCategory.value?.name || '选择分类');

const dateLabel = computed(() => {
  const d = new Date(props.modelValue.occurredAt);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return '今天';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return '昨天';
  return `${d.getMonth() + 1}/${d.getDate()}`;
});

// ---- 滚轮日期选择 ----
const currentYear = new Date().getFullYear();
const yearList = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
const monthList = Array.from({ length: 12 }, (_, i) => i + 1);

const tempYear = ref(currentYear);
const tempMonth = ref(new Date().getMonth() + 1);
const tempDay = ref(new Date().getDate());

const dayList = computed(() => {
  const max = new Date(tempYear.value, tempMonth.value, 0).getDate();
  return Array.from({ length: max }, (_, i) => i + 1);
});

const pickerIndexes = computed(() => [
  yearList.indexOf(tempYear.value),
  tempMonth.value - 1,
  tempDay.value - 1,
]);

// ---- methods ----
function update<K extends keyof TransactionPayload>(key: K, value: TransactionPayload[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

function selectCategory(id: string) {
  update('categoryId', id);
  if (step.value === 1) {
    step.value = 2;
    leftOperand.value = '';
    rightOperand.value = '';
    currentOp.value = '';
  }
}

function goBackStep1() {
  step.value = 1;
}

function goSettings() {
  emit('close');
  uni.navigateTo({ url: '/pages/category-settings/index' });
}

function activeRef() {
  return currentOp.value ? rightOperand : leftOperand;
}

function pressKey(key: string) {
  const target = activeRef();
  if (key === 'del') {
    if (target.value.length > 0) {
      target.value = target.value.slice(0, -1);
    } else if (currentOp.value) {
      currentOp.value = '';
    }
  } else if (key === '.') {
    if (target.value.includes('.')) return;
    target.value += target.value ? '.' : '0.';
  } else {
    const parts = target.value.split('.');
    if (parts[1] && parts[1].length >= 2) return;
    if (target.value === '0' && key !== '.') {
      target.value = key;
    } else {
      target.value += key;
    }
  }
  syncAmount();
}

function pressOp(op: '+' | '-') {
  if (!leftOperand.value) return;
  if (currentOp.value && rightOperand.value) {
    const result = calcResult();
    leftOperand.value = String(Math.round(result * 100) / 100);
    rightOperand.value = '';
  }
  currentOp.value = op;
}

function openDatePicker() {
  const d = new Date(props.modelValue.occurredAt);
  tempYear.value = d.getFullYear();
  tempMonth.value = d.getMonth() + 1;
  tempDay.value = d.getDate();
  showDatePicker.value = true;
}

function onWheelChange(e: { detail: { value: number[] } }) {
  const [yi, mi, di] = e.detail.value;
  tempYear.value = yearList[yi] ?? currentYear;
  tempMonth.value = (mi ?? 0) + 1;
  const maxDay = new Date(tempYear.value, tempMonth.value, 0).getDate();
  tempDay.value = Math.min((di ?? 0) + 1, maxDay);
}

function confirmDate() {
  const d = new Date(tempYear.value, tempMonth.value - 1, tempDay.value, 12);
  update('occurredAt', d.toISOString());
  showDatePicker.value = false;
}

function onRemarkInput(event: any) {
  const val = event.detail?.value ?? (event.target as HTMLInputElement | null)?.value ?? '';
  update('remark', val);
}

function onDone() {
  if (hasExpression.value) {
    const result = calcResult();
    leftOperand.value = String(Math.round(result * 100) / 100);
    rightOperand.value = '';
    currentOp.value = '';
    syncAmount();
    return;
  }

  const amount = Number(leftOperand.value) || 0;
  if (amount <= 0) {
    uni.showToast({ title: '请输入金额', icon: 'none' });
    return;
  }
  update('amount', Math.round(amount * 100) / 100);
  emit('save');
}
</script>

<style scoped>
.editor-root {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
}

.sheet-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(18, 42, 38, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.editor-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background: #f7f8fa;
  display: flex;
  flex-direction: column;
}

.editor-mask-sheet {
  top: auto;
  height: 90vh;
  max-height: 90vh;
  border-radius: 32rpx 32rpx 0 0;
  overflow: hidden;
  background: rgba(248, 252, 250, 0.98);
  backdrop-filter: blur(28px) saturate(118%);
  -webkit-backdrop-filter: blur(28px) saturate(118%);
  box-shadow: 0 -12rpx 60rpx rgba(46, 184, 160, 0.12);
  animation: editor-sheet-in 0.38s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes editor-sheet-in {
  from {
    transform: translateY(110%);
    opacity: 0.85;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 顶栏 */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  flex-shrink: 0;
  /* margin-top 由 JS 动态设置 */
  padding: 0 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #f0f1f3;
}

.type-tabs {
  display: flex;
  gap: 48rpx;
}

.type-tab {
  font-size: 30rpx;
  color: #88909b;
  font-weight: 500;
  position: relative;
  height: 88rpx;
  line-height: 88rpx;
}

.type-tab.active {
  color: #1e1e1e;
  font-weight: 800;
}

.type-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 6rpx;
  border-radius: 3rpx;
  background: #00d4c8;
}

.nav-back {
  position: relative;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.top-bar .back-glass {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1rpx solid rgba(255, 255, 255, 0.5);
}
.top-bar .back-icon {
  position: relative;
  z-index: 1;
  width: 36rpx;
  height: 36rpx;
  margin-left: -4rpx;
}
.nav-placeholder {
  width: 60rpx;
  flex-shrink: 0;
}

/* 分类区域 */
.cat-area {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: #fff;
  transition: padding-bottom 0.3s;
}

.cat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 24rpx 16rpx;
  gap: 12rpx;
}

.cat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 0;
}

.cat-circle {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  border: 3rpx solid transparent;
}

.cat-circle.selected {
  background: rgba(0, 212, 200, 0.12);
  border-color: #00d4c8;
}

.cat-emoji {
  font-size: 36rpx;
}

.cat-label {
  font-size: 22rpx;
  color: #344054;
}

.cat-cell.selected .cat-label {
  color: #00a99f;
  font-weight: 600;
}

.settings-circle {
  background: #eef2f6 !important;
  border: 2rpx dashed #ccc !important;
}

.cat-empty {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  color: #88909b;
  font-size: 28rpx;
}

/* 底部抽屉 */
.drawer-wrap {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10001;
  animation: slideUp 0.25s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.drawer {
  background: #fff;
  border-radius: 28rpx 28rpx 0 0;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f0f1f3;
}

.selected-cat {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.selected-circle {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(0, 212, 200, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.selected-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1e1e1e;
}

.change-hint {
  font-size: 20rpx;
  color: #88909b;
}

.amount-display {
  font-size: 48rpx;
  font-weight: 800;
  color: #1e1e1e;
  letter-spacing: -1rpx;
  max-width: 360rpx;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 备注 */
.remark-row {
  display: flex;
  align-items: center;
  padding: 0 32rpx;
  height: 80rpx;
  border-bottom: 1rpx solid #f0f1f3;
}

.remark-label {
  font-size: 26rpx;
  color: #88909b;
  flex-shrink: 0;
}

.remark-input {
  flex: 1;
  height: 80rpx;
  font-size: 26rpx;
  color: #1e1e1e;
}

/* 键盘 */
.keypad {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.key-row {
  display: flex;
}

.key {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100rpx;
  font-size: 36rpx;
  color: #1e1e1e;
  background: #fff;
  border-top: 1rpx solid #f0f1f3;
  border-right: 1rpx solid #f0f1f3;
  transition: background 0.1s;
  font-weight: 500;
}

.key:active {
  background: #e8e8e8;
}

.key:last-child {
  border-right: none;
}

.key.func {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
  font-size: 30rpx;
  color: #344054;
  background: #f7f8fa;
}

.key.op.op-active {
  background: #e0f7fa;
  color: #00a99f;
  font-weight: 700;
}

.key-icon {
  font-size: 28rpx;
}

.key-sub {
  font-size: 18rpx;
  color: #88909b;
}

.key.done {
  background: #FFD600;
  color: #1e1e1e;
  font-size: 30rpx;
  font-weight: 700;
}

.key.done:active {
  background: #FFC400;
}

/* 日期滚轮弹窗 */
.date-mask {
  position: fixed;
  top: 0; right: 0; bottom: 0; left: 0;
  z-index: 20000;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
}

.date-sheet {
  width: 100%;
  background: #fff;
  border-radius: 28rpx 28rpx 0 0;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.date-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32rpx;
  height: 88rpx;
  border-bottom: 1rpx solid #f0f1f3;
}

.date-bar-btn {
  font-size: 30rpx;
  color: #88909b;
}

.date-bar-btn.confirm {
  color: #00a99f;
  font-weight: 700;
}

.date-bar-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1e1e1e;
}

.picker-wheel {
  width: 100%;
  height: 440rpx;
}

.wheel-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  font-size: 32rpx;
  color: #1e1e1e;
}
</style>
