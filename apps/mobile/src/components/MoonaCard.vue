<template>
  <view class="moona-card">
    <slot />
  </view>
</template>

<style scoped>
.moona-card {
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 8rpx 32rpx rgba(30, 30, 30, 0.06);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  margin-top: 20rpx;
  padding: 28rpx;
}
</style>
