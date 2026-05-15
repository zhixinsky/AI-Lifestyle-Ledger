<template>
  <PageShell>
    <view class="nav">
      <view class="nav-back" @tap="goBack">
        <view class="back-glass" />
        <image class="back-icon" :src="backIcon" />
      </view>
      <text class="nav-title">概览卡片管理</text>
      <view class="nav-placeholder" />
    </view>

    <view class="hero">
      <text class="hero-title">定制你的 AI 生活首页</text>
      <text class="hero-sub">选择 4 张卡片展示在概览页，按住上方卡片拖动调整顺序。</text>
    </view>

    <view class="section-title">概览显示卡片：{{ selectedCount }}/4</view>
    <view class="widget-row preview-widget-row">
      <view
        v-for="(card, index) in selectedCards"
        :key="card.key"
        :class="['widget-card', card.className, { dragging: draggingKey === card.key }]"
        @touchstart="onPreviewTouchStart($event, index, card.key)"
        @touchmove.prevent="onPreviewTouchMove"
        @touchend="onPreviewTouchEnd"
        @touchcancel="onPreviewTouchEnd"
      >
        <view class="drag-grip"><text>⋮⋮</text></view>
        <view class="widget-glass" />
        <view class="widget-content">
          <view class="widget-text">
            <text class="widget-title">{{ card.title }}</text>
            <text class="widget-sub">{{ card.desc }}</text>
          </view>
          <view :class="['widget-icon-area', card.source === 'space' ? `space-icon-${card.theme}` : `widget-icon-${card.visual}`]">
            <template v-if="card.visual === 'ai'">
              <view class="wi-orb" />
              <view class="wi-ring" />
              <view class="wi-bar wi-bar-1" />
              <view class="wi-bar wi-bar-2" />
              <view class="wi-bar wi-bar-3" />
            </template>
            <template v-else-if="card.visual === 'wealth'">
              <view class="ww-coin" />
              <view class="ww-arrow" />
              <view class="ww-curve" />
            </template>
            <template v-else-if="card.visual === 'budget'">
              <view class="wb-ring-track" />
              <view class="wb-ring-fill" />
              <view class="wb-dot" />
              <view class="wb-bar wb-bar-1" />
              <view class="wb-bar wb-bar-2" />
            </template>
            <template v-else-if="card.visual === 'love'">
              <text class="love-heart">♥</text>
              <view class="love-ring" />
              <view class="love-dot" />
            </template>
            <template v-else-if="card.visual === 'family'">
              <view class="home-roof" />
              <view class="home-body" />
              <view class="home-door" />
            </template>
            <template v-else-if="card.visual === 'work'">
              <view class="work-case" />
              <view class="work-handle" />
              <view class="work-line" />
            </template>
            <template v-else-if="card.visual === 'travel'">
              <view class="travel-route" />
              <view class="travel-pin travel-pin-a" />
              <view class="travel-pin travel-pin-b" />
            </template>
            <template v-else-if="card.visual === 'campus'">
              <view class="campus-book" />
              <view class="campus-book campus-book-r" />
              <view class="campus-line" />
            </template>
            <template v-else>
              <view class="wbl-receipt" />
              <view class="wbl-line wbl-line-1" />
              <view class="wbl-line wbl-line-2" />
              <view class="wbl-line wbl-line-3" />
            </template>
          </view>
        </view>
        <view class="widget-shimmer" />
      </view>
      <view v-for="slot in emptySlots" :key="`empty-${slot}`" class="widget-card empty-slot">
        <text>选择卡片</text>
      </view>
    </view>

    <view class="section-title">所有卡片</view>
    <view class="widget-row all-widget-row">
      <view
        v-for="card in allCards"
        :key="card.key"
        :class="['widget-card', card.className, { disabled: !card.visible }]"
        @tap="toggleCard(card)"
      >
        <view :class="['check-mark', { active: card.visible }]"><text>✓</text></view>
        <view class="widget-glass" />
        <view class="widget-content">
          <view class="widget-text">
            <text class="widget-title">{{ card.title }}</text>
            <text class="widget-sub">{{ card.desc }}</text>
          </view>
          <view :class="['widget-icon-area', card.source === 'space' ? `space-icon-${card.theme}` : `widget-icon-${card.visual}`]">
            <template v-if="card.visual === 'ai'">
              <view class="wi-orb" />
              <view class="wi-ring" />
              <view class="wi-bar wi-bar-1" />
              <view class="wi-bar wi-bar-2" />
              <view class="wi-bar wi-bar-3" />
            </template>
            <template v-else-if="card.visual === 'wealth'">
              <view class="ww-coin" />
              <view class="ww-arrow" />
              <view class="ww-curve" />
            </template>
            <template v-else-if="card.visual === 'budget'">
              <view class="wb-ring-track" />
              <view class="wb-ring-fill" />
              <view class="wb-dot" />
              <view class="wb-bar wb-bar-1" />
              <view class="wb-bar wb-bar-2" />
            </template>
            <template v-else-if="card.visual === 'love'">
              <text class="love-heart">♥</text>
              <view class="love-ring" />
              <view class="love-dot" />
            </template>
            <template v-else-if="card.visual === 'family'">
              <view class="home-roof" />
              <view class="home-body" />
              <view class="home-door" />
            </template>
            <template v-else-if="card.visual === 'work'">
              <view class="work-case" />
              <view class="work-handle" />
              <view class="work-line" />
            </template>
            <template v-else-if="card.visual === 'travel'">
              <view class="travel-route" />
              <view class="travel-pin travel-pin-a" />
              <view class="travel-pin travel-pin-b" />
            </template>
            <template v-else-if="card.visual === 'campus'">
              <view class="campus-book" />
              <view class="campus-book campus-book-r" />
              <view class="campus-line" />
            </template>
            <template v-else>
              <view class="wbl-receipt" />
              <view class="wbl-line wbl-line-1" />
              <view class="wbl-line wbl-line-2" />
              <view class="wbl-line wbl-line-3" />
            </template>
          </view>
        </view>
        <view class="widget-shimmer" />
      </view>
    </view>

    <button class="save-btn" @tap="saveSettings">保存设置</button>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
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
  visual: string;
  sort: number;
}

