<template>
  <div class="page-shell">
    <PageHeader title="管理员权限" subtitle="管理后台账号、角色与启用状态">
      <template #extra>
        <el-button type="primary" @click="openCreate">新增管理员</el-button>
      </template>
    </PageHeader>

    <DataTableCard :show-empty="!loading && items.length === 0" empty-title="暂无管理员" :filter-show-actions="false">
      <template v-if="items.length">
        <el-table v-loading="loading" :data="items">
          <el-table-column prop="username" label="用户名" width="140" />
          <el-table-column prop="nickname" label="昵称" width="140" />
          <el-table-column prop="role" label="角色" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'enabled' ? 'success' : 'danger'" size="small">
                {{ row.status === 'enabled' ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lastLoginAt" label="最近登录" width="180">
            <template #default="{ row }">{{ row.lastLoginAt ? formatTime(row.lastLoginAt) : '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </DataTableCard>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑管理员' : '新增管理员'" width="480px">
      <el-form label-width="88px">
        <el-form-item v-if="!editingId" label="用户名" required>
          <el-input v-model="form.username" autocomplete="off" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role" style="width: 100%">
            <el-option label="超级管理员" value="super_admin" />
            <el-option label="管理员" value="admin" />
            <el-option label="运营" value="operator" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="editingId" label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="启用" value="enabled" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item :label="editingId ? '新密码' : '密码'">
          <el-input v-model="form.password" type="password" show-password :placeholder="editingId ? '留空则不修改' : ''" />
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
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import DataTableCard from '@/components/common/DataTableCard.vue';
import request from '@/utils/request';

type AdminRow = {
  id: string;
  username: string;
  nickname: string;
  role: string;
  status: string;
  lastLoginAt?: string;
};

const loading = ref(false);
const saving = ref(false);
const items = ref<AdminRow[]>([]);
const dialogVisible = ref(false);
const editingId = ref('');
const form = reactive({
  username: '',
  nickname: '',
  role: 'admin',
  status: 'enabled',
  password: '',
});

function formatTime(v: string) {
  return dayjs(v).format('YYYY-MM-DD HH:mm');
}

async function load() {
  loading.value = true;
  try {
    items.value = await request.get('/admin/admins');
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = '';
  form.username = '';
  form.nickname = '';
  form.role = 'admin';
  form.status = 'enabled';
  form.password = '';
  dialogVisible.value = true;
}

function openEdit(row: AdminRow) {
  editingId.value = row.id;
  form.username = row.username;
  form.nickname = row.nickname;
  form.role = row.role;
  form.status = row.status;
  form.password = '';
  dialogVisible.value = true;
}

async function save() {
  saving.value = true;
  try {
    if (editingId.value) {
      const body: Record<string, string> = {
        nickname: form.nickname,
        role: form.role,
        status: form.status,
      };
      if (form.password) body.password = form.password;
      await request.patch(`/admin/admins/${editingId.value}`, body);
    } else {
      if (!form.username || form.password.length < 6) {
        ElMessage.warning('请填写用户名和至少 6 位密码');
        return;
      }
      await request.post('/admin/admins', {
        username: form.username,
        password: form.password,
        nickname: form.nickname || form.username,
        role: form.role,
      });
    }
    ElMessage.success('已保存');
    dialogVisible.value = false;
    load();
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
