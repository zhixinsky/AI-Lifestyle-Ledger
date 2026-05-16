<template>
  <div class="page-shell">
    <PageHeader title="用户洞察" subtitle="查看用户画像、会员状态与使用行为" />

    <DataTableCard
      :show-empty="!loading && items.length === 0"
      empty-title="暂无用户"
      empty-description="还没有注册用户，或当前筛选条件下无结果。"
      empty-emoji="👤"
      @search="load"
      @reset="resetFilters"
    >
      <template #filter>
        <el-form :inline="true" class="filter-form">
          <el-form-item label="搜索">
            <el-input v-model="keyword" clearable placeholder="手机号 / openid / 昵称" style="width: 220px" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="status" clearable placeholder="全部" style="width: 120px">
              <el-option label="正常" value="enabled" />
              <el-option label="封禁" value="disabled" />
            </el-select>
          </el-form-item>
        </el-form>
      </template>

      <template v-if="items.length">
        <el-table v-loading="loading" :data="items">
          <el-table-column prop="nickname" label="昵称" min-width="120" />
          <el-table-column prop="phone" label="手机" width="130" />
          <el-table-column prop="memberLevel" label="会员" width="90" />
          <el-table-column prop="transactionCount" label="记账数" width="90" align="right" />
          <el-table-column prop="aiUsageCount" label="AI 次数" width="90" align="right" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 'enabled' ? 'success' : 'danger'" size="small">
                {{ row.status === 'enabled' ? '正常' : '封禁' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="注册时间" width="170">
            <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="$router.push(`/users/${row.id}/insight`)">洞察</el-button>
              <el-button link @click="$router.push(`/users/${row.id}`)">详情</el-button>
              <el-button link :type="row.status === 'enabled' ? 'danger' : 'success'" @click="toggleStatus(row)">
                {{ row.status === 'enabled' ? '封禁' : '解封' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <template #footer>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          layout="total, prev, pager, next"
          :total="total"
          @current-change="load"
        />
      </template>
    </DataTableCard>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import dayjs from 'dayjs';
import { ElMessage, ElMessageBox } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import DataTableCard from '@/components/common/DataTableCard.vue';
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

function resetFilters() {
  keyword.value = '';
  status.value = '';
  page.value = 1;
  load();
}

async function load() {
  loading.value = true;
  try {
    const res = await request.get<{ items: UserRow[]; total: number }>('/admin/users', {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        keyword: keyword.value || undefined,
        status: status.value || undefined,
      },
    });
    items.value = res.items;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

async function toggleStatus(row: UserRow) {
  const next = row.status === 'enabled' ? 'disabled' : 'enabled';
  const action = next === 'disabled' ? '封禁' : '解封';
  const label = row.nickname || row.phone || row.id;
  try {
    await ElMessageBox.confirm(`确认${action}用户「${label}」？封禁后该用户将无法登录小程序。`, `${action}用户`, {
      type: 'warning',
      confirmButtonText: action,
      cancelButtonText: '取消',
    });
  } catch {
    return;
  }
  try {
    await request.patch(`/admin/users/${row.id}/status`, { status: next });
    row.status = next;
    ElMessage.success(`${action}成功`);
    load();
  } catch {
    /* 错误由 request 拦截器提示 */
  }
}

onMounted(load);
</script>

<style scoped>
.filter-form {
  display: contents;
}
</style>
