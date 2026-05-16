<template>
  <div class="page-shell">
    <PageHeader title="生活空间管理" subtitle="空间模板配置与用户创建统计" />

    <el-row :gutter="16">
      <el-col :xs="24" :lg="14">
        <DataTableCard :show-empty="!loading && templates.length === 0" empty-title="暂无模板" :filter-show-actions="false">
          <template v-if="templates.length">
            <el-table v-loading="loading" :data="templates">
              <el-table-column prop="name" label="名称" />
              <el-table-column prop="type" label="类型" width="120" />
              <el-table-column prop="enabled" label="启用" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? '是' : '否' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button link type="primary" @click="edit(row)">编辑</el-button>
                </template>
              </el-table-column>
            </el-table>
          </template>
        </DataTableCard>
      </el-col>
      <el-col :xs="24" :lg="10">
        <DataTableCard :show-empty="stats.length === 0" empty-title="暂无统计" :filter-show-actions="false">
          <template v-if="stats.length">
            <div class="table-section-title">用户创建统计</div>
            <el-table :data="stats">
              <el-table-column prop="type" label="类型" />
              <el-table-column prop="count" label="数量" align="right" />
            </el-table>
          </template>
        </DataTableCard>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import DataTableCard from '@/components/common/DataTableCard.vue';
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

<style scoped>
.table-section-title {
  padding: 16px 20px 0;
  font-size: 15px;
  font-weight: 600;
}
</style>
