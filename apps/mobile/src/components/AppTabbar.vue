<template>
  <view class="tabbar-anchor">
    <view class="tabbar-capsule" :style="capsuleStyle">
      <view class="glass-layer glass-base" />
      <view class="glass-layer glass-shine" />
      <view class="glass-layer glass-refraction" />
      <view class="glass-layer glass-rim" />
      <view class="glass-breath" />

      <view v-if="!isCenterActive" class="slider-track">
        <view class="slider-glow" :style="sliderStyle" />
      </view>

      <view class="tab-row">
        <view
          v-for="(tab, idx) in tabs"
          :key="tab.key"
          :class="['tab-item', { active: current === tab.key, center: tab.center }]"
          @tap="onTap(tab)"
        >
          <template v-if="tab.center">
            <view class="center-orb">
              <view class="orb-glow" />
              <view class="orb-ring" />
              <view class="orb-core">
                <image class="orb-logo" :src="miliTabLogo" mode="aspectFit" />
              </view>
              <view class="orb-pulse" />
            </view>
          </template>
          <template v-else>
            <view class="icon-wrap">
              <image
                class="tab-svg"
                :src="current === tab.key ? tab.iconActive : tab.icon"
                mode="aspectFit"
              />
              <view v-if="current === tab.key" class="icon-glow" />
            </view>
            <text class="tab-text">{{ tab.label }}</text>
          </template>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

const props = defineProps<{ current: string }>();

/** 根目录 ailogo.png 同步至 src/static/tab，供中间 Tab 使用 */
const miliTabLogo = '/static/tab/ailogo.png';

function svg(paths: string, color: string) {
  const raw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  // #ifdef H5
  return `data:image/svg+xml,${encodeURIComponent(raw)}`;
  // #endif
  // #ifndef H5
  const encoded = uni.arrayBufferToBase64(
    new Uint8Array([...raw].map((c) => c.charCodeAt(0))).buffer
  );
  return `data:image/svg+xml;base64,${encoded}`;
  // #endif
}

const gray = '#8e8e93';
const mint = '#2eb8a0';

const iconPaths = {
  overview:
    '<path d="M4 19V5"/><path d="M10 19V10"/><path d="M16 19v-5"/><path d="M22 19V8"/>',
  bills:
    '<path d="M6 4h12v16H6z"/><path d="M9 8h6"/><path d="M9 12h4"/>',
  discover: '<circle cx="12" cy="12" r="9"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z"/>',
  profile: '<circle cx="12" cy="8.5" r="3.8"/><path d="M5.5 21.5c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/>',
};

const tabs = [
  { key: 'index', label: '概览', icon: svg(iconPaths.overview, gray), iconActive: svg(iconPaths.overview, mint), center: false },
  { key: 'bills', label: '账单', icon: svg(iconPaths.bills, gray), iconActive: svg(iconPaths.bills, mint), center: false },
  { key: 'mili', label: '', icon: '', iconActive: '', center: true },
  { key: 'discover', label: '发现', icon: svg(iconPaths.discover, gray), iconActive: svg(iconPaths.discover, mint), center: false },
  { key: 'profile', label: '我的', icon: svg(iconPaths.profile, gray), iconActive: svg(iconPaths.profile, mint), center: false },
];

const sliderIndex = computed(() => {
  const idx = tabs.findIndex((t) => t.key === props.current);
  return idx >= 0 ? idx : 2;
});

const isCenterActive = computed(() => props.current === 'mili');

const sliderStyle = computed(() => ({
  transform: `translateX(${sliderIndex.value * 100}%)`,
}));

const scrollY = ref(0);
const capsuleStyle = computed(() => {
  const t = Math.min(scrollY.value / 300, 1);
  const blur = 36 + t * 18;
  const bg = 0.42 + t * 0.18;
  const scale = 1 - t * 0.012;
  return {
    backdropFilter: `blur(${blur}px) saturate(${165 + t * 35}%)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(${165 + t * 35}%)`,
    background: `rgba(255,255,255,${bg})`,
    transform: `scale(${scale})`,
  };
});

