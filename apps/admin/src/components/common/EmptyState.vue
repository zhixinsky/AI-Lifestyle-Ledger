<template>
  <div class="empty-state">
    <div class="empty-state__icon">
      <el-icon v-if="icon"><component :is="icon" /></el-icon>
      <span v-else>{{ emoji || '📭' }}</span>
    </div>
    <h3 class="empty-state__title">{{ title }}</h3>
    <p class="empty-state__desc">{{ description }}</p>
    <div v-if="$slots.action" class="empty-state__action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{
  title: string;
  description: string;
  icon?: Component;
  emoji?: string;
}>();
</script>

<style scoped lang="scss">
.empty-state {
  padding: 48px 24px;
  text-align: center;
}

.empty-state__icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 16px;
  background: #f6f8fb;
  color: var(--moona-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;

  .el-icon {
    font-size: 28px;
    color: var(--moona-primary-text);
  }
}

.empty-state__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--moona-text);
}

.empty-state__desc {
  margin: 8px auto 0;
  max-width: 360px;
  font-size: var(--moona-font-body);
  color: var(--moona-text-secondary);
  line-height: 1.6;
}

.empty-state__action {
  margin-top: 20px;
}
</style>
