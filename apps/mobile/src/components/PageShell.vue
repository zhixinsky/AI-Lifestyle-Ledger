<template>
  <view class="page-shell">
    <view class="page-glow page-glow-a" />
    <view class="page-glow page-glow-b" />
    <view class="page-body" :style="{ paddingTop: topPadding }">
      <slot />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const topPadding = ref('60px');
try {
  const sysInfo = uni.getSystemInfoSync();
  const statusBarH = sysInfo.statusBarHeight || 44;
  topPadding.value = `${statusBarH + 12}px`;
} catch {}
</script>

<style scoped>
.page-shell {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
  background: #f7f8fa;
  font-family: -apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.page-body {
  position: relative;
  z-index: 1;
  padding: 0 32rpx calc(env(safe-area-inset-bottom, 0px) + 140rpx);
  /* padding-top 由 JS 动态设置 */
}

.page-glow {
  position: fixed;
  z-index: 0;
  border-radius: 50%;
  pointer-events: none;
}

.page-glow-a {
  top: -180rpx;
  right: -100rpx;
  width: 480rpx;
  height: 480rpx;
  background: radial-gradient(circle, rgba(0, 212, 200, 0.22), transparent 70%);
}

.page-glow-b {
  left: -160rpx;
  bottom: 100rpx;
  width: 400rpx;
  height: 400rpx;
  background: radial-gradient(circle, rgba(124, 140, 255, 0.18), transparent 70%);
}
</style>
