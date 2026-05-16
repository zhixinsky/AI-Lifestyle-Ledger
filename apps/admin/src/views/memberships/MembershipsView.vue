<template>
  <div class="page-card">
    <el-table v-loading="loading" :data="items" stripe>
      <el-table-column label="用户" min-width="160">
        <template #default="{ row }">{{ row.user?.nickname }} ({{ row.userId }})</template>
      </el-table-column>
      <el-table-column prop="level" label="等级" width="100" />
      <el-table-column prop="expireAt" label="到期" width="180" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button link type="primary" @click="extend(row.userId)">延长30天</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';

const loading = ref(false);
const items = ref<Array<Record<string, unknown>>>([]);

async function load() {
  loading.value = true;
  try {
    const res = await request.get<{ items: Array<Record<string, unknown>> }>('/admin/memberships');
    items.value = res.items;
  } finally {
    loading.value = false;
  }
}

async function extend(userId: string) {
  await request.patch(`/admin/memberships/${userId}`, { level: 'pro', extendDays: 30 });
  ElMessage.success('已延长会员');
  load();
}

onMounted(load);
</script>
