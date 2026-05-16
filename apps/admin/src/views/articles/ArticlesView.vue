<template>
  <div class="page-shell">
    <PageHeader title="内容运营" subtitle="管理发现页文章与内容发布">
      <template #extra>
        <el-button type="primary" @click="openEdit()">新增文章</el-button>
      </template>
    </PageHeader>

    <DataTableCard
      :show-empty="!loading && items.length === 0"
      empty-title="还没有文章"
      empty-description="发布第一篇文章，丰富发现页内容。"
      empty-emoji="📝"
      @search="load"
      @reset="resetFilter"
    >
      <template #filter>
        <el-form :inline="true">
          <el-form-item label="分类">
            <el-select v-model="categoryFilter" clearable placeholder="全部" style="width: 120px">
              <el-option label="技巧" value="tip" />
              <el-option label="知识" value="knowledge" />
              <el-option label="挑战" value="challenge" />
            </el-select>
          </el-form-item>
        </el-form>
      </template>
      <template v-if="items.length">
        <el-table v-loading="loading" :data="items">
          <el-table-column prop="title" label="标题" min-width="200" />
          <el-table-column prop="category" label="分类" width="100" />
          <el-table-column prop="published" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.published ? 'success' : 'info'" size="small">
                {{ row.published ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="viewCount" label="阅读" width="80" align="right" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openPreview(row)">预览</el-button>
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="remove(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <template v-if="!loading && items.length === 0" #emptyAction>
        <el-button type="primary" @click="openEdit()">新增文章</el-button>
      </template>
    </DataTableCard>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑文章' : '新增文章'" width="720px">
      <el-form label-width="80px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="摘要"><el-input v-model="form.summary" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" style="width: 100%">
            <el-option label="技巧" value="tip" />
            <el-option label="知识" value="knowledge" />
            <el-option label="挑战" value="challenge" />
          </el-select>
        </el-form-item>
        <el-form-item label="封面">
          <el-input v-model="form.coverUrl" placeholder="图片 URL" />
          <el-upload :show-file-list="false" :http-request="uploadCover" accept="image/*" class="mt-8">
            <el-button size="small">上传封面</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="12" placeholder="支持 Markdown" />
          <el-button class="mt-8" size="small" @click="openPreview(form as Article)">预览 Markdown</el-button>
        </el-form-item>
        <el-form-item label="发布"><el-switch v-model="form.published" /></el-form-item>
        <el-form-item label="置顶"><el-switch v-model="form.isPinned" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="previewVisible" title="文章预览" width="720px">
      <div class="article-preview" v-html="previewHtml" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { marked } from 'marked';
import { ElMessage, ElMessageBox } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import DataTableCard from '@/components/common/DataTableCard.vue';
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
};

const loading = ref(false);
const saving = ref(false);
const items = ref<Article[]>([]);
const dialogVisible = ref(false);
const previewVisible = ref(false);
const previewContent = ref('');
const categoryFilter = ref('');
const form = reactive<Partial<Article>>({ category: 'tip', published: true, isPinned: false });

const previewHtml = computed(() => marked.parse(previewContent.value || '') as string);

function resetFilter() {
  categoryFilter.value = '';
  load();
}

function openPreview(row: Article) {
  previewContent.value = row.content || '';
  previewVisible.value = true;
}

async function load() {
  loading.value = true;
  try {
    const params: Record<string, string | number> = { pageSize: 100 };
    if (categoryFilter.value) params.category = categoryFilter.value;
    const res = await request.get<{ items: Article[] }>('/admin/articles', { params });
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
.mt-8 {
  margin-top: 8px;
}
.article-preview {
  max-height: 60vh;
  overflow-y: auto;
  line-height: 1.7;
  padding: 8px 4px;
}
.article-preview :deep(h1),
.article-preview :deep(h2),
.article-preview :deep(h3) {
  margin: 12px 0 8px;
}
</style>
