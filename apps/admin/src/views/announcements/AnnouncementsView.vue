<template>
  <div class="page-card">
    <el-button type="primary" class="mb-4" @click="openEdit()">新增公告</el-button>
    <el-table v-loading="loading" :data="items" stripe>
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="type" label="类型" width="90" />
      <el-table-column prop="position" label="位置" width="100" />
      <el-table-column prop="published" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.published ? 'success' : 'info'">{{ row.published ? '已发布' : '草稿' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="readCount" label="已读" width="80" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" :title="form.id ? '编辑公告' : '新增公告'" width="640px">
      <el-form label-width="90px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="form.content" type="textarea" :rows="4" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type">
            <el-option label="弹窗" value="popup" />
            <el-option label="横幅" value="banner" />
            <el-option label="通知" value="notice" />
          </el-select>
        </el-form-item>
        <el-form-item label="位置">
          <el-select v-model="form.position">
            <el-option label="全局" value="global" />
            <el-option label="首页" value="home" />
            <el-option label="AI米粒" value="ai" />
            <el-option label="发现" value="discover" />
            <el-option label="我的" value="profile" />
          </el-select>
        </el-form-item>
        <el-form-item label="受众">
          <el-select v-model="form.target">
            <el-option label="全部" value="all" />
            <el-option label="免费用户" value="free" />
            <el-option label="会员" value="member" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始"><el-date-picker v-model="form.startAt" type="datetime" /></el-form-item>
        <el-form-item label="结束"><el-date-picker v-model="form.endAt" type="datetime" /></el-form-item>
        <el-form-item label="发布"><el-switch v-model="form.published" /></el-form-item>
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
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';

const loading = ref(false);
const items = ref<Array<Record<string, unknown>>>([]);
const visible = ref(false);
const form = reactive<Record<string, unknown>>({ type: 'notice', position: 'global', target: 'all', published: false });

async function load() {
  loading.value = true;
  try {
    const res = await request.get<{ items: Array<Record<string, unknown>> }>('/admin/announcements');
    items.value = res.items;
  } finally {
    loading.value = false;
  }
}

function openEdit(row?: Record<string, unknown>) {
  Object.assign(form, row || { title: '', content: '', type: 'notice', position: 'global', target: 'all', published: false });
  visible.value = true;
}

async function save() {
  const payload = {
    ...form,
    startAt: form.startAt ? new Date(form.startAt as string).toISOString() : undefined,
    endAt: form.endAt ? new Date(form.endAt as string).toISOString() : undefined,
  };
  if (form.id) await request.patch(`/admin/announcements/${form.id}`, payload);
  else await request.post('/admin/announcements', payload);
  ElMessage.success('已保存');
  visible.value = false;
  load();
}

async function remove(id: string) {
  await ElMessageBox.confirm('确认删除？');
  await request.delete(`/admin/announcements/${id}`);
  load();
}

onMounted(load);
</script>

<style scoped>.mb-4 { margin-bottom: 16px; }</style>
