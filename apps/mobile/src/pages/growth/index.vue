<template>
  <PageShell>
    <view class="nav">
      <view class="nav-back" @tap="goBack">
        <view class="back-glass" />
        <image class="back-icon" :src="backIcon" />
      </view>
      <text class="nav-title">成长中心</text>
      <view class="nav-placeholder" />
    </view>

    <!-- 成就统计 -->
    <MoonaCard>
      <view class="stats-row">
        <view class="stat-item">
          <text class="stat-num">{{ earnedCount }}</text>
          <text class="stat-label">已获勋章</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <text class="stat-num">{{ completedChallenges }}</text>
          <text class="stat-label">已完成挑战</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <text class="stat-num">{{ activeChallenges }}</text>
          <text class="stat-label">进行中</text>
        </view>
      </view>
    </MoonaCard>

    <!-- 勋章墙 -->
    <view class="section-header">
      <text class="section-title">🏅 勋章墙</text>
    </view>
    <MoonaCard class="badges-card">
      <view class="badge-grid">
        <view v-for="badge in badges" :key="badge.id" :class="['badge-item', { earned: badge.earned }]">
          <text class="badge-icon">{{ badge.icon }}</text>
          <text class="badge-name">{{ badge.name }}</text>
          <text v-if="badge.earned" class="badge-date">{{ formatDate(badge.earnedAt!) }}</text>
          <text v-else class="badge-lock">🔒</text>
        </view>
      </view>
    </MoonaCard>

    <!-- 挑战列表 -->
    <view class="section-header">
      <text class="section-title">🏆 挑战</text>
    </view>
    <view class="challenge-list">
      <MoonaCard v-for="c in challenges" :key="c.id" class="challenge-card">
        <view class="challenge-top">
          <text class="challenge-icon">{{ c.icon }}</text>
          <view class="challenge-info">
            <text class="challenge-name">{{ c.name }}</text>
            <text class="challenge-desc">{{ c.description }}</text>
          </view>
          <view v-if="c.completed" class="challenge-badge-done">
            <text>✅</text>
          </view>
        </view>

        <view v-if="c.joined && !c.completed" class="progress-section">
          <view class="progress-track">
            <view class="progress-fill" :style="{ width: progressPct(c) + '%' }" />
          </view>
          <text class="progress-text">{{ c.progress }} / {{ c.targetValue }}</text>
        </view>

        <button v-if="!c.joined" class="join-btn" @tap="joinChallenge(c.id)">参加挑战</button>
        <text v-else-if="c.completed" class="completed-text">🎉 已完成</text>
      </MoonaCard>
    </view>

    <view class="spacer" />
  </PageShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { backIcon } from '@/utils/icons';
import PageShell from '@/components/PageShell.vue';
import MoonaCard from '@/components/MoonaCard.vue';
import { growthApi } from '@/api/growth';
import type { Badge, Challenge } from '@/types/domain';

const badges = ref<Badge[]>([]);
const challenges = ref<Challenge[]>([]);

const earnedCount = computed(() => badges.value.filter((b) => b.earned).length);
const completedChallenges = computed(() => challenges.value.filter((c) => c.completed).length);
const activeChallenges = computed(() => challenges.value.filter((c) => c.joined && !c.completed).length);

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) { uni.navigateBack(); }
  else { uni.switchTab({ url: '/pages/mili/index' }); }
}

function formatDate(iso: string) {
  return iso.substring(0, 10);
}

function progressPct(c: Challenge) {
  return Math.min(100, Math.round((c.progress / c.targetValue) * 100));
}

async function joinChallenge(id: string) {
  try {
    await growthApi.joinChallenge(id);
    uni.showToast({ title: '已加入挑战', icon: 'success' });
    loadData();
  } catch { uni.showToast({ title: '加入失败', icon: 'none' }); }
}

async function loadData() {
  try {
    const [b, c] = await Promise.all([growthApi.listBadges(), growthApi.listChallenges()]);
    badges.value = b;
    challenges.value = c;
  } catch {}
}

onMounted(loadData);
</script>

<style scoped>
.nav { display: flex; align-items: center; justify-content: space-between; padding-bottom: 16rpx; }
.nav-back { position: relative; width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center; }
.back-glass { position: absolute; top: 0; right: 0; bottom: 0; left: 0; border-radius: 50%; background: rgba(255,255,255,0.55); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1rpx solid rgba(255,255,255,0.5); }
.back-icon { position: relative; z-index: 1; width: 36rpx; height: 36rpx; margin-left: -4rpx; }
.nav-title { font-size: 34rpx; font-weight: 700; color: #1e1e1e; }
.nav-placeholder { width: 60rpx; }

.stats-row {
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4rpx; }
.stat-num { font-size: 40rpx; font-weight: 800; color: #00d4c8; }
.stat-label { font-size: 22rpx; color: #88909b; }
.stat-divider { width: 1rpx; height: 60rpx; background: #f0f1f3; }

.section-header { margin: 28rpx 0 12rpx 8rpx; }
.section-title { font-size: 30rpx; font-weight: 700; color: #1e1e1e; }

.badges-card { padding: 24rpx !important; }
.badge-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.badge-item {
  width: calc(25% - 12rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  padding: 16rpx 8rpx;
  border-radius: 16rpx;
  background: #f7f8fa;
  opacity: 0.5;
}
.badge-item.earned { opacity: 1; background: rgba(0, 212, 200, 0.06); }
.badge-icon { font-size: 40rpx; }
.badge-name { font-size: 20rpx; color: #1e1e1e; font-weight: 600; text-align: center; }
.badge-date { font-size: 18rpx; color: #88909b; }
.badge-lock { font-size: 18rpx; }

.challenge-list { display: flex; flex-direction: column; gap: 16rpx; }
.challenge-card { padding: 24rpx 28rpx !important; }
.challenge-top { display: flex; align-items: center; gap: 16rpx; }
.challenge-icon { font-size: 44rpx; }
.challenge-info { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.challenge-name { font-size: 28rpx; font-weight: 700; color: #1e1e1e; }
.challenge-desc { font-size: 22rpx; color: #88909b; }
.challenge-badge-done { font-size: 32rpx; }

.progress-section { margin-top: 16rpx; }
.progress-track { height: 12rpx; border-radius: 6rpx; background: #f0f1f3; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 6rpx; background: linear-gradient(90deg, #00d4c8, #7cbcff); transition: width 0.3s; }
.progress-text { font-size: 22rpx; color: #88909b; margin-top: 8rpx; text-align: right; }

.join-btn {
  margin-top: 16rpx; height: 68rpx; line-height: 68rpx; border-radius: 34rpx;
  background: linear-gradient(135deg, #00d4c8, #00b8a9); color: #fff; font-size: 26rpx; font-weight: 600;
}
.completed-text { margin-top: 12rpx; font-size: 24rpx; color: #00d4c8; text-align: center; }

.spacer { height: 60rpx; }
</style>
