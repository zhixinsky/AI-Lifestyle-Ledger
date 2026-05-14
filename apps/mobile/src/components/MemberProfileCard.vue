<template>
  <view :class="['member-card', `member-card--${tone}`]" @tap="emit('tap')">
    <view class="card-lines" />
    <image v-if="avatarUrl" class="avatar" :src="avatarUrl" mode="aspectFill" />
    <view v-else-if="showAvatar" :class="['avatar avatar-placeholder', `avatar-placeholder--${tone}`]">
      <text>{{ avatarText }}</text>
    </view>
    <view v-else class="level-icon-wrap">
      <text class="level-icon">{{ levelIcon }}</text>
    </view>

    <view class="card-info">
      <view class="name-row">
        <text class="name">{{ title }}</text>
        <text :class="['badge', `badge--${tone}`]">{{ badgeText }}</text>
      </view>
      <text class="subline">{{ subline }}</text>
    </view>

    <view v-if="actionText" :class="['action-pill', `action-pill--${tone}`]" @tap.stop="emit('action')">
      <text>{{ actionText }}</text>
      <text class="action-arrow">›</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MemberLevel } from '@/types/domain';

const props = withDefaults(defineProps<{
  level?: MemberLevel;
  title: string;
  avatarUrl?: string;
  expireAt?: string | null;
  actionText?: string;
  showAvatar?: boolean;
}>(), {
  level: 'free',
  avatarUrl: '',
  expireAt: null,
  actionText: '',
  showAvatar: true,
});

const emit = defineEmits<{
  (e: 'tap'): void;
  (e: 'action'): void;
}>();

const tone = computed(() => (props.level === 'premium' ? 'premium' : props.level === 'pro' ? 'pro' : 'free'));
const badgeText = computed(() => {
  if (tone.value === 'premium') return '尊享';
  if (tone.value === 'pro') return 'Pro';
  return '免费';
});
const avatarText = computed(() => props.title.slice(0, 1) || '用');
const levelIcon = computed(() => (tone.value === 'premium' ? '💎' : tone.value === 'pro' ? '⭐' : '🌱'));
const subline = computed(() => {
  if (props.level === 'free') return '免费会员 | 开通后解锁更多 AI 能力';
  if (props.level === 'premium' && !props.expireAt) return '永久有效 | 尊享会员权益';
  if (props.expireAt) return `${props.expireAt.substring(0, 10)} 到期 | 立即续费`;
  return '会员权益已生效';
});
</script>

<style scoped>
.member-card {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 24rpx;
  min-height: 180rpx;
  padding: 34rpx 28rpx;
  border-radius: 28rpx;
  box-shadow: 0 14rpx 42rpx rgba(78, 66, 55, 0.08);
  box-sizing: border-box;
}
.member-card--free {
  background: linear-gradient(110deg, rgba(255, 247, 238, 0.96) 0%, rgba(255, 231, 210, 0.88) 100%);
}
.member-card--pro {
  background: linear-gradient(110deg, rgba(231, 250, 246, 0.96) 0%, rgba(207, 238, 255, 0.9) 100%);
  box-shadow: 0 14rpx 42rpx rgba(31, 142, 132, 0.1);
}
.member-card--premium {
  background: linear-gradient(110deg, #242229 0%, #111115 58%, #31281f 100%);
  box-shadow: 0 18rpx 48rpx rgba(17, 17, 21, 0.2);
}
.card-lines {
  position: absolute;
  top: -80rpx;
  left: 255rpx;
  width: 260rpx;
  height: 260rpx;
  border: 2rpx solid rgba(200, 156, 118, 0.14);
  border-radius: 60rpx;
  box-shadow:
    0 0 0 12rpx rgba(200, 156, 118, 0.08),
    0 0 0 24rpx rgba(200, 156, 118, 0.06),
    0 0 0 36rpx rgba(200, 156, 118, 0.04);
  transform: rotate(45deg);
}
.member-card--premium .card-lines {
  border-color: rgba(242, 199, 132, 0.16);
  box-shadow:
    0 0 0 12rpx rgba(242, 199, 132, 0.1),
    0 0 0 24rpx rgba(242, 199, 132, 0.06),
    0 0 0 36rpx rgba(242, 199, 132, 0.04);
}
.avatar, .level-icon-wrap {
  position: relative;
  z-index: 1;
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  flex-shrink: 0;
  border: 4rpx solid rgba(255, 255, 255, 0.62);
}
.avatar-placeholder, .level-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00d4c8, #7cbcff);
  color: #fff;
  font-size: 36rpx;
  font-weight: 800;
}
.avatar-placeholder--premium {
  background: linear-gradient(135deg, #f3d28d, #9b7438);
  color: #1c1712;
}
.level-icon-wrap {
  background: rgba(255, 255, 255, 0.48);
}
.member-card--premium .level-icon-wrap {
  background: rgba(255, 228, 173, 0.12);
  color: #f9d58d;
}
.level-icon {
  font-size: 52rpx;
}
.card-info {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 0;
}
.name {
  max-width: 290rpx;
  font-size: 36rpx;
  font-weight: 800;
  color: #1e1e1e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.member-card--premium .name {
  color: #f9e3bb;
}
.badge {
  flex-shrink: 0;
  height: 36rpx;
  line-height: 34rpx;
  padding: 0 14rpx;
  border-radius: 10rpx;
  font-size: 22rpx;
  font-weight: 700;
  box-sizing: border-box;
}
.badge--free {
  color: #9b6f4d;
  border: 2rpx solid rgba(155, 111, 77, 0.32);
  background: rgba(255, 255, 255, 0.32);
}
.badge--pro {
  color: #137d73;
  border: 2rpx solid rgba(19, 125, 115, 0.28);
  background: rgba(255, 255, 255, 0.38);
}
.badge--premium {
  color: #24170b;
  background: linear-gradient(135deg, #ffe7ad, #b88943);
}
.subline {
  max-width: 430rpx;
  font-size: 27rpx;
  color: #2b2724;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.member-card--pro .subline {
  color: #245651;
}
.member-card--premium .subline {
  color: rgba(255, 228, 183, 0.78);
}
.action-pill {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  height: 60rpx;
  padding: 0 22rpx;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 25rpx;
  font-weight: 700;
}
.action-pill--free {
  color: #6f4b31;
  background: rgba(255, 255, 255, 0.6);
}
.action-pill--pro {
  color: #0e6f66;
  background: rgba(255, 255, 255, 0.62);
}
.action-pill--premium {
  color: #ffe4ad;
  background: rgba(255, 255, 255, 0.1);
  border: 1rpx solid rgba(255, 224, 170, 0.22);
}
.action-arrow {
  font-size: 32rpx;
  line-height: 1;
}
</style>