interface CardItem extends FeatureCardSetting {
  source: 'default' | 'space';
  type?: BookType;
  id?: string;
  theme?: string;
}

const DEFAULT_STORAGE_KEY = 'overview_default_cards';
const spaces = ref<LifeSpace[]>([]);
const selectableSpaces = creatableLifeSpaceMetas;
const DEFAULT_CARD_SETTINGS: FeatureCardSetting[] = [
  { key: 'daily', title: '日常生活', desc: '查看每日生活记录', icon: '日', visible: true, className: 'widget-bills', visual: 'bills', sort: 0 },
  { key: 'ai', title: 'AI分析', desc: '消费趋势洞察', icon: 'AI', visible: true, className: 'widget-ai', visual: 'ai', sort: 1 },
  { key: 'wealth', title: '财富成长', desc: '资产持续增长', icon: '财', visible: true, className: 'widget-wealth', visual: 'wealth', sort: 2 },
  { key: 'budget', title: '预算管理', desc: '合理规划支出', icon: '预', visible: true, className: 'widget-budget', visual: 'budget', sort: 3 },
];
const defaultCards = ref<FeatureCardSetting[]>(DEFAULT_CARD_SETTINGS.map((card) => ({ ...card })));
const selectedCount = computed(() =>
  defaultCards.value.filter((card) => card.visible).length + spaces.value.filter((space) => space.isVisible && space.type !== 'daily').length
);
const draggingKey = ref('');
const dragStartX = ref(0);
const dragCurrentIndex = ref(-1);
const dragThreshold = ref(64);

