<template>
  <div class="page-shell">
    <PageHeader title="纠错中心" subtitle="分析用户修正样本，持续优化 Prompt 与模型效果">
      <template #extra>
        <el-button @click="exportData('jsonl')">导出 JSONL</el-button>
      </template>
    </PageHeader>

    <DataTableCard
      :show-empty="!loading && items.length === 0"
      empty-title="暂无纠错样本"
      empty-description="用户在确认页修改 AI 结果后，样本会出现在这里。"
      empty-emoji="✏️"
      @search="load"
      @reset="resetFilters"
    >
      <template #filter>
        <el-form :inline="true" class="filter-form">
          <el-form-item label="错误类型">
            <el-select v-model="correctionType" clearable placeholder="全部" style="width: 140px">
              <el-option label="意图错误" value="intent_error" />
              <el-option label="分类错误" value="category_error" />
              <el-option label="金额错误" value="amount_error" />
              <el-option label="空间错误" value="space_error" />
              <el-option label="其它" value="other" />
            </el-select>
          </el-form-item>
        </el-form>
      </template>

      <template v-if="items.length">
        <el-table v-loading="loading" :data="items">
          <el-table-column prop="originalText" label="原始输入" min-width="160" show-overflow-tooltip />
          <el-table-column prop="aiIntent" label="AI 意图" width="100" />
          <el-table-column prop="correctedIntent" label="修正意图" width="100" />
          <el-table-column prop="correctionType" label="类型" width="120" />
          <el-table-column prop="createdAt" label="时间" width="170" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="showCompare(row)">对比</el-button>
              <el-button link :disabled="row.isAddedToPromptExamples" @click="addExample(row.id as string)">
                加入示例
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </DataTableCard>

    <el-dialog v-model="compareVisible" title="纠错对比" width="800px">
      <div v-if="current" class="compare-panel">
        <div class="compare-panel__side compare-panel__side--ai">
          <h4>AI 识别</h4>
          <p><b>输入：</b>{{ current.originalText }}</p>
          <p><b>意图：</b>{{ current.aiIntent || '-' }}</p>
          <pre>{{ JSON.stringify(current.aiResultJson, null, 2) }}</pre>
        </div>
        <div class="compare-panel__side compare-panel__side--user">
          <h4>用户修正</h4>
          <p><b>意图：</b>{{ current.correctedIntent || '-' }}</p>
          <pre>{{ JSON.stringify(current.correctedResultJson, null, 2) }}</pre>
        </div>
      </div>
    </el-dialog>
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
const correctionType = ref('');
const compareVisible = ref(false);
const current = ref<Record<string, unknown> | null>(null);

function resetFilters() {
  correctionType.value = '';
  load();
}

async function load() {
  loading.value = true;
  try {
    const res = await request.get<{ items: Array<Record<string, unknown>> }>('/admin/ai/corrections', {
      params: { correctionType: correctionType.value || undefined, pageSize: 50 },
    });
    items.value = res.items;
  } finally {
    loading.value = false;
  }
}

function showCompare(row: Record<string, unknown>) {
  current.value = row;
  compareVisible.value = true;
}

async function addExample(id: string) {
  await request.post(`/admin/ai/corrections/${id}/add-to-examples`);
  ElMessage.success('已加入 Prompt 示例库');
  load();
}

async function exportData(format: 'jsonl' | 'csv') {
  const res = await request.get<{ content: string }>('/admin/ai/corrections/export', { params: { format } });
  const blob = new Blob([res.content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `corrections.${format === 'jsonl' ? 'jsonl' : 'csv'}`;
  a.click();
}

onMounted(load);
</script>

<style scoped lang="scss">
.filter-form { display: contents; }
.compare-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.compare-panel__side {
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--moona-border);
  &--ai { background: #fff7f7; border-color: #fde8e8; }
  &--user { background: #f0fdf8; border-color: #d4f5ed; }
}
h4 { margin: 0 0 8px; font-size: 14px; }
pre { font-size: 12px; white-space: pre-wrap; }
</style>
