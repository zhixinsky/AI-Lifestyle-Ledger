<template>
  <div class="page-shell">
    <PageHeader title="订单列表" subtitle="查看支付订单与交易状态" />

    <DataTableCard
      :show-empty="!loading && items.length === 0"
      empty-title="暂无订单"
      empty-description="用户完成支付后，订单将显示在这里。"
      empty-emoji="🧾"
    >
      <template v-if="items.length">
        <el-table v-loading="loading" :data="items">
          <el-table-column prop="orderNo" label="订单号" min-width="180" />
          <el-table-column prop="userId" label="用户" width="200" show-overflow-tooltip />
          <el-table-column prop="amount" label="金额" width="100" align="right" />
          <el-table-column prop="status" label="状态" width="100" />
          <el-table-column prop="createdAt" label="创建" width="170" />
          <el-table-column prop="paidAt" label="支付" width="170" />
        </el-table>
      </template>
    </DataTableCard>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import PageHeader from '@/components/common/PageHeader.vue';
import DataTableCard from '@/components/common/DataTableCard.vue';
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
