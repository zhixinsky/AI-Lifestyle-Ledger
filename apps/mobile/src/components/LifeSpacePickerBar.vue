<template>
  <view v-if="show" class="life-space-bar" @tap="$emit('pick')">
    <view class="life-space-bar__pill">
      <LifeSpaceTypeIcon v-if="theme" class="life-space-bar__icon" :theme="theme" />
      <text class="life-space-bar__name">{{ name }}</text>
      <text class="life-space-bar__caret" aria-hidden="true">▼</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import LifeSpaceTypeIcon from '@/components/LifeSpaceTypeIcon.vue';
import { getLifeSpaceMeta } from '@/utils/life-space';
import type { BookType } from '@/types/domain';
import { computed } from 'vue';

const props = defineProps<{
  show: boolean;
  name: string;
  type?: BookType;
}>();

defineEmits<{ pick: [] }>();

const theme = computed(() => (props.type ? getLifeSpaceMeta(props.type).theme : ''));
</script>

<style scoped lang="scss">
.life-space-bar {
  margin-top: 16rpx;
  display: flex;
  justify-content: flex-start;
}

.life-space-bar__pill {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  max-width: 100%;
  padding: 10rpx 22rpx 10rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.62);
  border: 1rpx solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 4rpx 18rpx rgba(72, 140, 120, 0.08);
}

.life-space-bar__icon {
  flex-shrink: 0;
}

.life-space-bar__name {
  font-size: 26rpx;
  font-weight: 600;
  color: rgba(30, 72, 62, 0.88);
  max-width: 360rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.life-space-bar__caret {
  font-size: 18rpx;
  color: rgba(48, 92, 80, 0.45);
  margin-left: 2rpx;
}
</style>
