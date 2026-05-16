<template>
  <div class="page-card">
    <el-form :inline="true" @submit.prevent="load">
      <el-form-item label="搜索">
        <el-input v-model="keyword" placeholder="手机号/openid/昵称" clearable />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="status" clearable placeholder="全部">
          <el-option label="正常" value="enabled" />
          <el-option label="封禁" value="disabled" />
        </el-select>
      </el-form-item>
      <el-button type="primary" @click="load">查询</el-button>
    </el-form>

    <el-table v-loading="loading" :data="items" stripe>
      <el-table-column prop="nickname" label="昵称" />
      <el-table-column prop="phone" label="手机" width="130" />
      <el-table-column prop="memberLevel" label="会员" width="90" />
      <el-table-column prop="transactionCount" label="记账数" width="90" />
      <el-table-column prop="aiUsageCount" label="AI次数" width="90" />
      <el-table-column prop="status" label="状态" width="90" />
      <el-table-column prop="createdAt" label="注册" width="170">
        <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button link type="primary" @click="$router.push(`/users/${row.id}`)">详情</el-button>
          <el-button
            link
            :type="row.status === 'enabled' ? 'danger' : 'success'"
            @click="toggleStatus(row)"
          >
            {{ row.status === 'enabled' ? '封禁' : '解封' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      class="mt-4"
      layout="total, prev, pager, next"
      :total="total"
      @current-change="load"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import dayjs from 'dayjs';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';

type UserRow = {
  id: string;
  nickname: string;
  phone?: string;
  memberLevel: string;
  transactionCount: number;
  aiUsageCount: number;
  status: string;
  createdAt: string;
};

const loading = ref(false);
const items = ref<UserRow[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const keyword = ref('');
const status = ref('');

function fmt(v: string) {
  return dayjs(v).format('YYYY-MM-DD HH:mm');
}

async function load() {
  loading.value = true;
  try {
    const res = await request.get<{ items: UserRow[]; total: number }>('/admin/users', {
      params: { page: page.value, pageSize: pageSize.value, keyword: keyword.value || undefined, status: status.value || undefined },
    });
    items.value = res.items;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

async function toggleStatus(row: UserRow) {
  const next = row.status === 'enabled' ? 'disabled' : 'enabled';
  await ElMessageBox.confirm(`确认${next === 'disabled' ? '封禁' : '解封'}该用户？`);
  await request.patch(`/admin/users/${row.id}/status`, { status: next });
  ElMessage.success('已更新');
  load();
}

onMounted(load);
</script>

<style scoped>.mt-4 { margin-top: 16px; }</style>
