<template>
  <PageShell>
    <!-- 导航 -->
    <view class="nav-bar">
      <view class="back-btn" @click="back">
        <view class="back-glass" />
        <image class="back-icon" :src="backIcon" />
      </view>
      <text class="nav-title">AI 识别结果</text>
      <view class="nav-placeholder" />
    </view>

    <!-- 摘要 -->
    <view class="summary">
      <text class="summary-title">识别到以下 {{ transactions.length }} 笔账单</text>
      <text class="summary-desc">请确认或修改后保存</text>
    </view>

    <!-- 账单卡片 -->
    <view class="card-list">
      <MoonaCard v-for="(item, index) in transactions" :key="index" class="bill-card">
        <view class="card-top">
          <view class="card-type" :class="item.type">
            <text>{{ item.type === 'expense' ? '支出' : '收入' }}</text>
          </view>
          <view class="delete-btn" @tap="remove(index)">
            <text>删除</text>
          </view>
        </view>

        <view class="card-amount-row">
          <text class="card-icon">{{ getCategoryIcon(item.category) }}</text>
          <view class="card-amount-wrap">
            <text class="card-remark">{{ item.remark || item.category }}</text>
            <view class="card-amount-input-row">
              <text class="card-currency">¥</text>
              <input class="card-amount-input" type="digit" :value="item.amount" @input="updateAmount(index, $event)" />
            </view>
          </view>
        </view>

        <view class="card-fields">
          <view class="card-field">
            <text class="field-label">分类</text>
            <input class="field-value" :value="item.category" @input="updateText(index, 'category', $event)" />
          </view>
          <view class="card-field">
            <text class="field-label">备注</text>
            <input class="field-value" :value="item.remark" @input="updateText(index, 'remark', $event)" />
          </view>
        </view>
      </MoonaCard>
    </view>

    <!-- 底部操作 -->
    <view class="footer">
      <button class="add-btn" @tap="add">＋ 添加一笔</button>
      <button class="confirm-btn" :disabled="saving || !transactions.length" @tap="confirm">
        {{ saving ? '保存中...' : `确认保存（${transactions.length}笔）` }}
      </button>
    </view>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { backIcon } from '@/utils/icons';
import PageShell from '@/components/PageShell.vue';
import MoonaCard from '@/components/MoonaCard.vue';
import { aiApi } from '@/api/ai';
import { transactionApi } from '@/api/transactions';
import { useAiStore } from '@/stores/ai';
import { useFinanceStore } from '@/stores/finance';
import type { AiParsedTransaction } from '@/types/domain';
import { saveVoiceCategoryPreference } from '@/utils/intent-classifier';

const aiStore = useAiStore();
const finance = useFinanceStore();
const saving = ref(false);
const transactions = computed({
  get: () => aiStore.parsedTransactions,
  set: (value: AiParsedTransaction[]) => {
    aiStore.parsedTransactions = value;
  }
});

const categoryIcons: Record<string, string> = {
  '餐饮': '🍜', '交通': '🚗', '购物': '🛒', '娱乐': '🎮',
  '医疗': '💊', '住房': '🏠', '学习': '📚', '工资': '💰',
  '其它': '📌', '其它收入': '💵', '饮品': '🧋',
};

function getCategoryIcon(category: string) {
  return categoryIcons[category] || '📌';
}

function readInputValue(event: any) {
  return event.detail?.value ?? (event.target as HTMLInputElement | null)?.value ?? '';
}

function updateAmount(index: number, event: Event) {
  const next = [...transactions.value];
  next[index] = { ...next[index], amount: Number(readInputValue(event)) };
  transactions.value = next;
}

function updateText(index: number, key: 'category' | 'remark', event: Event) {
  const next = [...transactions.value];
  next[index] = { ...next[index], [key]: readInputValue(event) };
  transactions.value = next;
}

function remove(index: number) {
  transactions.value = transactions.value.filter((_, i) => i !== index);
}

function add() {
  transactions.value = [
    ...transactions.value,
    {
      type: 'expense', amount: 0, category: '其它',
      categoryId: '', remark: '', occurredAt: new Date().toISOString(), tags: []
    }
  ];
}

function back() {
  uni.navigateBack();
}

async function ensureCategories() {
  if (!finance.categories.length) {
    await finance.loadCategories();
  }
}

function resolveCategoryId(item: AiParsedTransaction) {
  if (item.categoryId) return item.categoryId;
  const fallbackName = item.type === 'income' ? '其它收入' : '其它';
  return (
    finance.categories.find((cat) => cat.name === item.category && cat.type === item.type)?.id ||
    finance.categories.find((cat) => cat.name === fallbackName && cat.type === item.type)?.id ||
    ''
  );
}

