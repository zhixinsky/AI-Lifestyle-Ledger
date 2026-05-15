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

    <view class="section-title">默认卡片</view>
    <view class="overview-grid">
      <view
        v-for="(card, index) in defaultCards"
        :key="card.key"
        :class="['overview-card', card.className, { disabled: !card.visible }]"
      >
        <view class="overview-glass" />
        <view class="overview-content">
          <view class="overview-copy">
            <text class="overview-title">{{ card.title }}</text>
            <text class="overview-sub">{{ card.desc }}</text>
          </view>
          <text class="overview-toggle" @tap="toggleDefault(index)">{{ card.visible ? '显示' : '隐藏' }}</text>
        </view>
        <view class="sort-row">
          <text @tap="moveDefault(index, -1)">↑</text>
          <text @tap="moveDefault(index, 1)">↓</text>
        </view>
      </view>
    </view>

    <view class="section-title">可选生活空间</view>
    <view class="overview-grid">
      <view
        v-for="meta in selectableSpaces"
        :key="meta.type"
        :class="['overview-card', `space-card--${meta.theme}`, { disabled: !isSpaceVisible(meta.type) }]"
        @tap="toggleLifeSpace(meta.type)"
      >
        <view class="overview-glass" />
        <view class="overview-content">
          <view class="overview-copy">
            <text class="overview-title">{{ meta.name }}</text>
            <text class="overview-sub">{{ meta.description }}</text>
          </view>
          <view class="overview-space-icon" :style="{ background: iconGradient(meta.color) }">
            <text>{{ meta.icon }}</text>
          </view>
        </view>
        <text class="space-status">{{ isSpaceVisible(meta.type) ? '已显示' : '点击添加' }}</text>
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
import type { BookType, LifeSpace } from '@/types/domain';
import { creatableLifeSpaceMetas } from '@/utils/life-space';

interface FeatureCardSetting {
  key: string;
  title: string;
  desc: string;
  icon: string;
  visible: boolean;
  className: string;
}

