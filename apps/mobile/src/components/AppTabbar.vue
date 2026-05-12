<template>
  <view class="tabbar-anchor">
    <view
      class="tabbar-capsule"
      :style="capsuleStyle"
    >
      <!-- Liquid Glass 多层底 -->
      <view class="glass-layer glass-base" />
      <view class="glass-layer glass-shine" />
      <view class="glass-layer glass-refraction" />
      <view class="glass-layer glass-rim" />
      <view class="glass-breath" />

      <!-- 滑块 -->
      <view class="slider-track">
        <view class="slider-glow" :style="sliderStyle" />
      </view>

      <!-- Tab 项 -->
      <view class="tab-row">
        <view
          v-for="(tab, idx) in tabs"
          :key="tab.key"
          :class="['tab-item', { active: current === tab.key, center: tab.center }]"
          @tap="onTap(tab, idx)"
        >
          <!-- 中间按钮 -->
          <template v-if="tab.center">
            <view class="center-orb">
              <view class="orb-glow" />
              <view class="orb-ring" />
              <view class="orb-core">
                <text class="orb-icon">＋</text>
              </view>
              <view class="orb-pulse" />
            </view>
          </template>

          <!-- 普通按钮 -->
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

  <!-- 内置记账弹窗 -->
  <TransactionEditor
    v-model="form"
    :visible="editorVisible"
    :saving="saving"
    :categories="categories"
    @save="handleSave"
    @close="editorVisible = false"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import TransactionEditor from '@/components/TransactionEditor.vue';
import { useFinanceStore } from '@/stores/finance';
import { useTransactionForm } from '@/composables/useTransactionForm';

const props = defineProps<{ current: string }>();
const emit = defineEmits<{ add: [] }>();

const finance = useFinanceStore();
const categories = computed(() => finance.categories);

const editorVisible = ref(false);
const { saving, form, save } = useTransactionForm(async () => {
  if (props.current === 'index') {
    await Promise.all([finance.loadDashboard(), finance.loadTransactions()]);
  } else if (props.current === 'discover') {
    // no-op
  }
});

async function handleSave() {
  await save();
  editorVisible.value = false;
}

function openEditor() {
  form.value = {
    type: 'expense',
    amount: 0,
    categoryId: '',
    occurredAt: new Date().toISOString(),
    remark: '',
    tags: [],
  };
  editorVisible.value = true;
  if (!finance.categories.length) {
    finance.loadCategories();
  }
}

