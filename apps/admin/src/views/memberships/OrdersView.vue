<template>
  <div class="page-card">
    <el-table v-loading="loading" :data="items" stripe>
      <el-table-column prop="orderNo" label="订单号" min-width="180" />
      <el-table-column prop="userId" label="用户" width="200" />
      <el-table-column prop="amount" label="金额" width="100" />
      <el-table-column prop="status" label="状态" width="100" />
      <el-table-column prop="createdAt" label="创建" width="170" />
      <el-table-column prop="paidAt" label="支付" width="170" />
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
  try {
    const res = await request.get<{ items: Array<Record<string, unknown>> }>('/admin/orders');
    items.value = res.items;
  } finally {
    loading.value = false;
  }
});
</script>
