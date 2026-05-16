<template>
  <div class="page-card">
    <el-table v-loading="loading" :data="items" stripe>
      <el-table-column prop="createdAt" label="时间" width="170" />
      <el-table-column prop="admin.username" label="管理员" width="120" />
      <el-table-column prop="module" label="模块" width="120" />
      <el-table-column prop="action" label="操作" width="160" />
      <el-table-column prop="targetId" label="目标" width="180" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import request from '@/utils/request';

const loading = ref(false);
const items = ref<Array<Record<string, unknown>>>([]);

onMounted(async () => {
  loading.value = true;
  const res = await request.get<{ items: Array<Record<string, unknown>> }>('/admin/logs');
  items.value = res.items;
  loading.value = false;
});
</script>
