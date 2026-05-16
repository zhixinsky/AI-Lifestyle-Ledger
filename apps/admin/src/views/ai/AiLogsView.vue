<template>
  <div class="page-card">
    <el-form :inline="true" class="mb-4">
      <el-form-item label="用户ID"><el-input v-model="userId" clearable /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="status" clearable>
          <el-option label="成功" value="success" />
          <el-option label="失败" value="failed" />
        </el-select>
      </el-form-item>
      <el-button type="primary" @click="load">查询</el-button>
    </el-form>
    <el-table v-loading="loading" :data="items" stripe @row-click="showDetail">
      <el-table-column prop="userId" label="用户" width="200" />
      <el-table-column prop="inputText" label="输入" min-width="200" show-overflow-tooltip />
      <el-table-column prop="intent" label="意图" width="100" />
      <el-table-column prop="status" label="状态" width="90" />
      <el-table-column prop="durationMs" label="耗时ms" width="90" />
      <el-table-column prop="createdAt" label="时间" width="170" />
    </el-table>
    <el-pagination v-model:current-page="page" class="mt-4" :total="total" layout="prev, pager, next" @current-change="load" />

    <el-drawer v-model="drawer" title="AI 日志详情" size="50%">
      <pre v-if="detail">{{ JSON.stringify(detail, null, 2) }}</pre>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import request from '@/utils/request';

const loading = ref(false);
const items = ref<Array<Record<string, unknown>>>([]);
const total = ref(0);
const page = ref(1);
const userId = ref('');
const status = ref('');
const drawer = ref(false);
const detail = ref<Record<string, unknown> | null>(null);

async function load() {
  loading.value = true;
  try {
    const res = await request.get<{ items: Array<Record<string, unknown>>; total: number }>('/admin/ai/logs', {
      params: { page: page.value, userId: userId.value || undefined, status: status.value || undefined },
    });
    items.value = res.items;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

async function showDetail(row: { id: string }) {
  detail.value = await request.get(`/admin/ai/logs/${row.id}`);
  drawer.value = true;
}

onMounted(load);
</script>

<style scoped>.mb-4,.mt-4 { margin: 16px 0; } pre { white-space: pre-wrap; font-size: 12px; }</style>
