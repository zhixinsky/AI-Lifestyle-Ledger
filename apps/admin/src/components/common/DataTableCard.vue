<template>
  <div class="data-table-card moona-card">
    <FilterBar
      v-if="$slots.filter"
      :show-actions="filterShowActions"
      @search="$emit('search')"
      @reset="$emit('reset')"
    >
      <slot name="filter" />
    </FilterBar>
    <div class="data-table-card__body">
      <slot v-if="!showEmpty" />
      <EmptyState v-else v-bind="emptyProps">
        <template v-if="$slots.emptyAction" #action>
          <slot name="emptyAction" />
        </template>
      </EmptyState>
    </div>
    <div v-if="$slots.footer" class="data-table-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';
import FilterBar from './FilterBar.vue';
import EmptyState from './EmptyState.vue';

const props = defineProps<{
  showEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: Component;
  emptyEmoji?: string;
  filterShowActions?: boolean;
}>();

defineEmits<{ search: []; reset: [] }>();

const emptyProps = computed(() => ({
  title: props.emptyTitle || '暂无数据',
  description: props.emptyDescription || '当前没有可展示的内容',
  icon: props.emptyIcon,
  emoji: props.emptyEmoji,
}));
</script>

<style scoped lang="scss">
.data-table-card {
  overflow: hidden;
  width: 100%;
}

.data-table-card__body {
  min-height: 120px;
  width: 100%;
}

.data-table-card__footer {
  padding: 12px 20px;
  border-top: 1px solid var(--moona-border);
  display: flex;
  justify-content: flex-end;
  background: #fff;
}

:deep(.el-table) {
  --el-table-border-color: var(--moona-border);

  th.el-table__cell {
    font-weight: 600;
  }
}
</style>
