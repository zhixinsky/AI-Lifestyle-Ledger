<template>
  <div class="page-shell">
    <PageHeader title="会员运营" subtitle="管理会员等级、到期与手动开通">
      <template #extra>
        <el-button type="primary" @click="openGrant">手动开通</el-button>
        <el-button @click="$router.push('/orders')">查看订单</el-button>
      </template>
    </PageHeader>

    <DataTableCard
      :show-empty="!loading && items.length === 0"
      empty-title="暂无会员数据"
      empty-description="用户开通会员后，记录将显示在这里。"
      empty-emoji="👑"
      @search="load"
      @reset="resetFilter"
    >
      <template #filter>
        <el-form :inline="true">
          <el-form-item label="等级">
            <el-select v-model="levelFilter" clearable placeholder="全部" style="width: 120px">
              <el-option label="免费" value="free" />
              <el-option label="Pro" value="pro" />
              <el-option label="Plus" value="plus" />
            </el-select>
          </el-form-item>
        </el-form>
      </template>
      <template v-if="items.length">
        <el-table v-loading="loading" :data="items">
          <el-table-column label="用户" min-width="180">
            <template #default="{ row }">{{ row.user?.nickname }} · {{ row.userId }}</template>
          </el-table-column>
          <el-table-column prop="level" label="等级" width="100" />
          <el-table-column prop="expireAt" label="到期时间" width="180">
            <template #default="{ row }">{{ formatTime(row.expireAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="extend(row.userId as string)">延长 30 天</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </DataTableCard>

    <el-dialog v-model="grantVisible" title="手动开通会员" width="440px">
      <el-form label-width="88px">
        <el-form-item label="用户 ID" required>
          <el-input v-model="grantForm.userId" placeholder="从用户列表复制 userId" />
        </el-form-item>
        <el-form-item label="等级">
          <el-select v-model="grantForm.level" style="width: 100%">
            <el-option label="Pro" value="pro" />
            <el-option label="Plus" value="plus" />
          </el-select>
        </el-form-item>
        <el-form-item label="延长天数">
          <el-input-number v-model="grantForm.extendDays" :min="1" :max="3650" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="grantVisible = false">取消</el-button>
        <el-button type="primary" :loading="granting" @click="submitGrant">确认开通</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import DataTableCard from '@/components/common/DataTableCard.vue';
import request from '@/utils/request';

const loading = ref(false);
const granting = ref(false);
const items = ref<Array<Record<string, unknown>>>([]);
const levelFilter = ref('');
const grantVisible = ref(false);
const grantForm = reactive({ userId: '', level: 'pro', extendDays: 30 });

function formatTime(v?: string) {
  return v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-';
}

function resetFilter() {
  levelFilter.value = '';
  load();
}

function openGrant() {
  grantForm.userId = '';
  grantForm.level = 'pro';
  grantForm.extendDays = 30;
  grantVisible.value = true;
}

async function load() {
  loading.value = true;
  try {
    const params: Record<string, string> = {};
    if (levelFilter.value) params.level = levelFilter.value;
    const res = await request.get<{ items: Array<Record<string, unknown>> }>('/admin/memberships', { params });
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

async function submitGrant() {
  if (!grantForm.userId.trim()) {
    ElMessage.warning('请填写用户 ID');
    return;
  }
  granting.value = true;
  try {
    await request.patch(`/admin/memberships/${grantForm.userId.trim()}`, {
      level: grantForm.level,
      extendDays: grantForm.extendDays,
    });
    ElMessage.success('已开通');
    grantVisible.value = false;
    load();
  } finally {
    granting.value = false;
  }
}

onMounted(load);
</script>
