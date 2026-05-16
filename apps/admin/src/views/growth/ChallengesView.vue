<template>
  <div class="page-shell">
    <PageHeader title="挑战管理" subtitle="挑战任务与完成率" />
    <DataTableCard :show-empty="!loading && items.length === 0" empty-title="暂无挑战" :filter-show-actions="false">
      <template v-if="items.length">
        <el-table v-loading="loading" :data="items">
          <el-table-column prop="name" label="挑战" />
          <el-table-column prop="type" label="类型" width="100" />
          <el-table-column prop="participantCount" label="参与" width="90" align="right" />
          <el-table-column prop="completionRate" label="完成率 %" width="100" align="right" />
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
  items.value = await request.get('/admin/growth/challenges');
  loading.value = false;
});
</script>
