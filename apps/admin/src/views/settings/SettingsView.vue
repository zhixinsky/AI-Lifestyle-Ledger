<template>
  <div class="page-shell">
    <PageHeader title="系统配置" subtitle="AI 限额、协议地址与全局开关" />

    <DataTableCard :show-empty="!loading && items.length === 0" empty-title="暂无配置" empty-description="系统配置加载失败或为空。" :filter-show-actions="false">
      <template v-if="items.length">
        <el-table v-loading="loading" :data="items">
          <el-table-column prop="group" label="分组" width="100" />
          <el-table-column prop="key" label="键" min-width="200" />
          <el-table-column prop="description" label="说明" min-width="200" />
          <el-table-column label="值" min-width="220">
            <template #default="{ row }">
              <el-input v-model="editValues[row.key as string]" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="save(row.key as string)">保存</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </DataTableCard>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import DataTableCard from '@/components/common/DataTableCard.vue';
import request from '@/utils/request';

type Config = { key: string; value: unknown; description?: string; group: string };

const loading = ref(false);
const items = ref<Config[]>([]);
const editValues = reactive<Record<string, string>>({});

async function load() {
  loading.value = true;
  try {
    items.value = await request.get('/admin/settings');
    for (const item of items.value) {
      editValues[item.key] = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
    }
  } finally {
    loading.value = false;
  }
}

async function save(key: string) {
  let value: unknown = editValues[key];
  try {
    value = JSON.parse(editValues[key]);
  } catch {
    /* string */
  }
  await request.patch(`/admin/settings/${key}`, { value });
  ElMessage.success('已保存');
}

onMounted(load);
</script>
