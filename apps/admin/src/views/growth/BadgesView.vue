<template>
  <div class="page-card">
    <el-table v-loading="loading" :data="items" stripe>
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="key" label="Key" width="140" />
      <el-table-column prop="earnedCount" label="获得人数" width="100" />
      <el-table-column prop="description" label="描述" show-overflow-tooltip />
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
  items.value = await request.get('/admin/growth/badges');
  loading.value = false;
});
</script>