const allCards = computed<CardItem[]>(() => [
  ...defaultCards.value.map((card) => ({ ...card, source: 'default' as const })),
  ...selectableSpaces.map((meta, index) => {
    const space = findSpace(meta.type);
    return {
      key: `space-${meta.type}`,
      title: meta.name,
      desc: meta.description,
      icon: meta.icon,
      visible: Boolean(space?.isVisible),
      className: `space-widget--${meta.theme}`,
      visual: meta.type,
      sort: space?.sort ?? 100 + index,
      source: 'space' as const,
      type: meta.type,
      id: space?.id,
      theme: meta.theme,
    };
  }),
]);
const selectedCards = computed(() => allCards.value.filter((card) => card.visible).sort((a, b) => a.sort - b.sort).slice(0, 4));
const emptySlots = computed(() => Array.from({ length: Math.max(0, 4 - selectedCards.value.length) }, (_, index) => index));

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) uni.navigateBack();
  else uni.switchTab({ url: '/pages/profile/index' });
}

function normalizeDefaultCard(item: FeatureCardSetting): FeatureCardSetting {
  const fallback = DEFAULT_CARD_SETTINGS.find((card) => card.key === item.key) || DEFAULT_CARD_SETTINGS[0];
  return {
    ...fallback,
    ...item,
    title: fallback.title,
    desc: fallback.desc,
    className: fallback.className,
    visual: fallback.visual,
    sort: item.sort ?? fallback.sort,
  };
}

function applyDefaultSettings(items: Array<{ key: string; sort?: number; isVisible?: boolean }>) {
  const settingMap = new Map(items.map((item) => [item.key, item]));
  defaultCards.value = DEFAULT_CARD_SETTINGS
    .map((card, index) => ({
      ...card,
      visible: settingMap.get(card.key)?.isVisible ?? card.visible,
      sort: settingMap.get(card.key)?.sort ?? index,
    }))
    .sort((a, b) => a.sort - b.sort)
    .map((card) => card);
}

function getLegacyDefaultSettings() {
  const saved = uni.getStorageSync(DEFAULT_STORAGE_KEY) as FeatureCardSetting[] | '';
  if (Array.isArray(saved) && saved.length) {
    return saved.map(normalizeDefaultCard);
  }
  const legacy = uni.getStorageSync('overview_feature_cards') as Array<any> | '';
  if (Array.isArray(legacy) && legacy.length) {
    const legacyMap = new Map(legacy.map((item) => [item.key, item]));
    return DEFAULT_CARD_SETTINGS.map((item) => ({ ...item, visible: legacyMap.get(item.key)?.visible ?? item.visible }));
  }
  return [];
}

async function loadFeatureSettings() {
  const legacySettings = getLegacyDefaultSettings();
  const remoteSettings = await lifeSpaceApi.homeCards().catch(() => []);
  if (remoteSettings.length) {
    const remoteAllVisible = remoteSettings.every((item) => item.isVisible);
    const legacyHasCustomVisible = legacySettings.length && legacySettings.some((item) => !item.visible);
    if (remoteAllVisible && legacyHasCustomVisible) {
      defaultCards.value = legacySettings;
      await lifeSpaceApi.updateHomeCards(defaultCards.value.map((card, index) => ({
        key: card.key,
        sort: index,
        isVisible: card.visible,
      }))).catch(() => []);
      return;
    }
    applyDefaultSettings(remoteSettings);
    return;
  }
  if (legacySettings.length) defaultCards.value = legacySettings;
}

async function loadSpaces() {
  spaces.value = await lifeSpaceApi.list().catch(() => []);
}

function toggleDefault(index: number) {
  if (!defaultCards.value[index].visible && selectedCount.value >= 4) {
    uni.showToast({ title: '首页最多显示4张卡片', icon: 'none' });
    return;
  }
  defaultCards.value[index].visible = !defaultCards.value[index].visible;
  if (defaultCards.value[index].visible) defaultCards.value[index].sort = nextSort();
  syncSelectedSort();
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
    if (!existing.isVisible && selectedCount.value >= 4) {
      uni.showToast({ title: '首页最多显示4张卡片', icon: 'none' });
      return;
    }
    existing.isVisible = !existing.isVisible;
    if (existing.isVisible) existing.sort = nextSort();
    syncSelectedSort();
    return;
  }
  if (selectedCount.value >= 4) {
    uni.showToast({ title: '首页最多显示4张卡片', icon: 'none' });
    return;
  }
  const created = await lifeSpaceApi.create(type).catch(() => null);
  if (created) {
    created.sort = nextSort();
    spaces.value.push(created);
    syncSelectedSort();
  }
}