function onScroll() {
  // #ifdef H5
  scrollY.value = document.documentElement.scrollTop || document.body.scrollTop || 0;
  // #endif
}

onMounted(() => {
  // #ifdef H5
  window.addEventListener('scroll', onScroll, { passive: true });
  // #endif
});

onUnmounted(() => {
  // #ifdef H5
  window.removeEventListener('scroll', onScroll);
  // #endif
});

const routes: Record<string, string> = {
  index: '/pages/overview/index',
  bills: '/pages/bills/index',
  mili: '/pages/index/index',
  discover: '/pages/discover/index',
  profile: '/pages/profile/index',
};

function onTap(tab: (typeof tabs)[number]) {
  if (tab.key === props.current) return;
  uni.switchTab({ url: routes[tab.key] });
}
</script>

<style scoped>
.tabbar-anchor {
  position: fixed;
  z-index: 9999;
  left: 28rpx;
  right: 28rpx;
  bottom: env(safe-area-inset-bottom, 0px);
  pointer-events: none;
}

.tabbar-capsule {
  position: relative;
  border-radius: 999rpx;
  padding: 0 4rpx;
  pointer-events: auto;
  transition:
    backdrop-filter 0.55s ease,
    background 0.55s ease,
    transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(40px) saturate(165%);
  -webkit-backdrop-filter: blur(40px) saturate(165%);
}

.glass-layer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  border-radius: 999rpx;
  pointer-events: none;
}

.glass-base {
  box-shadow:
    0 12rpx 48rpx rgba(46, 184, 160, 0.12),
    0 4rpx 16rpx rgba(24, 48, 44, 0.05),
    inset 0 2rpx 0 rgba(255, 255, 255, 0.88),
    inset 0 -2rpx 0 rgba(127, 255, 212, 0.06);
}

.glass-shine {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.62) 0%, rgba(255, 255, 255, 0.12) 42%, transparent 62%);
  opacity: 0.72;
  mask: linear-gradient(180deg, #000 0%, transparent 55%);
  -webkit-mask: linear-gradient(180deg, #000 0%, transparent 55%);
}

.glass-refraction {
  background: linear-gradient(
    105deg,
    transparent 18%,
    rgba(127, 255, 212, 0.12) 38%,
    rgba(140, 255, 216, 0.08) 52%,
    transparent 72%
  );
  animation: refraction-drift 9s ease-in-out infinite alternate;
}

@keyframes refraction-drift {
  0% {
    opacity: 0.55;
  }
  100% {
    opacity: 0.95;
  }
}

.glass-rim {
  border: 1rpx solid rgba(255, 255, 255, 0.55);
}

.glass-breath {
  position: absolute;
  top: -2rpx;
  right: -2rpx;
  bottom: -2rpx;
  left: -2rpx;
  border-radius: 999rpx;
  pointer-events: none;
  box-shadow: 0 0 32rpx 2rpx rgba(127, 255, 212, 0.18);
  animation: breath 4.2s ease-in-out infinite;
}

@keyframes breath {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(1);
  }
  50% {
    opacity: 0.75;
    transform: scale(1.004);
  }
}

.slider-track {
  position: absolute;
  top: 4rpx;
  bottom: 4rpx;
  left: 4rpx;
  right: 4rpx;
  pointer-events: none;
}

.slider-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 20%;
  height: 100%;
  border-radius: 999rpx;
  transition: transform 0.48s cubic-bezier(0.34, 1.45, 0.64, 1);
  background: radial-gradient(
    ellipse at 50% 28%,
    rgba(127, 255, 212, 0.28) 0%,
    rgba(46, 184, 160, 0.1) 55%,
    transparent 100%
  );
  box-shadow:
    inset 0 1rpx 2rpx rgba(255, 255, 255, 0.55),
    0 0 24rpx rgba(127, 255, 212, 0.12);
}

.tab-row {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  height: 96rpx;
  padding: 4rpx 0;
  box-sizing: border-box;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rpx;
  height: 100%;
  transition: all 0.32s ease;
}

