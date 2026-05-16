<template>
  <div>
    <div class="page-card mb-4">
      <h3>空间类型配置</h3>
      <el-table :data="templates" stripe v-loading="loading">
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="icon" label="图标" width="80" />
        <el-table-column prop="enabled" label="启用" width="80">
          <template #default="{ row }">{{ row.enabled ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link @click="edit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="page-card">
      <h3>用户创建统计</h3>
      <el-table :data="stats">
        <el-table-column prop="type" label="类型" />
        <el-table-column prop="count" label="数量" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';

const loading = ref(false);
const templates = ref<Array<Record<string, unknown>>>([]);
const stats = ref<Array<{ type: string; count: number }>>([]);

async function load() {
  loading.value = true;
  try {
    templates.value = await request.get('/admin/life-space-templates');
    stats.value = await request.get('/admin/life-spaces/stats');
  } finally {
    loading.value = false;
  }
}

async function edit(row: Record<string, unknown>) {
  const { value } = await ElMessageBox.prompt('AI 语气描述', '编辑', { inputValue: String(row.aiTone || '') });
  await request.patch(`/admin/life-space-templates/${row.id}`, { aiTone: value });
  ElMessage.success('已更新');
  load();
}

onMounted(load);
</script>

<style scoped>.mb-4 { margin-bottom: 16px; } h3 { margin: 0 0 12px; }</style>
