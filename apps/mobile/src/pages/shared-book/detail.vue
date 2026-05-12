<template>
  <PageShell>
    <view class="nav">
      <view class="nav-back" @tap="goBack">
        <view class="back-glass" />
        <image class="back-icon" :src="backIcon" />
      </view>
      <text class="nav-title">{{ book?.name || '账本详情' }}</text>
      <view class="nav-placeholder" />
    </view>

    <!-- 成员列表 -->
    <MoonaCard class="members-card">
      <view class="card-header">
        <text class="card-title">成员</text>
        <text class="member-count">{{ book?.members?.length || 0 }}人</text>
      </view>
      <view v-for="m in book?.members" :key="m.id" class="member-row">
        <view class="member-avatar">
          <text>{{ m.user.nickname.charAt(0) }}</text>
        </view>
        <text class="member-name">{{ m.user.nickname }}</text>
        <text class="member-role">{{ roleText(m.role) }}</text>
      </view>
    </MoonaCard>

    <!-- AA 统计（情侣账本） -->
    <MoonaCard v-if="aaStats" class="aa-card">
      <view class="card-header">
        <text class="card-title">AA 统计</text>
        <text class="aa-total">总支出 ¥{{ aaStats.grandTotal.toFixed(2) }}</text>
      </view>
      <view v-for="m in aaStats.members" :key="m.userId" class="aa-row">
        <text class="aa-name">{{ m.nickname }}</text>
        <text class="aa-spent">¥{{ m.totalExpense.toFixed(2) }}</text>
        <text :class="['aa-diff', { positive: m.diff > 0, negative: m.diff < 0 }]">
          {{ m.diff > 0 ? '+' : '' }}{{ m.diff.toFixed(2) }}
        </text>
      </view>
      <view class="aa-fair">
        <text>人均 ¥{{ aaStats.perPerson.toFixed(2) }}</text>
      </view>
    </MoonaCard>

    <!-- 账本交易列表 -->
    <view class="card-header" style="margin-top: 24rpx;">
      <text class="card-title">最近账单</text>
    </view>
    <MoonaCard v-if="transactions.length" class="tx-card">
      <view v-for="tx in transactions" :key="tx.id" class="tx-row">
        <view class="tx-left">
          <text class="tx-cat-icon">{{ tx.category?.icon || '📝' }}</text>
          <view class="tx-info">
            <text class="tx-cat">{{ tx.category?.name }}</text>
            <text class="tx-date">{{ formatDate(tx.occurredAt) }} · {{ tx.user?.nickname }}</text>
          </view>
        </view>
        <text :class="['tx-amount', tx.type]">{{ tx.type === 'income' ? '+' : '-' }}¥{{ tx.amount.toFixed(2) }}</text>
      </view>
    </MoonaCard>
    <view v-else class="empty-hint">
      <text>还没有账单记录</text>
    </view>

    <!-- 操作按钮 -->
    <view class="actions">
      <button v-if="book?.myRole !== 'owner'" class="leave-btn" @tap="handleLeave">离开账本</button>
      <button v-if="book?.myRole === 'owner'" class="delete-btn" @tap="handleDelete">删除账本</button>
    </view>

    <view class="spacer" />
  </PageShell>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { backIcon } from '@/utils/icons';
import PageShell from '@/components/PageShell.vue';
import MoonaCard from '@/components/MoonaCard.vue';
import { sharedBookApi } from '@/api/shared-book';
import type { SharedBook, AAStats } from '@/types/domain';

const book = ref<SharedBook | null>(null);
const aaStats = ref<AAStats | null>(null);
const transactions = ref<any[]>([]);

const bookId = ref('');

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) { uni.navigateBack(); }
  else { uni.switchTab({ url: '/pages/index/index' }); }
}

function roleText(role: string) {
  return role === 'owner' ? '创建者' : role === 'admin' ? '管理员' : '成员';
}

function formatDate(iso: string) {
  return iso.substring(5, 10);
}

async function load() {
  try {
    book.value = await sharedBookApi.getDetail(bookId.value);
    const txRes = await sharedBookApi.listTransactions(bookId.value);
    transactions.value = txRes.items;
    aaStats.value = await sharedBookApi.getAAStats(bookId.value);
  } catch {}
}

