<template>
  <view class="tab-bar-wrap">
    <view class="tab-bar">
      <!-- 滑块指示器 -->
      <view class="indicator" :style="indicatorStyle" />

      <!-- 首页 -->
      <view :class="['tab-item', { active: current === 'index' }]" @tap="switchTo('index')">
        <image class="tab-icon-img" :src="current === 'index' ? icons.homeActive : icons.home" mode="aspectFit" />
        <text class="tab-label">首页</text>
      </view>

      <!-- AI -->
      <view :class="['tab-item', { active: current === 'ai' }]" @tap="switchTo('ai')">
        <image class="tab-icon-img" :src="current === 'ai' ? icons.aiActive : icons.ai" mode="aspectFit" />
        <text class="tab-label">AI</text>
      </view>

      <!-- 中间记账按钮 -->
      <view class="tab-center" @tap="emit('add')">
        <view class="center-btn">
          <text>＋</text>
        </view>
      </view>

      <!-- 账单 -->
      <view :class="['tab-item', { active: current === 'bills' }]" @tap="switchTo('bills')">
        <image class="tab-icon-img" :src="current === 'bills' ? icons.billsActive : icons.bills" mode="aspectFit" />
        <text class="tab-label">账单</text>
      </view>

      <!-- 我的 -->
      <view :class="['tab-item', { active: current === 'profile' }]" @tap="switchTo('profile')">
        <image class="tab-icon-img" :src="current === 'profile' ? icons.profileActive : icons.profile" mode="aspectFit" />
        <text class="tab-label">我的</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  current: string;
}>();

const emit = defineEmits<{
  add: [];
}>();

function makeSvg(paths: string, color: string) {
  const raw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  // #ifdef H5
  return `data:image/svg+xml,${encodeURIComponent(raw)}`;
  // #endif
  // #ifndef H5
  const encoded = uni.arrayBufferToBase64(
    new Uint8Array([...raw].map(c => c.charCodeAt(0))).buffer
  );
  return `data:image/svg+xml;base64,${encoded}`;
  // #endif
}

const gray = '#88909b';
const mint = '#00a99f';

const svgPaths = {
  home: '<path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1z"/><path d="M9 21V14h6v7"/>',
  ai: '<path d="M12 2a4 4 0 014 4v1h1a3 3 0 010 6h-1v1a4 4 0 01-8 0v-1H7a3 3 0 010-6h1V6a4 4 0 014-4z"/><circle cx="10" cy="10" r="1"/><circle cx="14" cy="10" r="1"/><path d="M10 14.5c.5.5 1.5 1 2 1s1.5-.5 2-1"/>',
  bills: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0112 0v1" transform="translate(2,0)"/>',
};

const icons = {
  home: makeSvg(svgPaths.home, gray),
  homeActive: makeSvg(svgPaths.home, mint),
  ai: makeSvg(svgPaths.ai, gray),
  aiActive: makeSvg(svgPaths.ai, mint),
  bills: makeSvg(svgPaths.bills, gray),
  billsActive: makeSvg(svgPaths.bills, mint),
  profile: makeSvg(svgPaths.profile, gray),
  profileActive: makeSvg(svgPaths.profile, mint),
};

const tabs = ['index', 'ai', '__center__', 'bills', 'profile'];

const indicatorStyle = computed(() => {
  const idx = tabs.indexOf(props.current);
  const realIdx = idx >= 0 ? idx : 0;
  return {
    transform: `translateX(${realIdx * 100}%)`,
  };
});

function switchTo(page: string) {
  if (page === props.current) return;
  const routes: Record<string, string> = {
    index: '/pages/index/index',
    ai: '/pages/ai/index',
    bills: '/pages/bills/index',
    profile: '/pages/profile/index',
  };
  uni.switchTab({ url: routes[page] });
}
</script>

<style scoped>
.tab-bar-wrap {
  position: fixed;
  z-index: 999;
  left: 24rpx;
  right: 24rpx;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 20rpx);
  pointer-events: none;
}

.tab-bar {
  position: relative;
  display: flex;
  align-items: center;
  height: 116rpx;
  padding: 0 12rpx;
  border-radius: 58rpx;
  background: rgba(255, 255, 255, 0.68);
  backdrop-filter: blur(32px) saturate(200%);
  -webkit-backdrop-filter: blur(32px) saturate(200%);
  border: 1rpx solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 8rpx 48rpx rgba(0, 0, 0, 0.08),
    0 1rpx 4rpx rgba(0, 0, 0, 0.04),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.6);
  pointer-events: auto;
}

/* 滑块指示器 */
.indicator {
  position: absolute;
  top: 12rpx;
  left: 12rpx;
  width: calc(20% - 6rpx);
  height: 92rpx;
  border-radius: 46rpx;
  background: rgba(0, 212, 200, 0.1);
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
}

/* Tab 项 */
.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  height: 100%;
  position: relative;
  z-index: 1;
}

.tab-icon-img {
  width: 44rpx;
  height: 44rpx;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tab-item.active .tab-icon-img {
  transform: scale(1.18) translateY(-2rpx);
}

.tab-label {
  font-size: 20rpx;
  color: #88909b;
  transition: all 0.3s ease;
  font-weight: 500;
  letter-spacing: 1rpx;
}

.tab-item.active .tab-label {
  color: #00a99f;
  font-weight: 700;
}

/* 中间按钮 */
.tab-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.center-btn {
  width: 92rpx;
  height: 92rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #00d4c8, #34d399);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 46rpx;
  font-weight: 300;
  box-shadow:
    0 8rpx 28rpx rgba(0, 212, 200, 0.45),
    0 2rpx 8rpx rgba(0, 212, 200, 0.2);
  margin-top: -20rpx;
  transition: transform 0.15s ease;
}

.center-btn:active {
  transform: scale(0.9);
}
</style>
