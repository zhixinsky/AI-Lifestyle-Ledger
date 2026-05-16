<template>
  <div class="page-shell">
    <PageHeader title="徽章管理" subtitle="成长体系徽章配置" />
    <DataTableCard :show-empty="!loading && items.length === 0" empty-title="暂无徽章" :filter-show-actions="false">
      <template v-if="items.length">
        <el-table v-loading="loading" :data="items">
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="key" label="Key" width="140" />
          <el-table-column prop="earnedCount" label="获得人数" width="100" align="right" />
          <el-table-column prop="description" label="描述" show-overflow-tooltip />
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
  items.value = await request.get('/admin/growth/badges');
  loading.value = false;
});
</script>