async function handleLeave() {
  uni.showModal({
    title: '确认离开',
    content: '离开后将不能再查看此账本',
    async success(res) {
      if (res.confirm) {
        try {
          await sharedBookApi.leave(bookId.value);
          uni.showToast({ title: '已离开', icon: 'success' });
          setTimeout(() => uni.navigateBack(), 500);
        } catch { uni.showToast({ title: '操作失败', icon: 'none' }); }
      }
    },
  });
}

async function handleDelete() {
  uni.showModal({
    title: '确认删除',
    content: '删除后所有成员将无法访问此账本',
    async success(res) {
      if (res.confirm) {
        try {
          await sharedBookApi.delete(bookId.value);
          uni.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => uni.navigateBack(), 500);
        } catch { uni.showToast({ title: '操作失败', icon: 'none' }); }
      }
    },
  });
}

onMounted(() => {
  const pages = getCurrentPages();
  const current = pages[pages.length - 1];
  bookId.value = (current as any)?.options?.id || '';
  if (bookId.value) load();
});
</script>

<style scoped>
.nav { display: flex; align-items: center; justify-content: space-between; padding-bottom: 16rpx; }
.nav-back { position: relative; width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center; }
.back-glass { position: absolute; top: 0; right: 0; bottom: 0; left: 0; border-radius: 50%; background: rgba(255,255,255,0.55); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1rpx solid rgba(255,255,255,0.5); }
.back-icon { position: relative; z-index: 1; width: 36rpx; height: 36rpx; margin-left: -4rpx; }
.nav-title { font-size: 34rpx; font-weight: 700; color: #1e1e1e; }
.nav-placeholder { width: 60rpx; }

.members-card, .aa-card, .tx-card { padding: 24rpx 28rpx !important; }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16rpx; }
.card-title { font-size: 28rpx; font-weight: 700; color: #1e1e1e; }
.member-count, .aa-total { font-size: 22rpx; color: #88909b; }

.member-row { display: flex; align-items: center; gap: 16rpx; padding: 12rpx 0; }
.member-avatar {
  width: 60rpx; height: 60rpx; border-radius: 50%; background: linear-gradient(135deg, #00d4c8, #7cbcff);
  display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24rpx; font-weight: 700;
}
.member-name { flex: 1; font-size: 28rpx; color: #1e1e1e; }
.member-role { font-size: 22rpx; color: #88909b; }

.aa-row { display: flex; align-items: center; gap: 16rpx; padding: 12rpx 0; }
.aa-name { flex: 1; font-size: 28rpx; color: #1e1e1e; }
.aa-spent { font-size: 28rpx; font-weight: 600; color: #1e1e1e; }
.aa-diff { font-size: 24rpx; font-weight: 600; min-width: 100rpx; text-align: right; }
.aa-diff.positive { color: #ff6b6b; }
.aa-diff.negative { color: #00d4c8; }
.aa-fair { text-align: center; padding-top: 16rpx; border-top: 1rpx solid #f0f1f3; font-size: 24rpx; color: #88909b; }

.tx-row { display: flex; align-items: center; justify-content: space-between; padding: 16rpx 0; border-bottom: 1rpx solid #f0f1f3; }
.tx-row:last-child { border-bottom: none; }
.tx-left { display: flex; align-items: center; gap: 16rpx; }
.tx-cat-icon { font-size: 36rpx; }
.tx-info { display: flex; flex-direction: column; gap: 2rpx; }
.tx-cat { font-size: 28rpx; color: #1e1e1e; }
.tx-date { font-size: 22rpx; color: #88909b; }
.tx-amount { font-size: 30rpx; font-weight: 700; }
.tx-amount.expense { color: #1e1e1e; }
.tx-amount.income { color: #00d4c8; }

.empty-hint { text-align: center; padding: 40rpx; font-size: 24rpx; color: #88909b; }

.actions { margin-top: 40rpx; display: flex; flex-direction: column; gap: 16rpx; }
.leave-btn, .delete-btn {
  height: 84rpx; line-height: 84rpx; border-radius: 42rpx; font-size: 28rpx; font-weight: 600;
  background: rgba(255,255,255,0.8);
}
.leave-btn { color: #ff9a76; }
.delete-btn { color: #ff6b6b; }

.spacer { height: 60rpx; }
</style>