function toggleCard(card: CardItem) {
  if (card.source === 'default') {
    const index = defaultCards.value.findIndex((item) => item.key === card.key);
    if (index >= 0) toggleDefault(index);
    return;
  }
  if (card.type) toggleLifeSpace(card.type);
}

function nextSort() {
  const selected = allCards.value.filter((card) => card.visible);
  return selected.length ? Math.max(...selected.map((card) => card.sort)) + 1 : 0;
}

function setCardSort(key: string, sort: number) {
  const defaultCard = defaultCards.value.find((card) => card.key === key);
  if (defaultCard) {
    defaultCard.sort = sort;
    return;
  }
  const type = key.replace('space-', '') as BookType;
  const space = findSpace(type);
  if (space) space.sort = sort;
}

function syncSelectedSort(order = selectedCards.value) {
  order.forEach((card, index) => setCardSort(card.key, index));
}

function reorderSelected(from: number, to: number) {
  const ordered = [...selectedCards.value];
  if (from < 0 || to < 0 || from === to || from >= ordered.length || to >= ordered.length) return;
  const [moving] = ordered.splice(from, 1);
  ordered.splice(to, 0, moving);
  syncSelectedSort(ordered);
}

function onPreviewTouchStart(event: any, index: number, key: string) {
  draggingKey.value = key;
  dragCurrentIndex.value = index;
  dragStartX.value = event.touches?.[0]?.clientX || 0;
  const screenWidth = uni.getSystemInfoSync().windowWidth || 375;
  dragThreshold.value = Math.max(48, Math.floor(screenWidth / 5));
}

function onPreviewTouchMove(event: any) {
  if (!draggingKey.value) return;
  const x = event.touches?.[0]?.clientX || dragStartX.value;
  const delta = x - dragStartX.value;
  if (Math.abs(delta) < dragThreshold.value) return;
  const direction = delta > 0 ? 1 : -1;
  const target = Math.max(0, Math.min(selectedCards.value.length - 1, dragCurrentIndex.value + direction));
  if (target !== dragCurrentIndex.value) {
    reorderSelected(dragCurrentIndex.value, target);
    dragCurrentIndex.value = target;
    dragStartX.value = x;
  }
}

function onPreviewTouchEnd() {
  draggingKey.value = '';
  dragStartX.value = 0;
  dragCurrentIndex.value = -1;
}

async function saveSettings() {
  if (selectedCount.value > 4) {
    uni.showToast({ title: '首页最多显示4张卡片，请先关闭多余卡片', icon: 'none' });
    return;
  }
  await lifeSpaceApi.updateHomeCards(defaultCards.value.map((card, index) => ({
    key: card.key,
    sort: card.sort ?? index,
    isVisible: card.visible,
  }))).catch(() => []);
  spaces.value = await lifeSpaceApi.updateSettings(spaces.value.map((space, index) => ({
    id: space.id,
    sort: space.sort ?? index,
    isVisible: space.isVisible,
  }))).catch(() => spaces.value);
  uni.setStorageSync(DEFAULT_STORAGE_KEY, defaultCards.value);
  uni.$emit('overview-card-settings-updated');
  uni.showToast({ title: '已保存', icon: 'success' });
}

