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
              <el-table-column prop="sort" label="排序" width="70" align="right" />
              <el-table-column prop="enabled" label="启用" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? '是' : '否' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
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

    <el-dialog v-model="dialogVisible" title="编辑空间模板" width="560px">
      <el-form label-width="88px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="图标"><el-input v-model="form.icon" /></el-form-item>
        <el-form-item label="颜色"><el-input v-model="form.color" placeholder="#2EB8A0" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="AI 语气"><el-input v-model="form.aiTone" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="form.enabled" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
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

type Template = {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  aiTone: string;
  enabled: boolean;
  sort: number;
};

const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const form = reactive<Partial<Template>>({});
const templates = ref<Template[]>([]);
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

function openEdit(row: Template) {
  Object.assign(form, row);
  dialogVisible.value = true;
}

async function save() {
  if (!form.id) return;
  saving.value = true;
  try {
    await request.patch(`/admin/life-space-templates/${form.id}`, {
      name: form.name,
      icon: form.icon,
      color: form.color,
      description: form.description,
      aiTone: form.aiTone,
      sort: form.sort,
      enabled: form.enabled,
    });
    ElMessage.success('已更新');
    dialogVisible.value = false;
    load();
  } finally {
    saving.value = false;
  }
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
