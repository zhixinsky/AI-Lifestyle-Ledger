<template>
  <view class="pane">
    <view class="pane-head">
      <text class="pane-title">快速记账</text>
      <text class="pane-hint">选一句模板或打开完整表单</text>
    </view>
    <view class="chips">
      <view v-for="t in presets" :key="t" class="chip" @tap="$emit('preset', t)">
        <text>{{ t }}</text>
      </view>
    </view>
    <view class="glass-card" @tap="$emit('openEditor')">
      <text class="card-title">完整表单</text>
      <text class="card-sub">分类、金额、日期、备注</text>
      <text class="card-go">›</text>
    </view>
    <view class="tip">
      <text>也可回到中间，按住说话让 AI 帮你记</text>
    </view>
  </view>
</template>

<script setup lang="ts">
defineEmits<{ preset: [text: string]; openEditor: [] }>();

const presets = ['午饭 35', '地铁 6', '咖啡 28', '打车 18', '超市 120'];
</script>

<style scoped>
.pane {
  height: 100%;
  padding: 0 32rpx;
  padding-top: calc(env(safe-area-inset-top, 0px) + 24rpx);
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 200rpx);
  box-sizing: border-box;
}
.pane-head {
  margin-bottom: 28rpx;
}
.pane-title {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: rgba(24, 56, 48, 0.9);
}
.pane-hint {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: rgba(48, 92, 80, 0.55);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.chip {
  padding: 18rpx 26rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.48);
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  font-size: 26rpx;
  font-weight: 600;
  color: rgba(28, 88, 72, 0.88);
  box-shadow: 0 10rpx 32rpx rgba(127, 255, 212, 0.12);
}
.glass-card {
  position: relative;
  margin-top: 40rpx;
  padding: 36rpx 28rpx;
  border-radius: 36rpx;
  background: rgba(255, 255, 255, 0.42);
  border: 1rpx solid rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(32rpx) saturate(118%);
  -webkit-backdrop-filter: blur(32rpx) saturate(118%);
  box-shadow:
    inset 0 2rpx 0 rgba(255, 255, 255, 0.85),
    0 20rpx 56rpx rgba(127, 255, 212, 0.12);
}
.card-title {
  display: block;
  font-size: 32rpx;
  font-weight: 800;
  color: rgba(24, 56, 48, 0.9);
}
.card-sub {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: rgba(48, 92, 80, 0.55);
}
.card-go {
  position: absolute;
  right: 28rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 48rpx;
  color: rgba(127, 255, 212, 0.9);
  font-weight: 300;
}
.tip {
  margin-top: 36rpx;
  text-align: center;
}
.tip text {
  font-size: 24rpx;
  color: rgba(48, 92, 80, 0.45);
  line-height: 1.5;
}
</style>