/* ── 图标 SVG Data URI (base64 编码，兼容微信小程序) ── */
function svg(paths: string, color: string) {
  const raw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
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

const gray = '#8e8e93';
const mint = '#00c6b7';

const iconPaths = {
  home: '<path d="M4 11.4L12 4l8 7.4V20a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 20z"/><path d="M9.5 21.5V15h5v6.5"/>',
  ai: '<circle cx="12" cy="12" r="9"/><circle cx="9.5" cy="10.5" r="1.2"/><circle cx="14.5" cy="10.5" r="1.2"/><path d="M9.5 15c.8 1 1.8 1.5 2.5 1.5s1.7-.5 2.5-1.5"/>',
  discover: '<circle cx="12" cy="12" r="9"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z"/>',
  profile: '<circle cx="12" cy="8.5" r="3.8"/><path d="M5.5 21.5c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/>',
};

const tabs = [
  { key: 'index',    label: '首页', icon: svg(iconPaths.home, gray),     iconActive: svg(iconPaths.home, mint),     center: false },
  { key: 'ai',       label: 'AI',   icon: svg(iconPaths.ai, gray),       iconActive: svg(iconPaths.ai, mint),       center: false },
  { key: '__add__',  label: '',      icon: '',                            iconActive: '',                            center: true  },
  { key: 'discover', label: '发现', icon: svg(iconPaths.discover, gray), iconActive: svg(iconPaths.discover, mint), center: false },
  { key: 'profile',  label: '我的', icon: svg(iconPaths.profile, gray),  iconActive: svg(iconPaths.profile, mint),  center: false },
];

/* ── 滑块位置 ── */
const sliderIndex = computed(() => {
  const idx = tabs.findIndex((t) => t.key === props.current);
  return idx >= 0 ? idx : 0;
});

const sliderStyle = computed(() => ({
  transform: `translateX(${sliderIndex.value * 100}%)`,
}));

/* ── 滚动联动 ── */
const scrollY = ref(0);
const capsuleStyle = computed(() => {
  const t = Math.min(scrollY.value / 300, 1);
  const blur = 32 + t * 16;
  const bg = 0.52 + t * 0.2;
  const scale = 1 - t * 0.015;
  return {
    backdropFilter: `blur(${blur}px) saturate(${180 + t * 40}%)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(${180 + t * 40}%)`,
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

/* ── 路由 ── */
const routes: Record<string, string> = {
  index: '/pages/index/index',
  ai: '/pages/ai/index',
  discover: '/pages/discover/index',
  profile: '/pages/profile/index',
};

function onTap(tab: (typeof tabs)[number], _idx: number) {
  if (tab.center) {
    openEditor();
    emit('add');
    return;
  }
  if (tab.key === props.current) return;
  uni.switchTab({ url: routes[tab.key] });
}
</script>

<style scoped>
/* ━━━ 定位锚点 ━━━ */
.tabbar-anchor {
  position: fixed;
  z-index: 9999;
  left: 28rpx;
  right: 28rpx;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 16rpx);
  pointer-events: none;
}

/* ━━━ 胶囊主体 ━━━ */
.tabbar-capsule {
  position: relative;
  border-radius: 999rpx;
  padding: 0 4rpx;
  pointer-events: auto;
  transition:
    backdrop-filter 0.6s ease,
    background 0.6s ease,
    transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);

  /* 默认值（被 JS 覆盖） */
  background: rgba(255, 255, 255, 0.52);
  backdrop-filter: blur(32px) saturate(180%);
  -webkit-backdrop-filter: blur(32px) saturate(180%);
}

/* ━━━ Liquid Glass 多层 ━━━ */
.glass-layer {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  border-radius: 999rpx;
  pointer-events: none;
}

/* 底层：柔和外阴影 + 内阴影 */
.glass-base {
  box-shadow:
    0 8rpx 48rpx rgba(0, 0, 0, 0.07),
    0 2rpx 6rpx rgba(0, 0, 0, 0.03),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.8),
    inset 0 -1rpx 0 rgba(0, 0, 0, 0.04);
}

/* 顶部高光：模拟玻璃弧面反射 */
.glass-shine {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.55) 0%,
    rgba(255, 255, 255, 0.12) 40%,
    transparent 60%
  );
  opacity: 0.7;
  mask: linear-gradient(180deg, #000 0%, transparent 55%);
  -webkit-mask: linear-gradient(180deg, #000 0%, transparent 55%);
}

/* 折射流光 */
.glass-refraction {
  background: linear-gradient(
    105deg,
    transparent 20%,
    rgba(0, 212, 200, 0.06) 35%,
    rgba(124, 140, 255, 0.05) 50%,
    transparent 65%
  );
  animation: refraction-drift 8s ease-in-out infinite alternate;
}

@keyframes refraction-drift {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

/* 边缘描边 */
.glass-rim {
  border: 1rpx solid rgba(255, 255, 255, 0.45);
}

/* 呼吸光效 */
.glass-breath {
  position: absolute;
  top: -2rpx; right: -2rpx; bottom: -2rpx; left: -2rpx;
  border-radius: 999rpx;
  pointer-events: none;
  box-shadow: 0 0 24rpx 2rpx rgba(0, 212, 200, 0.08);
  animation: breath 4s ease-in-out infinite;
}

@keyframes breath {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.005); }
}

