<template>
  <div v-loading="loading" class="page-card">
    <el-page-header @back="$router.back()" content="用户详情" />
    <el-descriptions v-if="user" :column="2" border class="mt-4">
      <el-descriptions-item label="昵称">{{ user.nickname }}</el-descriptions-item>
      <el-descriptions-item label="手机">{{ user.phone || '-' }}</el-descriptions-item>
      <el-descriptions-item label="OpenID">{{ user.openid || '-' }}</el-descriptions-item>
      <el-descriptions-item label="会员">{{ (user as any).membership?.level || 'free' }}</el-descriptions-item>
      <el-descriptions-item label="记账数">{{ user.transactionCount }}</el-descriptions-item>
      <el-descriptions-item label="AI 调用">{{ user.aiUsageCount }}</el-descriptions-item>
    </el-descriptions>

    <h3 class="mt-4">最近账单</h3>
    <el-table :data="user?.recentTransactions || []" size="small">
      <el-table-column prop="remark" label="备注" />
      <el-table-column prop="amount" label="金额" width="100" />
      <el-table-column prop="occurredAt" label="时间" width="180" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import request from '@/utils/request';

const route = useRoute();
const loading = ref(true);
const user = ref<Record<string, unknown> | null>(null);

onMounted(async () => {
  try {
    user.value = await request.get(`/admin/users/${route.params.id}`);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>.mt-4 { margin-top: 16px; }</style>
