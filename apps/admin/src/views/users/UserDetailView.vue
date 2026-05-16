<template>
  <div v-loading="loading" class="page-shell">
    <PageHeader :title="pageTitle" subtitle="查看用户基础信息、账单与生活空间">
      <template #extra>
        <el-button
          v-if="user"
          link
          :type="user.status === 'enabled' ? 'danger' : 'success'"
          @click="toggleUserStatus"
        >
          {{ user.status === 'enabled' ? '封禁' : '解封' }}
        </el-button>
        <el-button @click="$router.push('/users')">返回列表</el-button>
      </template>
    </PageHeader>

    <div v-if="user" class="moona-card detail-card">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="昵称">{{ user.nickname }}</el-descriptions-item>
        <el-descriptions-item label="手机">{{ user.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="OpenID">{{ user.openid || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="user.status === 'enabled' ? 'success' : 'danger'" size="small">
            {{ user.status === 'enabled' ? '正常' : '封禁' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="会员等级">{{ membershipLevel }}</el-descriptions-item>
        <el-descriptions-item label="会员到期">{{ membershipExpire }}</el-descriptions-item>
        <el-descriptions-item label="记账笔数">{{ user.transactionCount }}</el-descriptions-item>
        <el-descriptions-item label="AI 次数">{{ user.aiUsageCount }}</el-descriptions-item>
        <el-descriptions-item label="最近登录">{{ formatTime(user.lastLoginAt) }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ formatTime(user.createdAt) }}</el-descriptions-item>
      </el-descriptions>

      <div v-if="txStats.length" class="tx-stats">
        <el-tag v-for="s in txStats" :key="s.type" class="tx-stats__tag">
          {{ s.type }} · {{ s.count }} 笔 / ¥{{ formatAmount(s.sum) }}
        </el-tag>
      </div>
    </div>

    <DataTableCard v-if="lifeSpaces.length" class="mt-20" :filter-show-actions="false">
      <template #default>
        <div class="table-section-title">生活空间</div>
        <el-table :data="lifeSpaces">
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="isDefault" label="默认" width="80">
            <template #default="{ row }">{{ row.isDefault ? '是' : '否' }}</template>
          </el-table-column>
        </el-table>
      </template>
    </DataTableCard>

    <DataTableCard v-if="recentTx.length" class="mt-20" :filter-show-actions="false">
      <template #default>
        <div class="table-section-title">近期账单</div>
        <el-table :data="recentTx">
          <el-table-column prop="remark" label="备注" show-overflow-tooltip />
          <el-table-column prop="type" label="类型" width="90" />
          <el-table-column label="金额" width="100">
            <template #default="{ row }">¥{{ row.amount }}</template>
          </el-table-column>
          <el-table-column label="分类" width="100">
            <template #default="{ row }">{{ row.category?.name || '-' }}</template>
          </el-table-column>
          <el-table-column label="时间" width="180">
            <template #default="{ row }">{{ formatTime(row.occurredAt) }}</template>
          </el-table-column>
        </el-table>
      </template>
    </DataTableCard>

    <DataTableCard v-if="recentAiLogs.length" class="mt-20" :filter-show-actions="false">
      <template #default>
        <div class="table-section-title">近期 AI 记录</div>
        <el-table :data="recentAiLogs">
          <el-table-column prop="rawInput" label="输入" min-width="160" show-overflow-tooltip />
          <el-table-column prop="intent" label="意图" width="100" />
          <el-table-column prop="status" label="状态" width="90" />
          <el-table-column label="时间" width="180">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
        </el-table>
      </template>
    </DataTableCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import dayjs from 'dayjs';
import { ElMessage, ElMessageBox } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import DataTableCard from '@/components/common/DataTableCard.vue';
import request from '@/utils/request';

type UserDetail = {
  id: string;
  nickname: string;
  phone?: string;
  openid?: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
  transactionCount: number;
  aiUsageCount: number;
  membership?: { level: string; expireAt?: string };
  lifeSpaces?: Array<Record<string, unknown>>;
  recentTransactions?: Array<Record<string, unknown>>;
  recentAiLogs?: Array<Record<string, unknown>>;
  txStats?: Array<{ type: string; _count: number; _sum: { amount: number | null } }>;
};

const route = useRoute();
const loading = ref(true);
const user = ref<UserDetail | null>(null);

const pageTitle = computed(() => user.value?.nickname || '用户详情');
const membershipLevel = computed(() => user.value?.membership?.level || 'free');
const membershipExpire = computed(() => {
  const t = user.value?.membership?.expireAt;
  return t ? formatTime(t) : '-';
});
const lifeSpaces = computed(() => user.value?.lifeSpaces || []);
const recentTx = computed(() => user.value?.recentTransactions || []);
const recentAiLogs = computed(() => user.value?.recentAiLogs || []);
const txStats = computed(() =>
  (user.value?.txStats || []).map((s) => ({
    type: s.type,
    count: s._count,
    sum: s._sum?.amount ?? 0,
  })),
);

function formatTime(v?: string) {
  return v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-';
}

function formatAmount(v: number) {
  return Number(v).toFixed(2);
}

async function toggleUserStatus() {
  if (!user.value) return;
  const next = user.value.status === 'enabled' ? 'disabled' : 'enabled';
  const action = next === 'disabled' ? '封禁' : '解封';
  const label = user.value.nickname || user.value.phone || user.value.id;
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
    await request.patch(`/admin/users/${user.value.id}/status`, { status: next });
    user.value.status = next;
    ElMessage.success(`${action}成功`);
  } catch {
  }
}

onMounted(async () => {
  try {
    user.value = await request.get(`/admin/users/${route.params.id}`);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.detail-card { padding: 20px; }
.mt-20 { margin-top: 20px; }
.table-section-title {
  padding: 16px 20px 0;
  font-size: 15px;
  font-weight: 600;
}
.tx-stats {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tx-stats__tag { margin: 0; }
</style>
