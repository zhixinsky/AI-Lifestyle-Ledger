<template>
  <div class="page-header">
    <div class="page-header__main">
      <h1 class="page-header__title">{{ title }}</h1>
      <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.extra" class="page-header__extra">
      <slot name="extra" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.page-header__title {
  margin: 0;
  font-size: var(--moona-font-title);
  font-weight: 700;
  color: var(--moona-text);
  line-height: 1.3;
}

.page-header__subtitle {
  margin: 6px 0 0;
  font-size: var(--moona-font-body);
  color: var(--moona-text-secondary);
  line-height: 1.5;
}

.page-header__extra {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
