<template>
  <PageShell>
    <view class="nav">
      <view class="nav-back" @tap="goBack">
        <view class="back-glass" />
        <image class="back-icon" :src="backIcon" />
      </view>
      <text class="nav-title">首页卡片管理</text>
      <view class="nav-placeholder" />
    </view>

    <view class="hero">
      <text class="hero-title">定制你的 AI 生活首页</text>
      <text class="hero-sub">开启空间卡片、调整顺序，让概览页变成你的生活仪表盘。</text>
    </view>

    <view class="section-title">生活空间</view>
    <view class="card-list">
      <view v-for="(space, index) in spaces" :key="space.id" class="setting-card">
        <view class="space-icon" :style="{ background: iconGradient(space.color) }"><text>{{ space.icon }}</text></view>
        <view class="setting-copy">
          <text class="setting-title">{{ space.name }}</text>
          <text class="setting-sub">{{ space.description }}</text>
        </view>
        <switch :checked="space.isVisible" color="#64c8ad" @change="toggleSpace(index, $event)" />
        <view class="sort-actions">
          <text @tap="moveSpace(index, -1)">↑</text>
          <text @tap="moveSpace(index, 1)">↓</text>
        </view>
      </view>
    </view>

    <view class="section-title">AI 功能卡片</view>
    <view class="card-list">
      <view v-for="(card, index) in featureCards" :key="card.key" class="setting-card">
        <view class="space-icon feature"><text>{{ card.icon }}</text></view>
        <view class="setting-copy">
          <text class="setting-title">{{ card.title }}</text>
          <text class="setting-sub">{{ card.desc }}</text>
        </view>
        <switch :checked="card.visible" color="#64c8ad" @change="toggleFeature(index, $event)" />
        <view class="sort-actions">
          <text @tap="moveFeature(index, -1)">↑</text>
          <text @tap="moveFeature(index, 1)">↓</text>
        </view>
      </view>
    </view>

    <button class="save-btn" @tap="saveSettings">保存设置</button>
  </PageShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import PageShell from '@/components/PageShell.vue';
import { backIcon } from '@/utils/icons';
import { lifeSpaceApi } from '@/api/life-spaces';
import type { LifeSpace } from '@/types/domain';

interface FeatureCardSetting {
  key: string;
  title: string;
  desc: string;
  icon: string;
  visible: boolean;
}

const FEATURE_STORAGE_KEY = 'overview_feature_cards';
const spaces = ref<LifeSpace[]>([]);
const featureCards = ref<FeatureCardSetting[]>([
  { key: 'ai', title: 'AI分析', desc: '消费趋势与生活洞察', icon: 'AI', visible: true },
  { key: 'budget', title: '预算提醒', desc: '提前看见支出节奏', icon: '预', visible: true },
  { key: 'wealth', title: '财富成长', desc: '目标、存钱和成长路径', icon: '财', visible: true },
]);

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) uni.navigateBack();
  else uni.switchTab({ url: '/pages/profile/index' });
}

function iconGradient(color: string) {
  return `linear-gradient(145deg, ${color}, rgba(255,255,255,0.72))`;
}

function loadFeatureSettings() {
  const saved = uni.getStorageSync(FEATURE_STORAGE_KEY) as FeatureCardSetting[] | '';
  if (Array.isArray(saved) && saved.length) featureCards.value = saved;
}

async function loadSpaces() {
  spaces.value = await lifeSpaceApi.list().catch(() => []);
}

function move<T>(items: T[], index: number, offset: number) {
  const next = index + offset;
  if (next < 0 || next >= items.length) return;
  const [item] = items.splice(index, 1);
  items.splice(next, 0, item);
}

function moveSpace(index: number, offset: number) { move(spaces.value, index, offset); }
function moveFeature(index: number, offset: number) { move(featureCards.value, index, offset); }

function toggleSpace(index: number, event: any) {
  spaces.value[index].isVisible = Boolean(event.detail.value);
}

function toggleFeature(index: number, event: any) {
  featureCards.value[index].visible = Boolean(event.detail.value);
}

async function saveSettings() {
  spaces.value = await lifeSpaceApi.updateSettings(spaces.value.map((space, index) => ({
    id: space.id,
    sort: index,
    isVisible: space.isVisible,
  }))).catch(() => spaces.value);
  uni.setStorageSync(FEATURE_STORAGE_KEY, featureCards.value);
  uni.$emit('overview-card-settings-updated');
  uni.showToast({ title: '已保存', icon: 'success' });
}

onMounted(() => {
  loadFeatureSettings();
  loadSpaces();
});
</script>

<style scoped>
.nav { display: flex; align-items: center; justify-content: space-between; padding-bottom: 16rpx; }
.nav-back { position: relative; width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center; }
.back-glass { position: absolute; inset: 0; border-radius: 50%; background: rgba(255,255,255,0.62); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1rpx solid rgba(255,255,255,0.68); }
.back-icon { position: relative; z-index: 1; width: 36rpx; height: 36rpx; margin-left: -4rpx; }
.nav-title { font-size: 34rpx; font-weight: 760; color: #24352f; }
.nav-placeholder { width: 60rpx; }
.hero { padding: 34rpx 32rpx; border-radius: 34rpx; background: linear-gradient(145deg, rgba(255,255,255,0.9), rgba(229,249,244,0.72)); box-shadow: 0 24rpx 70rpx rgba(79,129,116,0.12); }
.hero-title { display: block; font-size: 38rpx; font-weight: 850; color: #20352f; }
.hero-sub { display: block; margin-top: 10rpx; font-size: 25rpx; line-height: 1.55; color: #667770; }
.section-title { margin: 30rpx 8rpx 14rpx; font-size: 26rpx; font-weight: 780; color: #50635d; }
.card-list { display: flex; flex-direction: column; gap: 16rpx; }
.setting-card { display: flex; align-items: center; gap: 18rpx; padding: 22rpx; border-radius: 28rpx; background: rgba(255,255,255,0.74); border: 1rpx solid rgba(255,255,255,0.82); box-shadow: 0 16rpx 42rpx rgba(67,98,91,0.08); }
.space-icon { width: 68rpx; height: 68rpx; border-radius: 24rpx; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24rpx; font-weight: 850; }
.space-icon.feature { background: linear-gradient(145deg, #4f8174, #9ee3d0); }
.setting-copy { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6rpx; }
.setting-title { font-size: 28rpx; font-weight: 780; color: #20352f; }
.setting-sub { font-size: 22rpx; color: #75837e; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sort-actions { display: flex; flex-direction: column; gap: 6rpx; color: #78908a; font-size: 28rpx; font-weight: 800; padding-left: 4rpx; }
.save-btn { margin-top: 30rpx; height: 88rpx; line-height: 88rpx; border-radius: 44rpx; color: #1f5147; font-size: 31rpx; font-weight: 780; background: linear-gradient(168deg, rgba(232,255,246,0.94), rgba(118,214,188,0.62)); box-shadow: 0 18rpx 48rpx rgba(92,200,168,0.2); }
</style>