/* ━━━ 滑块 ━━━ */
.slider-track {
  position: absolute;
  top: 8rpx;
  bottom: 8rpx;
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
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);

  background: radial-gradient(
    ellipse at 50% 30%,
    rgba(0, 212, 200, 0.18) 0%,
    rgba(0, 212, 200, 0.06) 60%,
    transparent 100%
  );
  box-shadow:
    inset 0 1rpx 2rpx rgba(255, 255, 255, 0.5),
    0 0 20rpx rgba(0, 212, 200, 0.1);
}

/* ━━━ Tab 行 ━━━ */
.tab-row {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  height: 108rpx;
}

/* ━━━ 普通 Tab ━━━ */
.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rpx;
  height: 100%;
  transition: all 0.35s ease;
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
  width: 44rpx;
  height: 44rpx;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
              filter 0.4s ease;
}

.tab-item.active .tab-svg {
  transform: scale(1.2) translateY(-4rpx);
  filter: drop-shadow(0 2rpx 8rpx rgba(0, 198, 183, 0.35));
}

/* 选中发光 */
.icon-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 64rpx;
  height: 64rpx;
  margin: -32rpx 0 0 -32rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 212, 200, 0.25) 0%, transparent 70%);
  animation: icon-pulse 2.5s ease-in-out infinite;
  pointer-events: none;
}

@keyframes icon-pulse {
  0%, 100% { opacity: 0.6; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.15); }
}

.tab-text {
  font-size: 20rpx;
  font-weight: 500;
  color: #8e8e93;
  opacity: 0.8;
  transition: all 0.35s ease;
  letter-spacing: 0.5rpx;
}

.tab-item.active .tab-text {
  color: #00b8a9;
  font-weight: 700;
  opacity: 1;
  transform: translateY(-2rpx);
}

/* ━━━ 中间 Orb ━━━ */
.tab-item.center {
  flex: 1.15;
}

.center-orb {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96rpx;
  height: 96rpx;
  margin-top: -24rpx;
  animation: orbFloat 3s ease-in-out infinite;
}

@keyframes orbFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6rpx); }
}

/* 呼吸光晕 */
.orb-glow {
  position: absolute;
  top: -14rpx; right: -14rpx; bottom: -14rpx; left: -14rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 212, 200, 0.25) 0%, transparent 70%);
  animation: glowBreath 2.5s ease-in-out infinite;
}

@keyframes glowBreath {
  0%, 100% { transform: scale(0.85); opacity: 0.5; }
  50% { transform: scale(1.15); opacity: 1; }
}

/* 外圈 */
.orb-ring {
  position: absolute;
  top: -4rpx; right: -4rpx; bottom: -4rpx; left: -4rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(0, 212, 200, 0.3);
  animation: ring-rotate 6s linear infinite;
  background: conic-gradient(
    from 0deg,
    transparent 0%,
    rgba(0, 212, 200, 0.15) 25%,
    transparent 50%,
    rgba(52, 211, 153, 0.15) 75%,
    transparent 100%
  );
}

@keyframes ring-rotate {
  to { transform: rotate(360deg); }
}

/* 核心球 */
.orb-core {
  position: relative;
  z-index: 2;
  width: 84rpx;
  height: 84rpx;
  border-radius: 50%;
  background: linear-gradient(145deg, #00d4c8 0%, #34d399 60%, #00b4d8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 6rpx 24rpx rgba(0, 212, 200, 0.45),
    0 2rpx 8rpx rgba(0, 212, 200, 0.2),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.35);
  transition: transform 0.2s ease;
}

.orb-core:active {
  transform: scale(0.88);
}

.orb-icon {
  color: #fff;
  font-size: 44rpx;
  font-weight: 200;
  margin-top: -4rpx;
  animation: iconPulse 2.5s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.15); opacity: 1; }
}

/* 脉冲光环 */
.orb-pulse {
  position: absolute;
  top: -8rpx; right: -8rpx; bottom: -8rpx; left: -8rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(0, 212, 200, 0.2);
  animation: orb-breathe 3s ease-in-out infinite;
  pointer-events: none;
}

@keyframes orb-breathe {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.18); opacity: 0; }
}
</style>