const DEFAULT_STORAGE_KEY = 'overview_default_cards';
const spaces = ref<LifeSpace[]>([]);
const selectableSpaces = creatableLifeSpaceMetas;
const defaultCards = ref<FeatureCardSetting[]>([
  { key: 'daily', title: '日常生活', desc: '查看每日生活记录', icon: '日', visible: true, className: 'card-daily' },
  { key: 'ai', title: 'AI分析', desc: '消费趋势与生活洞察', icon: 'AI', visible: true, className: 'card-ai' },
  { key: 'wealth', title: '财富成长', desc: '目标、存钱和成长路径', icon: '财', visible: true, className: 'card-wealth' },
  { key: 'budget', title: '预算提醒', desc: '提前看见支出节奏', icon: '预', visible: true, className: 'card-budget' },
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
  const saved = uni.getStorageSync(DEFAULT_STORAGE_KEY) as FeatureCardSetting[] | '';
  if (Array.isArray(saved) && saved.length) {
    defaultCards.value = saved.map((item) => ({
      ...item,
      className: item.key === 'daily' ? 'card-daily' : item.key === 'budget' ? 'card-budget' : item.key === 'wealth' ? 'card-wealth' : 'card-ai',
    }));
    return;
  }
  const legacy = uni.getStorageSync('overview_feature_cards') as Array<any> | '';
  if (Array.isArray(legacy) && legacy.length) {
    const legacyMap = new Map(legacy.map((item) => [item.key, item]));
    defaultCards.value = defaultCards.value.map((item) => ({ ...item, visible: legacyMap.get(item.key)?.visible ?? item.visible }));
  }
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

function moveDefault(index: number, offset: number) { move(defaultCards.value, index, offset); }

function toggleDefault(index: number) {
  defaultCards.value[index].visible = !defaultCards.value[index].visible;
}

function findSpace(type: BookType) {
  return spaces.value.find((space) => space.type === type);
}

function isSpaceVisible(type: BookType) {
  return Boolean(findSpace(type)?.isVisible);
}

async function toggleLifeSpace(type: BookType) {
  const existing = findSpace(type);
  if (existing) {
    existing.isVisible = !existing.isVisible;
    return;
  }
  const created = await lifeSpaceApi.create(type).catch(() => null);
  if (created) spaces.value.push(created);
}

async function saveSettings() {
  spaces.value = await lifeSpaceApi.updateSettings(spaces.value.map((space, index) => ({
    id: space.id,
    sort: index,
    isVisible: space.isVisible,
  }))).catch(() => spaces.value);
  uni.setStorageSync(DEFAULT_STORAGE_KEY, defaultCards.value);
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
.overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14rpx; }
.overview-card {
  position: relative;
  min-height: 132rpx;
  overflow: hidden;
  border-radius: 22rpx;
  padding: 18rpx;
  box-shadow: 0 10rpx 30rpx rgba(35, 56, 51, 0.08);
  border-bottom: 4rpx solid rgba(79,129,116,0.2);
}
.overview-card.disabled { opacity: 0.5; }
.overview-glass {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.45);
  border: 1rpx solid rgba(255,255,255,0.56);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
}
.overview-content { position: relative; z-index: 1; display: flex; align-items: flex-start; justify-content: space-between; gap: 10rpx; }
.overview-copy { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4rpx; }
.overview-title { font-size: 27rpx; font-weight: 820; color: #20352f; }
.overview-sub { font-size: 20rpx; line-height: 1.35; color: #667770; }
.overview-toggle {
  flex-shrink: 0;
  padding: 5rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(255,255,255,0.58);
  color: #4f8174;
  font-size: 20rpx;
  font-weight: 760;
}
.sort-row { position: absolute; left: 18rpx; bottom: 12rpx; z-index: 2; display: flex; gap: 18rpx; color: rgba(79,129,116,0.76); font-size: 25rpx; font-weight: 850; }
.overview-space-icon {
  width: 54rpx;
  height: 54rpx;
  border-radius: 20rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 21rpx;
  font-weight: 850;
}
.space-status { position: absolute; left: 18rpx; bottom: 13rpx; z-index: 2; font-size: 21rpx; font-weight: 760; color: rgba(80,99,93,0.72); }
.card-daily { background: linear-gradient(145deg, rgba(16,185,129,0.18), rgba(5,150,105,0.24)); }
.card-ai { background: linear-gradient(145deg, rgba(139,92,246,0.18), rgba(99,102,241,0.24)); }
.card-wealth { background: linear-gradient(145deg, rgba(245,208,120,0.22), rgba(212,175,55,0.2)); }
.card-budget { background: linear-gradient(145deg, rgba(56,189,248,0.18), rgba(14,165,233,0.24)); }
.space-card--rose { background: linear-gradient(145deg, rgba(255,245,247,0.9), rgba(242,167,179,0.28)); border-bottom-color: rgba(242,167,179,0.36); }
.space-card--olive { background: linear-gradient(145deg, rgba(250,255,242,0.9), rgba(167,201,112,0.28)); border-bottom-color: rgba(167,201,112,0.34); }
.space-card--blue { background: linear-gradient(145deg, rgba(246,248,255,0.9), rgba(141,167,242,0.28)); border-bottom-color: rgba(141,167,242,0.34); }
.space-card--cyan { background: linear-gradient(145deg, rgba(244,253,255,0.9), rgba(124,199,232,0.28)); border-bottom-color: rgba(124,199,232,0.34); }
.space-card--amber { background: linear-gradient(145deg, rgba(255,250,238,0.9), rgba(217,183,110,0.3)); border-bottom-color: rgba(217,183,110,0.35); }
.save-btn { margin-top: 30rpx; height: 88rpx; line-height: 88rpx; border-radius: 44rpx; color: #1f5147; font-size: 31rpx; font-weight: 780; background: linear-gradient(168deg, rgba(232,255,246,0.94), rgba(118,214,188,0.62)); box-shadow: 0 18rpx 48rpx rgba(92,200,168,0.2); }
</style>
