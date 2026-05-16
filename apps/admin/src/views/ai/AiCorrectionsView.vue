<template>
  <div class="page-card">
    <el-form :inline="true" class="mb-4">
      <el-form-item label="错误类型">
        <el-select v-model="correctionType" clearable>
          <el-option label="意图错误" value="intent_error" />
          <el-option label="分类错误" value="category_error" />
          <el-option label="金额错误" value="amount_error" />
          <el-option label="空间错误" value="space_error" />
          <el-option label="其它" value="other" />
        </el-select>
      </el-form-item>
      <el-button type="primary" @click="load">查询</el-button>
      <el-button @click="exportData('jsonl')">导出 JSONL</el-button>
    </el-form>

    <el-table v-loading="loading" :data="items" stripe>
      <el-table-column prop="originalText" label="原始输入" min-width="160" />
      <el-table-column prop="aiIntent" label="AI意图" width="100" />
      <el-table-column prop="correctedIntent" label="修正意图" width="100" />
      <el-table-column prop="correctionType" label="类型" width="120" />
      <el-table-column prop="createdAt" label="时间" width="170" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button link @click="showCompare(row)">对比</el-button>
          <el-button link type="primary" :disabled="row.isAddedToPromptExamples" @click="addExample(row.id)">
            加入示例
          </el-button>
        </template>
      </el-table-column>
    </el-table>

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
import request from '@/utils/request';

const loading = ref(false);
const items = ref<Array<Record<string, unknown>>>([]);
const correctionType = ref('');
const compareVisible = ref(false);
const current = ref<Record<string, unknown> | null>(null);

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

<style scoped>.mb-4 { margin-bottom: 16px; } h4 { margin: 0 0 8px; }</style>
