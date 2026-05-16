<template>
  <div class="page-shell">
    <PageHeader title="徽章管理" subtitle="成长体系徽章配置">
      <template #extra>
        <el-button type="primary" @click="openEdit()">新增徽章</el-button>
      </template>
    </PageHeader>
    <DataTableCard :show-empty="!loading && items.length === 0" empty-title="暂无徽章" :filter-show-actions="false">
      <template v-if="items.length">
        <el-table v-loading="loading" :data="items">
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="key" label="Key" width="140" />
          <el-table-column prop="icon" label="图标" width="80" />
          <el-table-column prop="earnedCount" label="获得人数" width="100" align="right" />
          <el-table-column prop="description" label="描述" show-overflow-tooltip />
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </DataTableCard>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑徽章' : '新增徽章'" width="520px">
      <el-form label-width="88px">
        <el-form-item label="Key" required><el-input v-model="form.key" :disabled="!!form.id" /></el-form-item>
        <el-form-item label="名称" required><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="图标"><el-input v-model="form.icon" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="条件 JSON">
          <el-input v-model="conditionJson" type="textarea" :rows="4" placeholder='{"type":"streak","days":7}' />
        </el-form-item>
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

type Badge = {
  id?: string;
  key: string;
  name: string;
  icon: string;
  description: string;
  condition?: object;
};

const loading = ref(false);
const saving = ref(false);
const items = ref<Badge[]>([]);
const dialogVisible = ref(false);
const form = reactive<Badge>({ key: '', name: '', icon: '🏅', description: '' });
const conditionJson = ref('{}');

async function load() {
  loading.value = true;
  items.value = await request.get('/admin/growth/badges');
  loading.value = false;
}

function openEdit(row?: Badge) {
  Object.assign(form, row || { key: '', name: '', icon: '🏅', description: '' });
  conditionJson.value = JSON.stringify(row?.condition || {}, null, 2);
  dialogVisible.value = true;
}

async function save() {
  let condition: object;
  try {
    condition = JSON.parse(conditionJson.value || '{}');
  } catch {
    ElMessage.warning('条件 JSON 格式不正确');
    return;
  }
  saving.value = true;
  try {
    const body = { key: form.key, name: form.name, icon: form.icon, description: form.description, condition };
    if (form.id) await request.patch(`/admin/growth/badges/${form.id}`, body);
    else await request.post('/admin/growth/badges', body);
    ElMessage.success('已保存');
    dialogVisible.value = false;
    load();
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