.icon-wrap {
  position: relative;
  width: 46rpx;
  height: 46rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-svg {
  width: 42rpx;
  height: 42rpx;
  transition:
    transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1),
    filter 0.38s ease;
}

.tab-item.active .tab-svg {
  transform: scale(1.1);
  filter: drop-shadow(0 2rpx 10rpx rgba(46, 184, 160, 0.35));
}

.icon-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 58rpx;
  height: 58rpx;
  margin: -29rpx 0 0 -29rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(127, 255, 212, 0.35) 0%, transparent 72%);
  animation: icon-pulse 2.6s ease-in-out infinite;
  pointer-events: none;
}

@keyframes icon-pulse {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(0.92);
  }
  50% {
    opacity: 1;
    transform: scale(1.08);
  }
}

.tab-text {
  display: block;
  font-size: 20rpx;
  font-weight: 500;
  color: #8e8e93;
  opacity: 0.82;
  letter-spacing: 0.5rpx;
  text-align: center;
  width: 100%;
  line-height: 1.2;
}

.tab-item.active .tab-text {
  color: #2a9d8f;
  font-weight: 700;
  opacity: 1;
  transform: none;
}

.tab-item.center {
  flex: 1.12;
  justify-content: center;
  padding-bottom: 0;
}

.center-orb {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  margin-top: -26rpx;
  animation: orbFloat 3.2s ease-in-out infinite;
}

@keyframes orbFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6rpx);
  }
}

.orb-glow {
  position: absolute;
  top: -12rpx;
  right: -12rpx;
  bottom: -12rpx;
  left: -12rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(127, 255, 212, 0.45) 0%, transparent 70%);
  animation: glowBreath 2.6s ease-in-out infinite;
}

@keyframes glowBreath {
  0%,
  100% {
    transform: scale(0.88);
    opacity: 0.55;
  }
  50% {
    transform: scale(1.08);
    opacity: 1;
  }
}

.orb-ring {
  position: absolute;
  top: -3rpx;
  right: -3rpx;
  bottom: -3rpx;
  left: -3rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(127, 255, 212, 0.45);
  animation: ring-rotate 10s linear infinite;
  background: conic-gradient(
    from 0deg,
    transparent 0%,
    rgba(140, 255, 216, 0.2) 22%,
    transparent 48%,
    rgba(127, 255, 212, 0.18) 72%,
    transparent 100%
  );
}

@keyframes ring-rotate {
  to {
    transform: rotate(360deg);
  }
}

.orb-core {
  position: relative;
  z-index: 2;
  width: 74rpx;
  height: 74rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow:
    0 10rpx 32rpx rgba(127, 255, 212, 0.45),
    inset 0 3rpx 10rpx rgba(255, 255, 255, 0.85),
    inset 0 -8rpx 20rpx rgba(46, 184, 160, 0.15);
  transition: transform 0.18s ease;
}

.orb-logo {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
}

.tab-item.center.active .orb-core {
  transform: translateY(-2rpx) scale(1.06);
  background: rgba(255, 255, 255, 0.28);
  box-shadow:
    0 14rpx 44rpx rgba(127, 255, 212, 0.62),
    0 0 0 8rpx rgba(127, 255, 212, 0.08),
    inset 0 3rpx 10rpx rgba(255, 255, 255, 0.92),
    inset 0 -6rpx 18rpx rgba(46, 184, 160, 0.2);
}

.tab-item.center.active .orb-glow {
  background: radial-gradient(circle, rgba(127, 255, 212, 0.68) 0%, rgba(46, 184, 160, 0.18) 42%, transparent 72%);
}

.tab-item.center.active .orb-ring {
  border-color: rgba(127, 255, 212, 0.72);
  box-shadow: 0 0 24rpx rgba(127, 255, 212, 0.24);
}

.orb-pulse {
  position: absolute;
  top: -6rpx;
  right: -6rpx;
  bottom: -6rpx;
  left: -6rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(127, 255, 212, 0.35);
  animation: orb-breathe 2.8s ease-in-out infinite;
  pointer-events: none;
}

@keyframes orb-breathe {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.45;
  }
  50% {
    transform: scale(1.16);
    opacity: 0;
  }
}
</style>
