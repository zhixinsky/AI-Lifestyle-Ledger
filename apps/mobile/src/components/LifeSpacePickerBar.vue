<template>
  <view v-if="show" class="life-space-picker" :class="{ 'life-space-picker--inline': inline }">
    <view :id="anchorId" class="life-space-picker__trigger" :style="pillStyle" @tap.stop="toggleMenu">
      <text class="life-space-picker__name">{{ displayName }}</text>
      <text class="life-space-picker__caret" :class="{ 'life-space-picker__caret--open': menuOpen }">▼</text>
    </view>

    <view v-if="menuOpen" class="life-space-picker__backdrop" @tap="closeMenu" />
    <view v-if="menuOpen" class="life-space-picker__menu" :style="menuStyle" @tap.stop>
      <view
        v-for="space in spaces"
        :key="space.id"
        class="life-space-picker__option"
        :class="{ 'life-space-picker__option--active': space.id === currentId }"
        :style="optionStyle(space)"
        @tap="pick(space.id)"
      >
        <text class="life-space-picker__option-name">{{ optionName(space) }}</text>
        <text v-if="space.id === currentId" class="life-space-picker__option-check">✓</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import {
  lifeSpaceColorAlpha,
  resolveLifeSpaceColor,
  stripLifeSpaceQuotes,
} from '@/utils/life-space';
import type { LifeSpace } from '@/types/domain';
import { computed, getCurrentInstance, ref, watch } from 'vue';

const props = defineProps<{
  show: boolean;
  spaces: LifeSpace[];
  currentId: string;
  color?: string;
  inline?: boolean;
}>();

const emit = defineEmits<{ select: [id: string] }>();

const menuOpen = ref(false);
const menuStyle = ref<Record<string, string>>({});
const anchorId = `life-space-picker-${Math.random().toString(36).slice(2, 9)}`;
const instance = getCurrentInstance();

const currentSpace = computed(() => props.spaces.find((s) => s.id === props.currentId));

const displayName = computed(() =>
  stripLifeSpaceQuotes(currentSpace.value?.name || props.spaces[0]?.name || '日常生活'),
);

const pillStyle = computed(() => {
  const color = props.color || (currentSpace.value ? resolveLifeSpaceColor(currentSpace.value) : '');
  if (!color) return {};
  return {
    background: lifeSpaceColorAlpha(color, 0.22),
    borderColor: lifeSpaceColorAlpha(color, 0.38),
  };
});

watch(
  () => props.show,
  (v) => {
    if (!v) menuOpen.value = false;
  },
);

function optionName(space: LifeSpace) {
  return stripLifeSpaceQuotes(space.name);
}

function optionStyle(space: LifeSpace) {
  const color = resolveLifeSpaceColor(space);
  const active = space.id === props.currentId;
  return {
    background: lifeSpaceColorAlpha(color, active ? 0.42 : 0.32),
    borderColor: lifeSpaceColorAlpha(color, active ? 0.72 : 0.48),
  };
}

function toggleMenu() {
  if (props.spaces.length <= 1) return;
  if (menuOpen.value) {
    closeMenu();
    return;
  }
  const query = uni.createSelectorQuery().in(instance as any);
  query
    .select(`#${anchorId}`)
    .boundingClientRect((rect) => {
      if (rect && !Array.isArray(rect)) {
        const sys = uni.getSystemInfoSync();
        const top = rect.bottom + 6;
        const right = Math.max(12, sys.windowWidth - rect.right);
        menuStyle.value = {
          top: `${top}px`,
          right: `${right}px`,
        };
      }
      menuOpen.value = true;
    })
    .exec();
}

function closeMenu() {
  menuOpen.value = false;
}

function pick(id: string) {
  emit('select', id);
  closeMenu();
}
</script>

<style scoped lang="scss">
.life-space-picker {
  position: relative;
  z-index: 30;
}

.life-space-picker--inline {
  flex-shrink: 0;
}

.life-space-picker__trigger {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  max-width: 100%;
  padding: 10rpx 22rpx 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.62);
  border: 2rpx solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 4rpx 18rpx rgba(72, 140, 120, 0.08);
}

.life-space-picker--inline .life-space-picker__trigger {
  padding: 6rpx 16rpx 6rpx 14rpx;
}

.life-space-picker__name {
  font-size: 26rpx;
  font-weight: 600;
  color: rgba(30, 72, 62, 0.88);
  max-width: 200rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.life-space-picker--inline .life-space-picker__name {
  font-size: 24rpx;
  max-width: 180rpx;
}

.life-space-picker__caret {
  font-size: 18rpx;
  color: rgba(48, 92, 80, 0.45);
  transition: transform 0.2s ease;
}

.life-space-picker__caret--open {
  transform: rotate(180deg);
}

.life-space-picker__backdrop {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1000;
  background: transparent;
}

.life-space-picker__menu {
  position: fixed;
  z-index: 1001;
  min-width: 200rpx;
  max-width: 260rpx;
  padding: 6rpx;
  border-radius: 14rpx;
  background: rgba(255, 255, 255, 0.98);
  border: 1rpx solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 8rpx 28rpx rgba(48, 92, 80, 0.12);
}

.life-space-picker__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4rpx;
  padding: 12rpx 14rpx;
  border-radius: 10rpx;
  border: 1rpx solid transparent;
}

.life-space-picker__option:last-child {
  margin-bottom: 0;
}

.life-space-picker__option--active .life-space-picker__option-name {
  font-weight: 700;
}

.life-space-picker__option-name {
  flex: 1;
  min-width: 0;
  font-size: 24rpx;
  font-weight: 500;
  color: rgba(22, 56, 48, 0.88);
}

.life-space-picker__option-check {
  margin-left: 8rpx;
  font-size: 22rpx;
  font-weight: 700;
  color: rgba(18, 72, 64, 0.8);
  flex-shrink: 0;
}
</style>
