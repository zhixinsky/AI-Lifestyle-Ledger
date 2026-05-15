<template>
  <PageShell>
    <view class="nav">
      <view class="nav-back" @tap="goBack">
        <view class="back-glass" />
        <image class="back-icon" :src="backIcon" />
      </view>
      <text class="nav-title">{{ spaceNavTitle }}</text>
      <view class="nav-placeholder" />
    </view>

    <view v-if="book" :class="['space-page', spaceThemeClass]">
      <view class="life-hero">
        <view class="hero-top">
          <view class="duo-avatars">
            <view
              v-for="(m, index) in coupleMembers"
              :key="m.id"
              :class="['duo-avatar', index === 1 ? 'second' : '']"
            >
              <image v-if="m.user.avatarUrl" class="avatar-img" :src="m.user.avatarUrl" mode="aspectFill" />
              <text v-else>{{ firstChar(m.user.nickname) }}</text>
            </view>
            <view v-if="coupleMembers.length < 2" class="duo-avatar empty">
              <text>+</text>
            </view>
          </view>
          <view class="invite-pill" @tap="copyCode(book?.inviteCode || '')">
            <text>邀请 {{ book?.inviteCode }}</text>
          </view>
        </view>
        <text class="space-name">{{ book?.name || defaultSpaceName }}</text>
        <text class="space-sub">{{ daysTogether }} 天一起记录生活</text>
      </view>

      <view class="ai-observe">
        <view class="observe-head">
          <text class="eyebrow">{{ observeLabel }}</text>
          <text class="observe-mark">Life</text>
        </view>
        <text class="observe-title">{{ spaceObservation.title }}</text>
        <text class="observe-text">{{ spaceObservation.text }}</text>
        <view class="observe-metrics">
          <view class="metric">
            <text class="metric-value">¥{{ formatAmount(totalExpense) }}</text>
            <text class="metric-label">共同支出</text>
          </view>
          <view class="metric">
            <text class="metric-value">{{ activeDays }}</text>
            <text class="metric-label">有记录天数</text>
          </view>
          <view class="metric">
            <text class="metric-value">{{ topCategoryName }}</text>
            <text class="metric-label">生活重心</text>
          </view>
        </view>
      </view>

      <view class="section-head">
        <text class="section-title">{{ timelineTitle }}</text>
        <text class="section-sub">不是账单，是生活片段</text>
      </view>
      <view v-if="timelineItems.length" class="timeline">
        <view v-for="item in timelineItems" :key="item.id" class="timeline-item">
          <view class="time-dot" />
          <view class="time-card">
            <view class="time-main">
              <text class="time-title">{{ item.title }}</text>
              <text class="time-amount">{{ item.amountText }}</text>
            </view>
            <text class="time-meta">{{ item.date }} · {{ item.person }}</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-life">
        <text class="empty-title">第一段生活还没开始记录</text>
        <text class="empty-text">{{ emptyTimelineText }}</text>
      </view>

      <view class="saving-panel">
        <view class="saving-copy">
          <text class="eyebrow">共同存钱目标</text>
          <text class="saving-title">{{ savingGoal.title }}</text>
          <text class="saving-desc">{{ savingGoal.desc }}</text>
        </view>
        <view class="saving-progress">
          <view class="progress-track">
            <view class="progress-fill" :style="{ width: savingGoal.percent + '%' }" />
          </view>
          <text class="progress-text">已完成 {{ savingGoal.percent }}%</text>
        </view>
      </view>

      <view class="report-grid">
        <view class="report-card">
          <text class="eyebrow">AI 周报</text>
          <text class="report-title">本周回忆</text>
          <text class="report-text">{{ weeklyMemory }}</text>
        </view>
        <view class="report-card">
          <text class="eyebrow">AI 月报</text>
          <text class="report-title">生活节奏</text>
          <text class="report-text">{{ monthlyRhythm }}</text>
        </view>
      </view>

      <view class="section-head">
        <text class="section-title">{{ badgeTitle }}</text>
        <text class="section-sub">{{ badgeSubTitle }}</text>
      </view>
      <view class="badge-list">
        <view v-for="badge in badges" :key="badge.name" :class="['life-badge', { earned: badge.earned }]">
          <text class="badge-icon">{{ badge.icon }}</text>
          <view class="badge-copy">
            <text class="badge-name">{{ badge.name }}</text>
            <text class="badge-desc">{{ badge.desc }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="actions">
      <button v-if="book?.myRole !== 'owner'" class="leave-btn" @tap="handleLeave">离开空间</button>
      <button v-if="book?.myRole === 'owner'" class="delete-btn" @tap="handleDelete">删除空间</button>
    </view>

    <view class="spacer" />
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { backIcon } from '@/utils/icons';
import PageShell from '@/components/PageShell.vue';
import { sharedBookApi } from '@/api/shared-book';
import type { AAStats, BookMember, SharedBook, Transaction } from '@/types/domain';
import { getLifeSpaceMeta } from '@/utils/life-space';

type SharedTransaction = Transaction & {
  user?: { id: string; nickname: string; avatarUrl?: string };
};

const book = ref<SharedBook | null>(null);
const aaStats = ref<AAStats | null>(null);
const transactions = ref<SharedTransaction[]>([]);
const bookId = ref('');

const spaceMeta = computed(() => getLifeSpaceMeta(book.value?.type));
const isCoupleSpace = computed(() => book.value?.type === 'couple' || book.value?.type === 'love');
const spaceThemeClass = computed(() => `space-page--${spaceMeta.value.theme}`);
const spaceNavTitle = computed(() => spaceMeta.value.name);
const defaultSpaceName = computed(() => spaceMeta.value.name);
const observeLabel = computed(() => `AI ${spaceMeta.value.name}观察`);
const timelineTitle = computed(() => `${spaceMeta.value.name}时间线`);
const emptyTimelineText = computed(() =>
  `${spaceMeta.value.description}。每一次记录都会成为这里的生活片段。`
);
const badgeTitle = computed(() => `${spaceMeta.value.name}徽章`);
const badgeSubTitle = computed(() => '慢慢经营出来的生活感');
const coupleMembers = computed<BookMember[]>(() => book.value?.members || []);
const totalExpense = computed(() =>
  transactions.value.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
);
const totalIncome = computed(() =>
  transactions.value.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
);
const activeDays = computed(() => new Set(transactions.value.map((tx) => formatDate(tx.occurredAt))).size);
const daysTogether = computed(() => {
  const joined = coupleMembers.value
    .map((m) => new Date(m.joinedAt).getTime())
    .filter((time) => Number.isFinite(time));
  if (!joined.length) return 1;
  return Math.max(1, Math.floor((Date.now() - Math.min(...joined)) / 86400000) + 1);
});

const topCategoryName = computed(() => {
  const map = new Map<string, number>();
  transactions.value
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      const name = tx.category?.name || '生活';
      map.set(name, (map.get(name) || 0) + Number(tx.amount || 0));
    });
  const top = [...map.entries()].sort((a, b) => b[1] - a[1])[0];
  return top?.[0] || '等待记录';
});

