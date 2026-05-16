<template>
  <div class="page-shell">
    <PageHeader title="挑战管理" subtitle="挑战任务与完成率">
      <template #extra>
        <el-button type="primary" @click="openEdit()">新增挑战</el-button>
      </template>
    </PageHeader>
    <DataTableCard :show-empty="!loading && items.length === 0" empty-title="暂无挑战" :filter-show-actions="false">
      <template v-if="items.length">
        <el-table v-loading="loading" :data="items">
          <el-table-column prop="name" label="挑战" />
          <el-table-column prop="type" label="类型" width="100" />
          <el-table-column prop="targetValue" label="目标" width="80" align="right" />
          <el-table-column prop="participantCount" label="参与" width="90" align="right" />
          <el-table-column prop="completionRate" label="完成率 %" width="100" align="right" />
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </DataTableCard>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑挑战' : '新增挑战'" width="520px">
      <el-form label-width="88px">
        <el-form-item label="名称" required><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="连续记账" value="streak" />
            <el-option label="储蓄目标" value="saving" />
            <el-option label="预算达标" value="budget" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标值"><el-input-number v-model="form.targetValue" :min="1" /></el-form-item>
        <el-form-item label="天数"><el-input-number v-model="form.duration" :min="1" /></el-form-item>
        <el-form-item label="图标"><el-input v-model="form.icon" /></el-form-item>
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

type Challenge = {
  id?: string;
  name: string;
  description: string;
  type: string;
  targetValue: number;
  duration: number;
  icon: string;
};

const loading = ref(false);
const saving = ref(false);
const items = ref<Challenge[]>([]);
const dialogVisible = ref(false);
const form = reactive<Challenge>({
  name: '',
  description: '',
  type: 'streak',
  targetValue: 7,
  duration: 7,
  icon: '🏆',
});

async function load() {
  loading.value = true;
  items.value = await request.get('/admin/growth/challenges');
  loading.value = false;
}

function openEdit(row?: Challenge) {
  Object.assign(
    form,
    row || { name: '', description: '', type: 'streak', targetValue: 7, duration: 7, icon: '🏆' },
  );
  dialogVisible.value = true;
}

async function save() {
  saving.value = true;
  try {
    const body = {
      name: form.name,
      description: form.description,
      type: form.type,
      targetValue: form.targetValue,
      duration: form.duration,
      icon: form.icon,
    };
    if (form.id) await request.patch(`/admin/growth/challenges/${form.id}`, body);
    else await request.post('/admin/growth/challenges', body);
    ElMessage.success('已保存');
    dialogVisible.value = false;
    load();
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