onMounted(async () => {
  await Promise.all([loadFeatureSettings(), loadSpaces()]);
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
.widget-row {
  display: flex;
  gap: 12rpx;
  margin: 0 0 6rpx;
}
.optional-widget-row,
.all-widget-row {
  flex-wrap: wrap;
}
.preview-widget-row {
  min-height: 120rpx;
}
.widget-card {
  flex: 0 0 calc((100% - 36rpx) / 4);
  position: relative;
  height: 120rpx;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease;
}
.widget-card.disabled { opacity: 0.58; }
.widget-card.dragging {
  transform: scale(1.04);
  z-index: 6;
  box-shadow: 0 12rpx 34rpx rgba(31, 81, 71, 0.16);
}
.empty-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(80,99,93,0.42);
  font-size: 20rpx;
  font-weight: 700;
  background: rgba(255,255,255,0.38);
  border: 2rpx dashed rgba(80,99,93,0.18);
  box-shadow: none;
}
.drag-grip {
  position: absolute;
  right: 8rpx;
  top: 8rpx;
  z-index: 4;
  color: rgba(80,99,93,0.42);
  font-size: 18rpx;
  font-weight: 900;
  transform: rotate(90deg);
}
.widget-card .check-mark {
  right: 10rpx;
  top: 10rpx;
}
.space-widget-card {
  height: 132rpx;
}
.widget-glass {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1rpx solid rgba(255, 255, 255, 0.5);
  pointer-events: none;
}
.widget-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20rpx 16rpx 16rpx;
}
.widget-text { display: flex; flex-direction: column; gap: 2rpx; }
.widget-title { font-size: 26rpx; font-weight: 800; letter-spacing: 0.5rpx; }
.widget-sub { font-size: 16rpx; font-weight: 500; opacity: 0.7; }
.widget-shimmer {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  z-index: 1;
  border-radius: 24rpx;
  pointer-events: none;
  background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.35) 48%, rgba(255,255,255,0.12) 52%, transparent 70%);
  background-size: 300% 100%;
  animation: shimmer-flow 6s ease-in-out infinite;
}
@keyframes shimmer-flow {
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
}
.widget-icon-area {
  position: absolute;
  right: 12rpx;
  bottom: 14rpx;
  width: 68rpx;
  height: 68rpx;
}
.widget-bills { background: linear-gradient(145deg, rgba(16, 185, 129, 0.18), rgba(5, 150, 105, 0.25)); border-bottom: 4rpx solid rgba(5, 150, 105, 0.3); }
.widget-bills .widget-title { color: #047857; }
.widget-bills .widget-sub { color: #059669; }
.widget-ai { background: linear-gradient(145deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.28)); border-bottom: 4rpx solid rgba(139, 92, 246, 0.35); }
.widget-ai .widget-title { color: #6d28d9; }
.widget-ai .widget-sub { color: #7c3aed; }
.widget-wealth { background: linear-gradient(145deg, rgba(245, 208, 120, 0.22), rgba(212, 175, 55, 0.2)); border-bottom: 4rpx solid rgba(212, 175, 55, 0.3); }
.widget-wealth .widget-title { color: #92700c; }
.widget-wealth .widget-sub { color: #a16207; }
.widget-budget { background: linear-gradient(145deg, rgba(56, 189, 248, 0.18), rgba(14, 165, 233, 0.25)); border-bottom: 4rpx solid rgba(14, 165, 233, 0.3); }
.widget-budget .widget-title { color: #0369a1; }
.widget-budget .widget-sub { color: #0284c7; }
.wbl-receipt { position: absolute; right: 10rpx; top: 0; width: 28rpx; height: 36rpx; border-radius: 4rpx 4rpx 0 0; background: rgba(16, 185, 129, 0.18); border-bottom: 4rpx dashed rgba(5, 150, 105, 0.2); }
.wbl-line { position: absolute; height: 5rpx; border-radius: 3rpx; background: linear-gradient(to right, rgba(16,185,129,0.3), rgba(5,150,105,0.12)); }
.wbl-line-1 { right: 0; bottom: 22rpx; width: 44rpx; }
.wbl-line-2 { right: 6rpx; bottom: 12rpx; width: 32rpx; }
.wbl-line-3 { right: 2rpx; bottom: 2rpx; width: 38rpx; }
.wi-orb { position: absolute; right: 6rpx; top: 4rpx; width: 36rpx; height: 36rpx; border-radius: 50%; background: linear-gradient(135deg, rgba(139,92,246,0.4), rgba(99,102,241,0.25)); box-shadow: 0 0 16rpx rgba(139,92,246,0.25); animation: ai-breathe 3s ease-in-out infinite; }
@keyframes ai-breathe {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.12); opacity: 1; }
}
.wi-ring { position: absolute; right: 0; top: -2rpx; width: 48rpx; height: 48rpx; border-radius: 50%; border: 2rpx solid rgba(139,92,246,0.15); }
.wi-bar { position: absolute; bottom: 0; width: 10rpx; border-radius: 5rpx; background: linear-gradient(to top, rgba(139,92,246,0.35), rgba(99,102,241,0.15)); }
.wi-bar-1 { left: 8rpx; height: 28rpx; }
.wi-bar-2 { left: 24rpx; height: 40rpx; }
.wi-bar-3 { left: 40rpx; height: 20rpx; }
.ww-coin { position: absolute; right: 10rpx; top: 8rpx; width: 28rpx; height: 28rpx; border-radius: 50%; background: linear-gradient(135deg, rgba(234,194,82,0.5), rgba(212,175,55,0.3)); border: 2rpx solid rgba(212,175,55,0.25); box-shadow: 0 2rpx 12rpx rgba(212,175,55,0.15); }
.ww-arrow { position: absolute; right: 28rpx; top: 16rpx; width: 16rpx; height: 16rpx; border-right: 3rpx solid rgba(180,140,20,0.35); border-top: 3rpx solid rgba(180,140,20,0.35); transform: rotate(-45deg); }
.ww-curve { position: absolute; bottom: 4rpx; left: 0; right: 0; height: 32rpx; border-radius: 0 32rpx 0 0; border-top: 3rpx solid rgba(212,175,55,0.2); border-right: 3rpx solid rgba(212,175,55,0.2); }
.wb-ring-track { position: absolute; right: 8rpx; top: 2rpx; width: 40rpx; height: 40rpx; border-radius: 50%; border: 4rpx solid rgba(56,189,248,0.12); }
.wb-ring-fill { position: absolute; right: 8rpx; top: 2rpx; width: 40rpx; height: 40rpx; border-radius: 50%; border: 4rpx solid transparent; border-top-color: rgba(14,165,233,0.4); border-right-color: rgba(14,165,233,0.4); transform: rotate(30deg); }
.wb-dot { position: absolute; right: 38rpx; top: 4rpx; width: 8rpx; height: 8rpx; border-radius: 50%; background: rgba(14,165,233,0.4); }
.wb-bar { position: absolute; bottom: 2rpx; height: 6rpx; border-radius: 3rpx; background: linear-gradient(to right, rgba(56,189,248,0.3), rgba(14,165,233,0.15)); }
.wb-bar-1 { left: 0; width: 42rpx; }
.wb-bar-2 { left: 0; bottom: 14rpx; width: 28rpx; }
.space-widget--rose { background: linear-gradient(145deg, rgba(255, 190, 202, 0.22), rgba(242, 167, 179, 0.28)); border-bottom: 4rpx solid rgba(242, 167, 179, 0.36); }
.space-widget--rose .widget-title { color: #a95f6f; }
.space-widget--rose .widget-sub { color: #c77b86; }
.space-widget--olive { background: linear-gradient(145deg, rgba(202, 226, 150, 0.22), rgba(167, 201, 112, 0.28)); border-bottom: 4rpx solid rgba(167, 201, 112, 0.34); }
.space-widget--olive .widget-title { color: #617d43; }
.space-widget--olive .widget-sub { color: #789554; }
.space-widget--blue { background: linear-gradient(145deg, rgba(160, 181, 245, 0.2), rgba(141, 167, 242, 0.28)); border-bottom: 4rpx solid rgba(141, 167, 242, 0.34); }
.space-widget--blue .widget-title { color: #546bbd; }
.space-widget--blue .widget-sub { color: #6379ca; }
.space-widget--cyan { background: linear-gradient(145deg, rgba(138, 214, 238, 0.2), rgba(124, 199, 232, 0.28)); border-bottom: 4rpx solid rgba(124, 199, 232, 0.34); }
.space-widget--cyan .widget-title { color: #247d9f; }
.space-widget--cyan .widget-sub { color: #318cac; }
.space-widget--amber { background: linear-gradient(145deg, rgba(237, 202, 132, 0.22), rgba(217, 183, 110, 0.3)); border-bottom: 4rpx solid rgba(217, 183, 110, 0.35); }
.space-widget--amber .widget-title { color: #92700c; }
.space-widget--amber .widget-sub { color: #a67d20; }
.love-heart { position: absolute; right: 14rpx; top: 0; color: rgba(169,95,111,0.46); font-size: 48rpx; line-height: 1; }
.love-ring { position: absolute; right: 0; top: -4rpx; width: 56rpx; height: 56rpx; border-radius: 50%; border: 2rpx solid rgba(169,95,111,0.16); }
.love-dot { position: absolute; right: 44rpx; bottom: 10rpx; width: 10rpx; height: 10rpx; border-radius: 50%; background: rgba(169,95,111,0.28); }
.home-roof { position: absolute; right: 14rpx; top: 4rpx; width: 34rpx; height: 34rpx; border-left: 5rpx solid rgba(97,125,67,0.34); border-top: 5rpx solid rgba(97,125,67,0.34); transform: rotate(45deg); border-radius: 4rpx; }
.home-body { position: absolute; right: 10rpx; bottom: 8rpx; width: 46rpx; height: 34rpx; border-radius: 8rpx; background: rgba(97,125,67,0.16); border: 2rpx solid rgba(97,125,67,0.2); }
.home-door { position: absolute; right: 28rpx; bottom: 8rpx; width: 12rpx; height: 20rpx; border-radius: 6rpx 6rpx 0 0; background: rgba(97,125,67,0.24); }
.work-case { position: absolute; right: 8rpx; bottom: 8rpx; width: 52rpx; height: 38rpx; border-radius: 8rpx; background: rgba(84,107,189,0.16); border: 2rpx solid rgba(84,107,189,0.24); }
.work-handle { position: absolute; right: 25rpx; top: 8rpx; width: 18rpx; height: 12rpx; border-radius: 8rpx 8rpx 0 0; border: 3rpx solid rgba(84,107,189,0.24); border-bottom: none; }
.work-line { position: absolute; right: 12rpx; bottom: 26rpx; width: 44rpx; height: 4rpx; border-radius: 999rpx; background: rgba(84,107,189,0.2); }
.travel-route { position: absolute; left: 8rpx; right: 8rpx; top: 28rpx; height: 26rpx; border-bottom: 4rpx dashed rgba(36,125,159,0.28); border-radius: 50%; transform: rotate(-10deg); }
.travel-pin { position: absolute; width: 14rpx; height: 14rpx; border-radius: 50% 50% 50% 0; background: rgba(36,125,159,0.32); transform: rotate(-45deg); }
.travel-pin-a { left: 8rpx; top: 8rpx; }
.travel-pin-b { right: 8rpx; bottom: 8rpx; }
.campus-book { position: absolute; right: 32rpx; top: 10rpx; width: 24rpx; height: 42rpx; border-radius: 6rpx 2rpx 2rpx 6rpx; background: rgba(146,112,12,0.18); border: 2rpx solid rgba(146,112,12,0.2); transform: rotate(-8deg); }
.campus-book-r { right: 10rpx; transform: rotate(8deg); }
.campus-line { position: absolute; right: 14rpx; bottom: 8rpx; width: 46rpx; height: 5rpx; border-radius: 999rpx; background: rgba(146,112,12,0.2); }
.check-mark {
  position: absolute;
  right: 14rpx;
  top: 14rpx;
  z-index: 4;
  width: 34rpx;
  height: 34rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.58);
  color: rgba(80,99,93,0.36);
  font-size: 22rpx;
  font-weight: 850;
  border: 1rpx solid rgba(255,255,255,0.62);
}
.check-mark.active { background: rgba(33,122,101,0.88); color: #fff; }
.save-btn { margin-top: 30rpx; height: 88rpx; line-height: 88rpx; border-radius: 44rpx; color: #1f5147; font-size: 31rpx; font-weight: 780; background: linear-gradient(168deg, rgba(232,255,246,0.94), rgba(118,214,188,0.62)); box-shadow: 0 18rpx 48rpx rgba(92,200,168,0.2); }
</style>