const spaceObservation = computed(() => {
  if (!transactions.value.length) {
    return {
      title: `${spaceMeta.value.name}会慢慢长出自己的节奏`,
      text: spaceMeta.value.aiIntro,
    };
  }
  const top = topCategoryName.value;
  const perPerson = aaStats.value?.perPerson || totalExpense.value / Math.max(1, coupleMembers.value.length || 2);
  return {
    title: `${top} 是最近最明显的生活主题`,
    text: `这段时间「${spaceMeta.value.name}」记录了 ${transactions.value.length} 个片段，人均支出约 ¥${formatAmount(perPerson)}。AI米粒会继续观察哪些钱花得值得，哪些节奏可以调轻一点。`,
  };
});

const timelineItems = computed(() =>
  transactions.value.slice(0, 8).map((tx) => ({
    id: tx.id,
    title: tx.remark || tx.category?.name || '一笔生活记录',
    date: formatDate(tx.occurredAt),
    person: tx.user?.nickname || '一起',
    amountText: `${tx.type === 'income' ? '+' : '-'}¥${formatAmount(tx.amount)}`,
  }))
);

const savingGoal = computed(() => {
  const saved = Math.max(0, totalIncome.value - totalExpense.value);
  const target = Math.max(3000, Math.ceil((totalExpense.value + 1) / 1000) * 1000);
  const percent = Math.min(100, Math.round((saved / target) * 100));
  return {
    title: `${spaceMeta.value.name}备用金`,
    desc: saved > 0
      ? `已沉淀 ¥${formatAmount(saved)}，继续把确定的小钱留给未来。`
      : '记录共同收入后，AI米粒会自动追踪离目标还有多远。',
    percent,
  };
});

