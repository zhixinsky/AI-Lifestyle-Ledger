<template>
  <div class="page-shell">
    <PageHeader title="操作日志" subtitle="审计关键运营与配置变更" />

    <DataTableCard
      :show-empty="!loading && items.length === 0"
      empty-title="暂无操作记录"
      empty-description="管理员执行重要操作后，日志将记录在这里。"
      empty-emoji="📋"
      :filter-show-actions="false"
    >
      <template v-if="items.length">
        <el-table v-loading="loading" :data="items">
          <el-table-column prop="createdAt" label="时间" width="170" />
          <el-table-column label="管理员" width="120">
            <template #default="{ row }">{{ row.admin?.username || '-' }}</template>
          </el-table-column>
          <el-table-column prop="module" label="模块" width="120" />
          <el-table-column prop="action" label="操作" width="160" />
          <el-table-column prop="targetId" label="目标" min-width="160" show-overflow-tooltip />
        </el-table>
      </template>
    </DataTableCard>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import PageHeader from '@/components/common/PageHeader.vue';
import DataTableCard from '@/components/common/DataTableCard.vue';
import request from '@/utils/request';

const loading = ref(false);
const items = ref<Array<Record<string, unknown>>>([]);

onMounted(async () => {
  loading.value = true;
  try {
    const res = await request.get<{ items: Array<Record<string, unknown>> }>('/admin/logs');
    items.value = res.items;
  } finally {
    loading.value = false;
  }
});
</script>
