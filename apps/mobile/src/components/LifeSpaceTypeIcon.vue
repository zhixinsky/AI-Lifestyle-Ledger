<template>
  <view :class="['ls-icon', `ls-icon--${theme}`]">
    <template v-if="theme === 'rose'">
      <view class="ls-heart" />
      <view class="ls-heart-ring" />
    </template>
    <template v-else-if="theme === 'olive'">
      <view class="ls-home-roof" />
      <view class="ls-home-body" />
      <view class="ls-home-door" />
    </template>
    <template v-else-if="theme === 'blue'">
      <view class="ls-briefcase" />
      <view class="ls-briefcase-handle" />
      <view class="ls-briefcase-line" />
    </template>
    <template v-else-if="theme === 'cyan'">
      <view class="ls-route" />
      <view class="ls-pin ls-pin-a" />
      <view class="ls-pin ls-pin-b" />
    </template>
    <template v-else-if="theme === 'amber'">
      <view class="ls-book" />
      <view class="ls-book ls-book-r" />
      <view class="ls-book-line" />
    </template>
    <template v-else>
      <view class="ls-dot" />
      <view class="ls-dot ls-dot-r" />
    </template>
  </view>
</template>

<script setup lang="ts">
defineProps<{ theme: string }>();
</script>

<style scoped>
.ls-icon {
  position: relative;
  width: 100%;
  height: 100%;
}

/* 恋爱 */
.ls-heart {
  position: absolute;
  left: 50%;
  top: 44%;
  width: 22rpx;
  height: 22rpx;
  margin: -18rpx 0 0 -11rpx;
  background: rgba(255, 255, 255, 0.95);
  transform: rotate(-45deg);
  border-radius: 0 0 0 8rpx;
}
.ls-heart::before,
.ls-heart::after {
  content: '';
  position: absolute;
  width: 22rpx;
  height: 22rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
}
.ls-heart::before {
  top: -11rpx;
  left: 0;
}
.ls-heart::after {
  left: 11rpx;
  top: 0;
}
.ls-heart-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 44rpx;
  height: 44rpx;
  margin: -22rpx 0 0 -22rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(255, 255, 255, 0.35);
}

/* 家庭 */
.ls-home-roof {
  position: absolute;
  left: 50%;
  top: 18%;
  width: 26rpx;
  height: 26rpx;
  margin-left: -13rpx;
  border-left: 4rpx solid rgba(255, 255, 255, 0.9);
  border-top: 4rpx solid rgba(255, 255, 255, 0.9);
  transform: rotate(45deg);
  border-radius: 4rpx;
}
.ls-home-body {
  position: absolute;
  left: 50%;
  bottom: 16%;
  width: 36rpx;
  height: 26rpx;
  margin-left: -18rpx;
  border-radius: 6rpx;
  background: rgba(255, 255, 255, 0.28);
  border: 2rpx solid rgba(255, 255, 255, 0.72);
}
.ls-home-door {
  position: absolute;
  left: 50%;
  bottom: 16%;
  width: 10rpx;
  height: 16rpx;
  margin-left: -5rpx;
  border-radius: 4rpx 4rpx 0 0;
  background: rgba(255, 255, 255, 0.82);
}

/* 职场 */
.ls-briefcase {
  position: absolute;
  left: 50%;
  bottom: 18%;
  width: 40rpx;
  height: 28rpx;
  margin-left: -20rpx;
  border-radius: 6rpx;
  background: rgba(255, 255, 255, 0.28);
  border: 2rpx solid rgba(255, 255, 255, 0.78);
}
.ls-briefcase-handle {
  position: absolute;
  left: 50%;
  top: 20%;
  width: 16rpx;
  height: 10rpx;
  margin-left: -8rpx;
  border-radius: 6rpx 6rpx 0 0;
  border: 3rpx solid rgba(255, 255, 255, 0.78);
  border-bottom: none;
}
.ls-briefcase-line {
  position: absolute;
  left: 50%;
  bottom: 34%;
  width: 32rpx;
  height: 3rpx;
  margin-left: -16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.55);
}

/* 旅行 */
.ls-route {
  position: absolute;
  left: 14%;
  right: 14%;
  top: 46%;
  height: 20rpx;
  border-bottom: 3rpx dashed rgba(255, 255, 255, 0.62);
  border-radius: 50%;
  transform: rotate(-8deg);
}
.ls-pin {
  position: absolute;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50% 50% 50% 0;
  background: rgba(255, 255, 255, 0.88);
  transform: rotate(-45deg);
}
.ls-pin-a {
  left: 18%;
  top: 22%;
}
.ls-pin-b {
  right: 18%;
  bottom: 20%;
}

/* 校园 */
.ls-book {
  position: absolute;
  left: 50%;
  top: 22%;
  width: 16rpx;
  height: 30rpx;
  margin-left: -14rpx;
  border-radius: 4rpx 2rpx 2rpx 4rpx;
  background: rgba(255, 255, 255, 0.32);
  border: 2rpx solid rgba(255, 255, 255, 0.78);
  transform: rotate(-10deg);
}
.ls-book-r {
  margin-left: 0;
  transform: rotate(10deg);
}
.ls-book-line {
  position: absolute;
  left: 50%;
  bottom: 18%;
  width: 36rpx;
  height: 4rpx;
  margin-left: -18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.55);
}

.ls-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14rpx;
  height: 14rpx;
  margin: -7rpx 0 0 -16rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
}
.ls-dot-r {
  margin-left: 2rpx;
}
</style>
