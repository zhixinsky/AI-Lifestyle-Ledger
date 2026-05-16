<template>
  <div class="page-shell">
    <PageHeader title="Prompt 示例库" subtitle="维护可注入模型的示例样本">
      <template #extra>
        <el-button type="primary" @click="openEdit()">新增示例</el-button>
      </template>
    </PageHeader>

    <DataTableCard
      :show-empty="!loading && items.length === 0"
      empty-title="暂无示例"
      empty-description="从纠错中心加入样本，或手动新增 Prompt 示例。"
      empty-emoji="💡"
    >
      <template v-if="items.length">
        <el-table v-loading="loading" :data="items">
          <el-table-column prop="scene" label="场景" width="120" />
          <el-table-column prop="inputText" label="输入" min-width="200" show-overflow-tooltip />
          <el-table-column prop="enabled" label="启用" width="80">
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? '是' : '否' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="80" align="right" />
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="remove(row.id as string)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </DataTableCard>

    <el-dialog v-model="visible" title="Prompt 示例" width="600px">
      <el-form label-width="80px">
        <el-form-item label="场景">
          <el-select v-model="form.scene" style="width: 100%">
            <el-option label="账单解析" value="bill_parse" />
            <el-option label="聊天" value="chat" />
            <el-option label="洞察" value="insight" />
            <el-option label="问候" value="greeting" />
          </el-select>
        </el-form-item>
        <el-form-item label="输入"><el-input v-model="form.inputText" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="期望 JSON"><el-input v-model="expectedJsonStr" type="textarea" :rows="6" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="form.enabled" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import DataTableCard from '@/components/common/DataTableCard.vue';
import request from '@/utils/request';

const loading = ref(false);
const items = ref<Array<Record<string, unknown>>>([]);
const visible = ref(false);
const form = reactive<Record<string, unknown>>({ scene: 'bill_parse', enabled: true, sort: 0 });
const expectedJsonStr = ref('{}');

async function load() {
  loading.value = true;
  items.value = await request.get('/admin/ai/prompt-examples');
  loading.value = false;
}

function openEdit(row?: Record<string, unknown>) {
  Object.assign(form, row || { scene: 'bill_parse', inputText: '', enabled: true, sort: 0 });
  expectedJsonStr.value = JSON.stringify(row?.expectedJson || {}, null, 2);
  visible.value = true;
}

async function save() {
  const payload = { ...form, expectedJson: JSON.parse(expectedJsonStr.value || '{}') };
  if (form.id) await request.patch(`/admin/ai/prompt-examples/${form.id}`, payload);
  else await request.post('/admin/ai/prompt-examples', payload);
  ElMessage.success('已保存');
  visible.value = false;
  load();
}

async function remove(id: string) {
  await request.delete(`/admin/ai/prompt-examples/${id}`);
  load();
}

onMounted(load);
</script>
