<template>
  <div v-loading="loading" class="page-shell">
    <PageHeader :title="pageTitle" subtitle="?????????">
      <template #extra>
        <el-button @click="$router.back()">????</el-button>
      </template>
    </PageHeader>

    <div v-if="user" class="moona-card detail-card">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="??">{{ user.nickname }}</el-descriptions-item>
        <el-descriptions-item label="??">{{ user.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="OpenID">{{ user.openid || '-' }}</el-descriptions-item>
        <el-descriptions-item label="??">
          <el-tag :type="user.status === 'enabled' ? 'success' : 'danger'" size="small">
            {{ user.status === 'enabled' ? '??' : '??' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="????">{{ membershipLevel }}</el-descriptions-item>
        <el-descriptions-item label="????">{{ membershipExpire }}</el-descriptions-item>
        <el-descriptions-item label="???">{{ user.transactionCount }}</el-descriptions-item>
        <el-descriptions-item label="AI ??">{{ user.aiUsageCount }}</el-descriptions-item>
        <el-descriptions-item label="????">{{ formatTime(user.lastLoginAt) }}</el-descriptions-item>
        <el-descriptions-item label="????">{{ formatTime(user.createdAt) }}</el-descriptions-item>
      </el-descriptions>

      <div v-if="txStats.length" class="tx-stats">
        <el-tag v-for="s in txStats" :key="s.type" class="tx-stats__tag">
          {{ s.type }}?{{ s.count }} ? / �{{ formatAmount(s.sum) }}
        </el-tag>
      </div>
    </div>

    <DataTableCard v-if="lifeSpaces.length" class="mt-20" :filter-show-actions="false">
      <template #default>
        <div class="table-section-title">????</div>
        <el-table :data="lifeSpaces">
          <el-table-column prop="name" label="??" />
          <el-table-column prop="type" label="??" width="120" />
          <el-table-column prop="isDefault" label="??" width="80">
            <template #default="{ row }">{{ row.isDefault ? '?' : '?' }}</template>
          </el-table-column>
        </el-table>
      </template>
    </DataTableCard>

    <DataTableCard v-if="recentTx.length" class="mt-20" :filter-show-actions="false">
      <template #default>
        <div class="table-section-title">????</div>
        <el-table :data="recentTx">
          <el-table-column prop="remark" label="??" show-overflow-tooltip />
          <el-table-column prop="type" label="??" width="90" />
          <el-table-column label="??" width="100">
            <template #default="{ row }">�{{ row.amount }}</template>
          </el-table-column>
          <el-table-column label="??" width="100">
            <template #default="{ row }">{{ row.category?.name || '-' }}</template>
          </el-table-column>
          <el-table-column label="??" width="180">
            <template #default="{ row }">{{ formatTime(row.occurredAt) }}</template>
          </el-table-column>
        </el-table>
      </template>
    </DataTableCard>

    <DataTableCard v-if="recentAiLogs.length" class="mt-20" :filter-show-actions="false">
      <template #default>
        <div class="table-section-title">?? AI ??</div>
        <el-table :data="recentAiLogs">
          <el-table-column prop="rawInput" label="??" min-width="160" show-overflow-tooltip />
          <el-table-column prop="intent" label="??" width="100" />
          <el-table-column prop="status" label="??" width="90" />
          <el-table-column label="??" width="180">
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

const pageTitle = computed(() => user.value?.nickname || '????');
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
