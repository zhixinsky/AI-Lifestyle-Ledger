<template>
  <div class="page-card">
    <div class="toolbar">
      <el-button type="primary" @click="openEdit()">新增文章</el-button>
    </div>
    <el-table v-loading="loading" :data="items" stripe>
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="category" label="分类" width="100" />
      <el-table-column prop="published" label="发布" width="80">
        <template #default="{ row }">
          <el-tag :type="row.published ? 'success' : 'info'">{{ row.published ? '已发布' : '草稿' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="viewCount" label="阅读" width="80" />
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑文章' : '新增文章'" width="720px">
      <el-form label-width="80px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="摘要"><el-input v-model="form.summary" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category">
            <el-option label="技巧" value="tip" />
            <el-option label="知识" value="knowledge" />
            <el-option label="挑战" value="challenge" />
          </el-select>
        </el-form-item>
        <el-form-item label="封面">
          <el-input v-model="form.coverUrl" placeholder="图片 URL 或上传后粘贴" />
          <el-upload :show-file-list="false" :http-request="uploadCover" accept="image/*">
            <el-button size="small" class="mt-2">上传封面</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="12" placeholder="支持 Markdown" />
        </el-form-item>
        <el-form-item label="发布"><el-switch v-model="form.published" /></el-form-item>
        <el-form-item label="置顶"><el-switch v-model="form.isPinned" /></el-form-item>
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
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';

type Article = {
  id: string;
  title: string;
  summary: string;
  content: string;
  coverUrl?: string;
  category: string;
  published: boolean;
  isPinned: boolean;
  sort: number;
};

const loading = ref(false);
const saving = ref(false);
const items = ref<Article[]>([]);
const dialogVisible = ref(false);
const form = reactive<Partial<Article>>({ category: 'tip', published: true, isPinned: false, sort: 0 });

async function load() {
  loading.value = true;
  try {
    const res = await request.get<{ items: Article[] }>('/admin/articles', { params: { pageSize: 100 } });
    items.value = res.items;
  } finally {
    loading.value = false;
  }
}

function openEdit(row?: Article) {
  Object.assign(form, row || { title: '', summary: '', content: '', category: 'tip', published: true, isPinned: false });
  dialogVisible.value = true;
}

async function save() {
  saving.value = true;
  try {
    if (form.id) await request.patch(`/admin/articles/${form.id}`, form);
    else await request.post('/admin/articles', form);
    ElMessage.success('已保存');
    dialogVisible.value = false;
    load();
  } finally {
    saving.value = false;
  }
}

async function remove(id: string) {
  await ElMessageBox.confirm('确认删除？');
  await request.delete(`/admin/articles/${id}`);
  ElMessage.success('已删除');
  load();
}

async function uploadCover(options: { file: File }) {
  const fd = new FormData();
  fd.append('file', options.file);
  const res = await request.post<{ url: string }>('/upload/image', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  form.coverUrl = res.url;
  ElMessage.success('上传成功');
}

onMounted(load);
</script>

<style scoped>
.toolbar { margin-bottom: 16px; }
.mt-2 { margin-top: 8px; }
</style>