const weeklyMemory = computed(() => {
  const latest = timelineItems.value[0];
  if (!latest) return '本周还没有新的共同记录，下一次一起吃饭、出行或购物时可以从这里开始。';
  return `最近一次是「${latest.title}」。这些小片段会被整理成本周回忆，而不只是冷冰冰的金额。`;
});

const monthlyRhythm = computed(() => {
  if (!transactions.value.length) return '暂无足够数据。连续记录一段时间后，AI 会分析你们的外食、通勤、购物和储蓄节奏。';
  return `本月生活重心偏向「${topCategoryName.value}」，共同支出 ¥${formatAmount(totalExpense.value)}。可以把高频但低幸福感的支出列为下周优化点。`;
});

const badges = computed(() => [
  { icon: '01', name: '开始经营', desc: `创建${spaceMeta.value.name}`, earned: Boolean(book.value) },
  { icon: '07', name: '七天生活感', desc: '一起记录满 7 天', earned: daysTogether.value >= 7 },
  { icon: '¥', name: '共同目标', desc: '开始追踪备用金', earned: totalIncome.value > 0 || totalExpense.value > 0 },
  { icon: 'AI', name: 'AI米粒观察员', desc: '拥有可分析的生活片段', earned: transactions.value.length >= 5 },
]);

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) uni.navigateBack();
  else uni.switchTab({ url: '/pages/index/index' });
}

function firstChar(value?: string) {
  return (value || '你').trim().charAt(0) || '你';
}

function formatDate(iso?: string) {
  if (!iso) return '';
  return iso.substring(5, 10);
}

function formatAmount(value: number) {
  return Number(value || 0).toFixed(2);
}

function copyCode(code: string) {
  if (!code) return;
  uni.setClipboardData({ data: code });
}

async function load() {
  try {
    book.value = await sharedBookApi.getDetail(bookId.value);
    const txRes = await sharedBookApi.listTransactions(bookId.value);
    transactions.value = txRes.items as SharedTransaction[];
    aaStats.value = await sharedBookApi.getAAStats(bookId.value);
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' });
  }
}

async function handleLeave() {
  uni.showModal({
    title: '确认离开',
    content: '离开后将不能再查看这个生活空间',
    async success(res) {
      if (!res.confirm) return;
      try {
        await sharedBookApi.leave(bookId.value);
        uni.showToast({ title: '已离开', icon: 'success' });
        setTimeout(() => uni.navigateBack(), 500);
      } catch {
        uni.showToast({ title: '操作失败', icon: 'none' });
      }
    },
  });
}

