<template>
  <div v-loading="loading" class="page-shell">
    <PageHeader :title="pageTitle" subtitle="用户详情与最近行为">
      <template #extra>
        <el-button @click="$router.back()">返回列表</el-button>
      </template>
    </PageHeader>

    <div v-if="user" class="moona-card detail-card">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="昵称">{{ user.nickname }}</el-descriptions-item>
        <el-descriptions-item label="手机">{{ user.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="OpenID">{{ user.openid || '-' }}</el-descriptions-item>
        <el-descriptions-item label="会员">{{ (user as any).membership?.level || 'free' }}</el-descriptions-item>
        <el-descriptions-item label="记账数">{{ user.transactionCount }}</el-descriptions-item>
        <el-descriptions-item label="AI 调用">{{ user.aiUsageCount }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <DataTableCard v-if="recentTx.length" class="mt-20" :filter-show-actions="false">
      <template #default>
        <div class="table-section-title">最近账单</div>
        <el-table :data="recentTx">
          <el-table-column prop="remark" label="备注" />
          <el-table-column prop="amount" label="金额" width="100" />
          <el-table-column prop="occurredAt" label="时间" width="180" />
        </el-table>
      </template>
    </DataTableCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from '@/components/common/PageHeader.vue';
import DataTableCard from '@/components/common/DataTableCard.vue';
import request from '@/utils/request';

const route = useRoute();
const loading = ref(true);
const user = ref<Record<string, unknown> | null>(null);

const pageTitle = computed(() => (user.value?.nickname as string) || '用户详情');
const recentTx = computed(() => {
  const list = (user.value as { recentTransactions?: unknown[] })?.recentTransactions;
  return Array.isArray(list) ? list : [];
});

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
</style>