function saveVoicePreferencesIfNeeded() {
  let pending: { type?: 'expense' | 'income'; category?: string; tag?: string; matchedKeyword?: string } | null = null;
  try {
    pending = uni.getStorageSync('mili_pending_voice_intent') || null;
  } catch {
    pending = null;
  }
  if (!pending?.type) return;
  const first = transactions.value[0];
  if (!first) return;
  const keyword = pending.matchedKeyword || pending.tag || first.tags?.[0] || '';
  if (!keyword) return;
  if (first.category && first.category !== pending.category) {
    saveVoiceCategoryPreference(keyword, pending.type, first.category);
  }
  try {
    uni.removeStorageSync('mili_pending_voice_intent');
  } catch {
    /* ignore */
  }
}

async function confirm() {
  saving.value = true;
  try {
    await ensureCategories();
    if (aiStore.logId) {
      await aiApi.confirmBill(aiStore.logId, transactions.value);
    } else {
      const payloads = transactions.value.map((item) => ({
        type: item.type,
        amount: item.amount,
        categoryId: resolveCategoryId(item),
        occurredAt: item.occurredAt,
        remark: item.remark,
        tags: item.tags,
      }));
      if (payloads.some((item) => !item.categoryId)) {
        uni.showToast({ title: '分类加载失败，请稍后再试', icon: 'none' });
        return;
      }
      await Promise.all(payloads.map((item) => transactionApi.create(item)));
    }
    saveVoicePreferencesIfNeeded();
    aiStore.clear();
    uni.showToast({ title: '已保存', icon: 'success' });
    try {
      uni.$emit('transactions-updated');
    } catch {
      /* ignore */
    }
    setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 500);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
/* 导航 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 68rpx;
  height: 68rpx;
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
  font-size: 32rpx;
  font-weight: 800;
  color: #1e1e1e;
}

.nav-placeholder {
  width: 64rpx;
}

/* 摘要 */
.summary {
  margin-top: 28rpx;
}

.summary-title {
  display: block;
  font-size: 36rpx;
  font-weight: 800;
  color: #1e1e1e;
}

.summary-desc {
  display: block;
  margin-top: 6rpx;
  font-size: 26rpx;
  color: #88909b;
}

/* 卡片列表 */
.card-list {
  padding-bottom: 200rpx;
}

.bill-card {
  padding: 24rpx 28rpx !important;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.card-type {
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.card-type.expense {
  background: rgba(0, 212, 200, 0.1);
  color: #00a99f;
}

.card-type.income {
  background: rgba(124, 140, 255, 0.1);
  color: #7c8cff;
}

.delete-btn {
  padding: 4rpx 20rpx;
  border-radius: 12rpx;
  background: #fff1f0;
  font-size: 22rpx;
  color: #ef4444;
}

.card-amount-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.card-icon {
  font-size: 40rpx;
  flex-shrink: 0;
}

.card-amount-wrap {
  flex: 1;
}

.card-remark {
  display: block;
  font-size: 24rpx;
  color: #88909b;
}

.card-amount-input-row {
  display: flex;
  align-items: baseline;
}

.card-currency {
  font-size: 28rpx;
  font-weight: 700;
  color: #1e1e1e;
}

.card-amount-input {
  flex: 1;
  height: 56rpx;
  font-size: 40rpx;
  font-weight: 800;
  color: #1e1e1e;
}

.card-fields {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

.card-field {
  flex: 1;
  padding: 12rpx 16rpx;
  border-radius: 16rpx;
  background: #f7f8fa;
}

.field-label {
  display: block;
  font-size: 20rpx;
  color: #88909b;
}

.field-value {
  height: 44rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: #1e1e1e;
}

/* 底部 */
.footer {
  position: fixed;
  z-index: 20;
  right: 24rpx;
  bottom: 0;
  left: 24rpx;
  display: flex;
  gap: 16rpx;
  padding: 16rpx 0 calc(env(safe-area-inset-bottom) + 16rpx);
  background: rgba(247, 248, 250, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.add-btn {
  width: 200rpx;
  height: 88rpx;
  border-radius: 44rpx;
  background: rgba(255, 255, 255, 0.9);
  color: #344054;
  font-size: 26rpx;
  line-height: 88rpx;
  flex-shrink: 0;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.confirm-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  background: linear-gradient(135deg, #00d4c8, #34d399);
  color: #fff;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 88rpx;
  box-shadow: 0 12rpx 36rpx rgba(0, 212, 200, 0.3);
}

.confirm-btn[disabled] {
  opacity: 0.5;
}
</style>
