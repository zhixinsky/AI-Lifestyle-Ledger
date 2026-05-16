<template>
  <div class="page-shell">
    <PageHeader title="会员运营" subtitle="管理会员等级、到期与手动开通">
      <template #extra>
        <el-button @click="$router.push('/orders')">查看订单</el-button>
      </template>
    </PageHeader>

    <DataTableCard
      :show-empty="!loading && items.length === 0"
      empty-title="暂无会员数据"
      empty-description="用户开通会员后，记录将显示在这里。"
      empty-emoji="👑"
    >
      <template v-if="items.length">
        <el-table v-loading="loading" :data="items">
          <el-table-column label="用户" min-width="180">
            <template #default="{ row }">{{ row.user?.nickname }} · {{ row.userId }}</template>
          </el-table-column>
          <el-table-column prop="level" label="等级" width="100" />
          <el-table-column prop="expireAt" label="到期时间" width="180" />
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="extend(row.userId as string)">延长 30 天</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </DataTableCard>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import DataTableCard from '@/components/common/DataTableCard.vue';
import request from '@/utils/request';

const loading = ref(false);
const items = ref<Array<Record<string, unknown>>>([]);

async function load() {
  loading.value = true;
  try {
    const res = await request.get<{ items: Array<Record<string, unknown>> }>('/admin/memberships');
    items.value = res.items;
  } finally {
    loading.value = false;
  }
}

async function extend(userId: string) {
  await request.patch(`/admin/memberships/${userId}`, { level: 'pro', extendDays: 30 });
  ElMessage.success('已延长会员');
  load();
}

onMounted(load);
</script>
