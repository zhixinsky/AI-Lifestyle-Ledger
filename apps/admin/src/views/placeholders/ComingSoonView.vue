<template>
  <div class="page-shell">
    <PageHeader :title="title" :subtitle="subtitle" />
    <div class="moona-card">
      <EmptyState :title="emptyTitle" :description="emptyDescription" emoji="🚧" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from '@/components/common/PageHeader.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import { routeMetaMap } from '@/config/menu';

const route = useRoute();
const meta = computed(() => routeMetaMap[route.path] || { title: '即将上线', subtitle: '' });
const title = computed(() => meta.value.title);
const subtitle = computed(() => meta.value.subtitle || '');
const emptyTitle = '功能建设中';
const emptyDescription = '该模块正在开发中，敬请期待。';
</script>
