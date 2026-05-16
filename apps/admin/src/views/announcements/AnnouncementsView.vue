<template>
  <div class="page-shell">
    <PageHeader title="公告触达" subtitle="管理小程序弹窗公告、顶部通知和运营触达内容。">
      <template #extra>
        <el-button type="primary" @click="openEdit()">新增公告</el-button>
      </template>
    </PageHeader>

    <DataTableCard
      :show-empty="!loading && filteredItems.length === 0"
      empty-title="还没有公告"
      empty-description="发布第一条公告，让用户及时了解产品动态。"
      empty-emoji="📣"
      @search="applyFilter"
      @reset="resetFilter"
    >
      <template #filter>
        <el-form :inline="true" class="filter-form">
          <el-form-item label="公告类型">
            <el-select v-model="filters.type" clearable placeholder="全部" style="width: 120px">
              <el-option label="弹窗" value="popup" />
              <el-option label="横幅" value="banner" />
              <el-option label="通知" value="notice" />
            </el-select>
          </el-form-item>
          <el-form-item label="展示位置">
            <el-select v-model="filters.position" clearable placeholder="全部" style="width: 120px">
              <el-option label="全局" value="global" />
              <el-option label="首页" value="home" />
              <el-option label="AI米粒" value="ai" />
              <el-option label="发现" value="discover" />
              <el-option label="我的" value="profile" />
            </el-select>
          </el-form-item>
          <el-form-item label="发布状态">
            <el-select v-model="filters.published" clearable placeholder="全部" style="width: 120px">
              <el-option label="已发布" value="published" />
              <el-option label="草稿" value="draft" />
            </el-select>
          </el-form-item>
          <el-form-item label="关键词">
            <el-input v-model="filters.keyword" clearable placeholder="搜索标题" style="width: 180px" />
          </el-form-item>
        </el-form>
      </template>

      <template v-if="filteredItems.length">
        <el-table v-loading="loading" :data="filteredItems">
          <el-table-column prop="title" label="标题" min-width="200" />
          <el-table-column prop="type" label="类型" width="90">
            <template #default="{ row }">{{ typeLabel(row.type as string) }}</template>
          </el-table-column>
          <el-table-column prop="position" label="位置" width="100">
            <template #default="{ row }">{{ positionLabel(row.position as string) }}</template>
          </el-table-column>
          <el-table-column prop="published" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.published ? 'success' : 'info'" size="small">
                {{ row.published ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="readCount" label="已读" width="80" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="remove(row.id as string)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <template v-if="!loading && filteredItems.length === 0" #emptyAction>
        <el-button type="primary" @click="openEdit()">新增公告</el-button>
      </template>
    </DataTableCard>

    <el-dialog v-model="visible" :title="form.id ? '编辑公告' : '新增公告'" width="640px" class="moona-dialog">
      <el-form label-width="90px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="form.content" type="textarea" :rows="4" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="弹窗" value="popup" />
            <el-option label="横幅" value="banner" />
            <el-option label="通知" value="notice" />
          </el-select>
        </el-form-item>
        <el-form-item label="位置">
          <el-select v-model="form.position" style="width: 100%">
            <el-option label="全局" value="global" />
            <el-option label="首页" value="home" />
            <el-option label="AI米粒" value="ai" />
            <el-option label="发现" value="discover" />
            <el-option label="我的" value="profile" />
          </el-select>
        </el-form-item>
        <el-form-item label="受众">
          <el-select v-model="form.target" style="width: 100%">
            <el-option label="全部" value="all" />
            <el-option label="免费用户" value="free" />
            <el-option label="会员" value="member" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始"><el-date-picker v-model="form.startAt" type="datetime" style="width: 100%" /></el-form-item>
        <el-form-item label="结束"><el-date-picker v-model="form.endAt" type="datetime" style="width: 100%" /></el-form-item>
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
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import DataTableCard from '@/components/common/DataTableCard.vue';
import request from '@/utils/request';

const loading = ref(false);
const items = ref<Array<Record<string, unknown>>>([]);
const visible = ref(false);
const form = reactive<Record<string, unknown>>({ type: 'notice', position: 'global', target: 'all', published: false });

const filters = reactive({
  type: '',
  position: '',
  published: '' as '' | 'published' | 'draft',
  keyword: '',
});

const filteredItems = computed(() => {
  return items.value.filter((row) => {
    if (filters.type && row.type !== filters.type) return false;
    if (filters.position && row.position !== filters.position) return false;
    if (filters.published === 'published' && !row.published) return false;
    if (filters.published === 'draft' && row.published) return false;
    if (filters.keyword) {
      const kw = filters.keyword.trim().toLowerCase();
      const title = String(row.title || '').toLowerCase();
      if (!title.includes(kw)) return false;
    }
    return true;
  });
});

function typeLabel(v: string) {
  return ({ popup: '弹窗', banner: '横幅', notice: '通知' } as Record<string, string>)[v] || v;
}
function positionLabel(v: string) {
  return ({ global: '全局', home: '首页', ai: 'AI米粒', discover: '发现', profile: '我的' } as Record<string, string>)[v] || v;
}

async function load() {
  loading.value = true;
  try {
    const res = await request.get<{ items: Array<Record<string, unknown>> }>('/admin/announcements', {
      params: { pageSize: 200 },
    });
    items.value = res.items;
  } finally {
    loading.value = false;
  }
}

function applyFilter() {
  /* 前端筛选，computed 自动更新 */
}

function resetFilter() {
  filters.type = '';
  filters.position = '';
  filters.published = '';
  filters.keyword = '';
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
  await ElMessageBox.confirm('确认删除该公告？');
  await request.delete(`/admin/announcements/${id}`);
  ElMessage.success('已删除');
  load();
}

onMounted(load);
</script>

<style scoped>
.filter-form {
  display: contents;
}
</style>
