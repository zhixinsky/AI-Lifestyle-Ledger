<template>
  <div class="stat-card" :class="{ 'stat-card--accent': accent }">
    <div v-if="icon" class="stat-card__icon">
      <el-icon><component :is="icon" /></el-icon>
    </div>
    <div class="stat-card__body">
      <div class="stat-card__label">{{ label }}</div>
      <div class="stat-card__value">{{ value }}</div>
      <div v-if="hint" class="stat-card__hint">{{ hint }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{
  label: string;
  value: string | number;
  hint?: string;
  icon?: Component;
  accent?: boolean;
}>();
</script>

<style scoped lang="scss">
.stat-card {
  display: flex;
  gap: 14px;
  padding: 18px 20px;
  background: var(--moona-surface);
  border: 1px solid var(--moona-border);
  border-radius: var(--moona-radius-md);
  box-shadow: var(--moona-shadow-card);
  height: 100%;
}

.stat-card--accent {
  background: linear-gradient(135deg, #ffffff 0%, #f0fdf9 100%);
  border-color: #d4f5ed;
}

.stat-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--moona-primary-soft);
  color: var(--moona-primary-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.stat-card__label {
  font-size: var(--moona-font-caption);
  color: var(--moona-text-muted);
}

.stat-card__value {
  margin-top: 6px;
  font-size: 26px;
  font-weight: 700;
  color: var(--moona-text);
  line-height: 1.1;
}

.stat-card__hint {
  margin-top: 4px;
  font-size: var(--moona-font-caption);
  color: var(--moona-text-secondary);
}
</style>
