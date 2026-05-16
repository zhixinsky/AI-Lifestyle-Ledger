<template>
  <div class="filter-bar">
    <slot />
    <div v-if="showActions" class="filter-bar__actions">
      <el-button @click="$emit('reset')">重置</el-button>
      <el-button type="primary" @click="$emit('search')">查询</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{ showActions?: boolean }>(),
  { showActions: true },
);

defineEmits<{ search: []; reset: [] }>();
</script>

<style scoped lang="scss">
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px 16px;
  padding: 16px 20px;
  margin-bottom: 0;
  background: #f9fafb;
  border-bottom: 1px solid var(--moona-border);

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    font-size: var(--moona-font-caption);
    color: var(--moona-text-secondary);
  }
}

.filter-bar__actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}
</style>
