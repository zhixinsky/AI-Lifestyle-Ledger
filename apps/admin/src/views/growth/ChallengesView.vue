<template>
  <div class="page-card">
    <el-table v-loading="loading" :data="items" stripe>
      <el-table-column prop="name" label="挑战" />
      <el-table-column prop="type" label="类型" width="100" />
      <el-table-column prop="participantCount" label="参与" width="90" />
      <el-table-column prop="completionRate" label="完成率%" width="100" />
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
  items.value = await request.get('/admin/growth/challenges');
  loading.value = false;
});
</script>
