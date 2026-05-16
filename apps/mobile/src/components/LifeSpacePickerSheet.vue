<template>
  <view v-if="visible" class="ls-sheet-mask" @tap="close">
    <view class="ls-sheet-panel" @tap.stop>
      <view class="ls-sheet-handle" aria-hidden="true" />
      <text class="ls-sheet-title">{{ title }}</text>
      <scroll-view class="ls-sheet-scroll" scroll-y>
        <view
          v-for="space in spaces"
          :key="space.id"
          class="ls-sheet-item"
          :class="{ 'ls-sheet-item--active': space.id === currentId }"
          :style="itemStyle(space)"
          @tap="pick(space.id)"
        >
          <text class="ls-sheet-item__name">{{ displayName(space) }}</text>
          <text v-if="space.id === currentId" class="ls-sheet-item__check">✓</text>
        </view>
        <view
          v-for="(extra, idx) in extras"
          :key="`extra-${idx}`"
          class="ls-sheet-item ls-sheet-item--extra"
          @tap="pickExtra(extra)"
        >
          <text class="ls-sheet-item__name">{{ extra.label }}</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import {
  closeLifeSpacePickerSheet,
  pickLifeSpaceFromSheet,
  pickLifeSpaceSheetExtra,
  useLifeSpacePickerSheetState,
  type LifeSpacePickerExtra,
} from '@/utils/life-space-picker-sheet';
import {
  lifeSpaceColorAlpha,
  resolveLifeSpaceColor,
  stripLifeSpaceQuotes,
} from '@/utils/life-space';
import type { LifeSpace } from '@/types/domain';

const { visible, spaces, currentId, title, extras } = useLifeSpacePickerSheetState();

function displayName(space: LifeSpace) {
  return stripLifeSpaceQuotes(space.name);
}

function close() {
  closeLifeSpacePickerSheet();
}

function pick(id: string) {
  pickLifeSpaceFromSheet(id);
}

function pickExtra(extra: LifeSpacePickerExtra) {
  pickLifeSpaceSheetExtra(extra);
}

/** 整行使用对应生活空间主题色铺底，不加左侧圆点 */
function itemStyle(space: LifeSpace) {
  const color = resolveLifeSpaceColor(space);
  const active = space.id === currentId.value;
  return {
    background: lifeSpaceColorAlpha(color, active ? 0.42 : 0.32),
    borderColor: lifeSpaceColorAlpha(color, active ? 0.72 : 0.48),
  };
}
</script>

<style scoped lang="scss">
.ls-sheet-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1200;
  background: rgba(18, 36, 32, 0.36);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.ls-sheet-panel {
  width: 100%;
  max-height: 68vh;
  padding: 12rpx 24rpx calc(env(safe-area-inset-bottom) + 24rpx);
  border-radius: 32rpx 32rpx 0 0;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 -8rpx 40rpx rgba(48, 92, 80, 0.14);
}

.ls-sheet-handle {
  width: 64rpx;
  height: 8rpx;
  margin: 0 auto 20rpx;
  border-radius: 4rpx;
  background: rgba(48, 92, 80, 0.16);
}

.ls-sheet-title {
  display: block;
  margin-bottom: 16rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: rgba(30, 56, 48, 0.88);
  text-align: center;
}

.ls-sheet-scroll {
  max-height: 52vh;
}

.ls-sheet-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14rpx;
  padding: 26rpx 28rpx;
  border-radius: 22rpx;
  border: 2rpx solid transparent;
}

.ls-sheet-item--active .ls-sheet-item__name {
  font-weight: 800;
  color: rgba(18, 48, 40, 0.96);
}

.ls-sheet-item__name {
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
  font-weight: 600;
  color: rgba(22, 56, 48, 0.9);
}

.ls-sheet-item__check {
  margin-left: 16rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: rgba(18, 72, 64, 0.85);
  flex-shrink: 0;
}

.ls-sheet-item--extra {
  background: rgba(48, 92, 80, 0.06) !important;
  border-color: rgba(48, 92, 80, 0.12) !important;
}

.ls-sheet-item--extra .ls-sheet-item__name {
  color: rgba(48, 92, 80, 0.62);
  font-size: 28rpx;
  font-weight: 500;
}
</style>
