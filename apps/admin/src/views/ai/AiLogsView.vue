<template>
  <div class="page-shell">
    <PageHeader title="调用日志" subtitle="追踪 AI 请求、耗时与失败原因" />

    <DataTableCard
      :show-empty="!loading && items.length === 0"
      empty-title="暂无调用记录"
      empty-description="用户产生 AI 交互后，日志将显示在这里。"
      empty-emoji="🤖"
      @search="load"
      @reset="resetFilters"
    >
      <template #filter>
        <el-form :inline="true" class="filter-form">
          <el-form-item label="用户 ID">
            <el-input v-model="userId" clearable placeholder="用户 ID" style="width: 200px" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="status" clearable placeholder="全部" style="width: 120px">
              <el-option label="成功" value="success" />
              <el-option label="失败" value="failed" />
            </el-select>
          </el-form-item>
        </el-form>
      </template>

      <template v-if="items.length">
        <el-table v-loading="loading" :data="items" @row-click="showDetail">
          <el-table-column prop="userId" label="用户" width="200" show-overflow-tooltip />
          <el-table-column prop="inputText" label="输入" min-width="200" show-overflow-tooltip />
          <el-table-column prop="intent" label="意图" width="100" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="durationMs" label="耗时" width="90" align="right" />
          <el-table-column prop="createdAt" label="时间" width="170" />
        </el-table>
      </template>

      <template #footer>
        <el-pagination v-model:current-page="page" layout="total, prev, pager, next" :total="total" @current-change="load" />
      </template>
    </DataTableCard>

    <el-drawer v-model="drawer" title="AI 日志详情" size="520px">
      <pre v-if="detail" class="log-detail">{{ JSON.stringify(detail, null, 2) }}</pre>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import PageHeader from '@/components/common/PageHeader.vue';
import DataTableCard from '@/components/common/DataTableCard.vue';
import request from '@/utils/request';

const loading = ref(false);
const items = ref<Array<Record<string, unknown>>>([]);
const total = ref(0);
const page = ref(1);
const userId = ref('');
const status = ref('');
const drawer = ref(false);
const detail = ref<Record<string, unknown> | null>(null);

function resetFilters() {
  userId.value = '';
  status.value = '';
  page.value = 1;
  load();
}

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

<style scoped>
.filter-form { display: contents; }
.log-detail { white-space: pre-wrap; font-size: 12px; color: var(--moona-text-secondary); }
</style>