async function handleDelete() {
  uni.showModal({
    title: '确认删除',
    content: '删除后所有成员将无法访问这个生活空间',
    async success(res) {
      if (!res.confirm) return;
      try {
        await sharedBookApi.delete(bookId.value);
        uni.showToast({ title: '已删除', icon: 'success' });
        setTimeout(() => uni.navigateBack(), 500);
      } catch {
        uni.showToast({ title: '操作失败', icon: 'none' });
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
.nav { display: flex; align-items: center; justify-content: space-between; padding-bottom: 18rpx; }
.nav-back { position: relative; width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center; }
.back-glass { position: absolute; inset: 0; border-radius: 50%; background: rgba(255,255,255,0.62); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1rpx solid rgba(255,255,255,0.68); }
.back-icon { position: relative; z-index: 1; width: 36rpx; height: 36rpx; margin-left: -4rpx; }
.nav-title { font-size: 34rpx; font-weight: 750; color: #24352f; letter-spacing: 0; }
.nav-placeholder { width: 60rpx; }

.space-page { position: relative; }

.life-hero {
  padding: 34rpx 34rpx 38rpx;
  border-radius: 36rpx;
  background: linear-gradient(145deg, rgba(255,255,255,0.92), rgba(235,249,245,0.78));
  border: 1rpx solid rgba(255,255,255,0.8);
  box-shadow: 0 24rpx 70rpx rgba(77, 126, 112, 0.12);
}
.hero-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30rpx; }
.duo-avatars { display: flex; align-items: center; padding-left: 8rpx; }
.duo-avatar {
  width: 92rpx; height: 92rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(145deg, #2c574d, #8fcfbd);
  color: #fff; font-size: 34rpx; font-weight: 800;
  border: 5rpx solid rgba(255,255,255,0.88);
  box-shadow: 0 14rpx 34rpx rgba(36, 70, 62, 0.18);
  overflow: hidden;
}
.duo-avatar.second { margin-left: -22rpx; background: linear-gradient(145deg, #40516a, #c5d4c4); }
.duo-avatar.empty { margin-left: -22rpx; background: rgba(255,255,255,0.72); color: #71827b; border-style: dashed; }
.avatar-img { width: 100%; height: 100%; }
.invite-pill {
  height: 54rpx; padding: 0 22rpx; border-radius: 999rpx;
  display: flex; align-items: center;
  background: rgba(255,255,255,0.72);
  color: #60726b; font-size: 22rpx; font-weight: 650;
}
.space-name { display: block; font-size: 44rpx; font-weight: 820; color: #20352f; line-height: 1.25; }
.space-sub { display: block; margin-top: 10rpx; font-size: 26rpx; color: #71827b; }

.ai-observe {
  margin-top: 22rpx; padding: 30rpx;
  border-radius: 32rpx;
  background: rgba(255,255,255,0.72);
  border: 1rpx solid rgba(255,255,255,0.82);
  box-shadow: 0 18rpx 54rpx rgba(67, 98, 91, 0.1);
}
.observe-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18rpx; }
.eyebrow { font-size: 22rpx; color: #78908a; font-weight: 750; text-transform: uppercase; }
.observe-mark { font-size: 22rpx; color: #a3b0aa; font-weight: 700; }
.observe-title { display: block; font-size: 34rpx; line-height: 1.35; font-weight: 820; color: #263a34; }
.observe-text { display: block; margin-top: 14rpx; font-size: 26rpx; line-height: 1.7; color: #52635d; }
.observe-metrics { display: flex; gap: 14rpx; margin-top: 24rpx; }
.metric { flex: 1; min-width: 0; padding: 18rpx 14rpx; border-radius: 22rpx; background: rgba(241,247,244,0.9); }
.metric-value { display: block; font-size: 26rpx; font-weight: 820; color: #24352f; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.metric-label { display: block; margin-top: 6rpx; font-size: 20rpx; color: #81918b; }

.section-head { margin: 34rpx 6rpx 16rpx; display: flex; align-items: flex-end; justify-content: space-between; gap: 20rpx; }
.section-title { font-size: 31rpx; font-weight: 820; color: #253933; }
.section-sub { font-size: 22rpx; color: #87958f; }

.timeline { position: relative; padding-left: 20rpx; }
.timeline::before { content: ''; position: absolute; left: 27rpx; top: 18rpx; bottom: 18rpx; width: 2rpx; background: rgba(123, 152, 142, 0.18); }
.timeline-item { position: relative; display: flex; gap: 20rpx; padding-bottom: 18rpx; }
.time-dot { width: 16rpx; height: 16rpx; border-radius: 50%; background: #6fb7a5; margin-top: 32rpx; box-shadow: 0 0 0 8rpx rgba(111,183,165,0.12); z-index: 1; }
.time-card {
  flex: 1; min-width: 0; padding: 24rpx 26rpx;
  border-radius: 26rpx; background: rgba(255,255,255,0.76);
  border: 1rpx solid rgba(255,255,255,0.82);
}
.time-main { display: flex; align-items: center; gap: 18rpx; }
.time-title { flex: 1; min-width: 0; font-size: 28rpx; font-weight: 720; color: #263a34; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.time-amount { font-size: 26rpx; font-weight: 800; color: #32453f; }
.time-meta { display: block; margin-top: 8rpx; font-size: 22rpx; color: #87958f; }

.empty-life {
  padding: 34rpx 30rpx; border-radius: 28rpx; background: rgba(255,255,255,0.72);
  border: 1rpx solid rgba(255,255,255,0.82);
}
.empty-title { display: block; font-size: 30rpx; font-weight: 780; color: #263a34; }
.empty-text { display: block; margin-top: 10rpx; font-size: 24rpx; line-height: 1.6; color: #72817c; }

.saving-panel {
  margin-top: 26rpx; padding: 30rpx; border-radius: 32rpx;
  background: linear-gradient(145deg, rgba(45,72,65,0.94), rgba(87,118,107,0.9));
  box-shadow: 0 22rpx 60rpx rgba(36, 70, 62, 0.18);
}
.saving-panel .eyebrow { color: rgba(235,248,244,0.72); }
.saving-title { display: block; margin-top: 10rpx; font-size: 34rpx; font-weight: 820; color: #fff; }
.saving-desc { display: block; margin-top: 10rpx; font-size: 25rpx; line-height: 1.6; color: rgba(255,255,255,0.78); }
.saving-progress { margin-top: 26rpx; }
.progress-track { height: 14rpx; border-radius: 999rpx; background: rgba(255,255,255,0.2); overflow: hidden; }
.progress-fill { height: 100%; border-radius: 999rpx; background: linear-gradient(90deg, #d7f3df, #92dcc6); }
.progress-text { display: block; margin-top: 12rpx; font-size: 22rpx; color: rgba(255,255,255,0.76); text-align: right; }

.report-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18rpx; margin-top: 26rpx; }
.report-card { padding: 26rpx; border-radius: 28rpx; background: rgba(255,255,255,0.72); border: 1rpx solid rgba(255,255,255,0.82); }
.report-title { display: block; margin-top: 12rpx; font-size: 29rpx; font-weight: 820; color: #263a34; }
.report-text { display: block; margin-top: 10rpx; font-size: 23rpx; line-height: 1.55; color: #667771; }

.badge-list { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; }
.life-badge {
  min-height: 136rpx; padding: 22rpx; border-radius: 26rpx;
  display: flex; gap: 16rpx; align-items: center;
  background: rgba(255,255,255,0.52); border: 1rpx solid rgba(255,255,255,0.7);
  opacity: 0.54;
}
.life-badge.earned { opacity: 1; background: rgba(255,255,255,0.78); }
.badge-icon {
  width: 48rpx; height: 48rpx; border-radius: 16rpx;
  display: flex; align-items: center; justify-content: center;
  background: #eef6f2; color: #436c61; font-size: 20rpx; font-weight: 850;
}
.badge-copy { flex: 1; min-width: 0; }
.badge-name { display: block; font-size: 25rpx; font-weight: 780; color: #263a34; }
.badge-desc { display: block; margin-top: 6rpx; font-size: 20rpx; color: #7f8f89; line-height: 1.35; }

.members-card, .tx-card { padding: 24rpx 28rpx !important; }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16rpx; }
.plain-head { margin-top: 24rpx; }
.card-title { font-size: 28rpx; font-weight: 750; color: #1e1e1e; }
.member-count { font-size: 22rpx; color: #88909b; }
.member-row { display: flex; align-items: center; gap: 16rpx; padding: 12rpx 0; }
.member-avatar { width: 60rpx; height: 60rpx; border-radius: 50%; background: linear-gradient(135deg, #6fb7a5, #9eb7c3); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24rpx; font-weight: 750; }
.member-name { flex: 1; font-size: 28rpx; color: #1e1e1e; }
.member-role { font-size: 22rpx; color: #88909b; }
.tx-row { display: flex; align-items: center; justify-content: space-between; padding: 16rpx 0; border-bottom: 1rpx solid #f0f1f3; }
.tx-row:last-child { border-bottom: none; }
.tx-left { display: flex; align-items: center; gap: 16rpx; min-width: 0; }
.tx-cat-icon { font-size: 34rpx; }
.tx-info { display: flex; flex-direction: column; gap: 2rpx; min-width: 0; }
.tx-cat { font-size: 28rpx; color: #1e1e1e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tx-date { font-size: 22rpx; color: #88909b; }
.tx-amount { font-size: 30rpx; font-weight: 750; }
.tx-amount.expense { color: #1e1e1e; }
.tx-amount.income { color: #5ba995; }
.empty-hint { text-align: center; padding: 40rpx; font-size: 24rpx; color: #88909b; }

.actions { margin-top: 40rpx; display: flex; flex-direction: column; gap: 16rpx; }
.leave-btn, .delete-btn {
  height: 84rpx; line-height: 84rpx; border-radius: 42rpx; font-size: 28rpx; font-weight: 650;
  background: rgba(255,255,255,0.72);
}
.leave-btn { color: #8a7a58; }
.delete-btn { color: #b76860; }
.spacer { height: 60rpx; }

.space-page--couple .life-hero {
  background: linear-gradient(145deg, rgba(255,255,255,0.94), rgba(255,235,237,0.84));
  box-shadow: 0 24rpx 70rpx rgba(201, 126, 133, 0.14);
}
.space-page--couple .duo-avatar { background: linear-gradient(145deg, #a95f6f, #efb4bc); box-shadow: 0 14rpx 34rpx rgba(169, 95, 111, 0.2); }
.space-page--couple .duo-avatar.second { background: linear-gradient(145deg, #c9848f, #f2c9c3); }
.space-page--couple .invite-pill { color: #9d6570; background: rgba(255,250,250,0.72); }
.space-page--couple .eyebrow { color: #a7777d; }
.space-page--couple .metric { background: rgba(255,244,244,0.88); }
.space-page--couple .time-dot { background: #d98d99; box-shadow: 0 0 0 8rpx rgba(217,141,153,0.14); }
.space-page--couple .saving-panel {
  background: linear-gradient(145deg, rgba(139,78,90,0.95), rgba(209,139,148,0.9));
  box-shadow: 0 22rpx 60rpx rgba(169, 95, 111, 0.2);
}
.space-page--couple .progress-fill { background: linear-gradient(90deg, #ffe0df, #ffd2bc); }
.space-page--couple .badge-icon { background: #fff0f1; color: #a95f6f; }

.space-page--family .life-hero {
  background: linear-gradient(145deg, rgba(255,255,255,0.94), rgba(239,248,230,0.84));
  box-shadow: 0 24rpx 70rpx rgba(124, 151, 104, 0.13);
}
.space-page--family .duo-avatar { background: linear-gradient(145deg, #617d43, #b8cd85); box-shadow: 0 14rpx 34rpx rgba(97, 125, 67, 0.18); }
.space-page--family .duo-avatar.second { background: linear-gradient(145deg, #7d8d60, #d4d2a5); }
.space-page--family .invite-pill { color: #66784b; background: rgba(255,255,250,0.72); }
.space-page--family .eyebrow { color: #76885b; }
.space-page--family .metric { background: rgba(246,250,238,0.9); }
.space-page--family .time-dot { background: #9cb775; box-shadow: 0 0 0 8rpx rgba(156,183,117,0.14); }
.space-page--family .saving-panel {
  background: linear-gradient(145deg, rgba(83,104,55,0.95), rgba(141,160,93,0.9));
  box-shadow: 0 22rpx 60rpx rgba(97, 125, 67, 0.18);
}
.space-page--family .progress-fill { background: linear-gradient(90deg, #eff7c9, #cde596); }
.space-page--family .badge-icon { background: #f1f7e6; color: #617d43; }

.space-page--mint .life-hero,
.space-page--cyan .life-hero {
  background: linear-gradient(145deg, rgba(255,255,255,0.94), rgba(231,249,245,0.84));
  box-shadow: 0 24rpx 70rpx rgba(76, 151, 134, 0.13);
}
.space-page--mint .duo-avatar,
.space-page--cyan .duo-avatar { background: linear-gradient(145deg, #4f9a8a, #9ae0ce); }
.space-page--mint .time-dot,
.space-page--cyan .time-dot { background: #75cdb8; box-shadow: 0 0 0 8rpx rgba(117,205,184,0.14); }

.space-page--rose .life-hero { background: linear-gradient(145deg, rgba(255,255,255,0.94), rgba(255,235,237,0.84)); box-shadow: 0 24rpx 70rpx rgba(201,126,133,0.14); }
.space-page--rose .duo-avatar { background: linear-gradient(145deg, #a95f6f, #efb4bc); }
.space-page--rose .invite-pill { color: #9d6570; background: rgba(255,250,250,0.72); }
.space-page--rose .eyebrow { color: #a7777d; }
.space-page--rose .time-dot { background: #d98d99; box-shadow: 0 0 0 8rpx rgba(217,141,153,0.14); }
.space-page--rose .saving-panel { background: linear-gradient(145deg, rgba(139,78,90,0.95), rgba(209,139,148,0.9)); }
.space-page--rose .progress-fill { background: linear-gradient(90deg, #ffe0df, #ffd2bc); }
.space-page--rose .badge-icon { background: #fff0f1; color: #a95f6f; }

.space-page--olive .life-hero { background: linear-gradient(145deg, rgba(255,255,255,0.94), rgba(239,248,230,0.84)); box-shadow: 0 24rpx 70rpx rgba(124,151,104,0.13); }
.space-page--olive .duo-avatar { background: linear-gradient(145deg, #617d43, #b8cd85); }
.space-page--olive .time-dot { background: #9cb775; box-shadow: 0 0 0 8rpx rgba(156,183,117,0.14); }
.space-page--olive .saving-panel { background: linear-gradient(145deg, rgba(83,104,55,0.95), rgba(141,160,93,0.9)); }
.space-page--olive .progress-fill { background: linear-gradient(90deg, #eff7c9, #cde596); }
.space-page--olive .badge-icon { background: #f1f7e6; color: #617d43; }

.space-page--blue .life-hero { background: linear-gradient(145deg, rgba(255,255,255,0.94), rgba(235,240,255,0.84)); box-shadow: 0 24rpx 70rpx rgba(91,112,180,0.13); }
.space-page--blue .duo-avatar { background: linear-gradient(145deg, #5d75c8, #b8c7ff); }
.space-page--blue .time-dot { background: #8da7f2; box-shadow: 0 0 0 8rpx rgba(141,167,242,0.14); }
.space-page--blue .saving-panel { background: linear-gradient(145deg, rgba(70,83,139,0.95), rgba(119,139,206,0.9)); }
.space-page--blue .progress-fill { background: linear-gradient(90deg, #dfe6ff, #b9c7ff); }
.space-page--blue .badge-icon { background: #eef2ff; color: #5d75c8; }

.space-page--amber .life-hero { background: linear-gradient(145deg, rgba(255,255,255,0.94), rgba(255,247,225,0.84)); box-shadow: 0 24rpx 70rpx rgba(163,127,57,0.12); }
.space-page--amber .duo-avatar { background: linear-gradient(145deg, #a98032, #e7c879); }
.space-page--amber .time-dot { background: #d9b76e; box-shadow: 0 0 0 8rpx rgba(217,183,110,0.14); }
.space-page--amber .saving-panel { background: linear-gradient(145deg, rgba(126,94,37,0.95), rgba(194,154,78,0.9)); }
.space-page--amber .progress-fill { background: linear-gradient(90deg, #fff0c7, #e7c879); }
.space-page--amber .badge-icon { background: #fff7e4; color: #a98032; }
</style>
