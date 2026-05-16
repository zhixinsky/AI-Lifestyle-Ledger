<template>
  <div class="page-shell dm-page">
    <PageHeader title="数据管理" subtitle="账单导入、导出与批次记录（运营代用户操作需先选择目标用户）" />

    <!-- 目标用户 -->
    <section class="moona-card dm-card dm-user-bar">
      <div class="dm-card__head">
        <h3>目标用户</h3>
        <span class="dm-card__hint">导入/导出将写入该用户账本</span>
      </div>
      <el-form :inline="true" class="dm-user-form">
        <el-form-item label="搜索">
          <el-input
            v-model="userKeyword"
            clearable
            placeholder="手机号 / 昵称 / openid"
            style="width: 220px"
            @keyup.enter="searchUsers"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="userSearching" @click="searchUsers">搜索</el-button>
        </el-form-item>
        <el-form-item v-if="selectedUser" label="已选">
          <el-tag type="success" size="large">
            {{ selectedUser.nickname || '未命名' }} · {{ selectedUser.phone || selectedUser.id }}
          </el-tag>
        </el-form-item>
      </el-form>
      <el-table
        v-if="userCandidates.length"
        :data="userCandidates"
        size="small"
        class="dm-user-table"
        @row-click="pickUser"
      >
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="phone" label="手机" width="130" />
        <el-table-column prop="memberLevel" label="会员" width="80" />
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button link type="primary">选择</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <template v-if="selectedUser">
      <!-- 说明卡 -->
      <section class="moona-card dm-card dm-intro">
        <div class="dm-intro__icon">📊</div>
        <div>
          <h3>账单数据管理</h3>
          <p>支持鲨鱼记账 Excel/CSV 与 Moona 通用模板。导入前请确认表头；导入后可在一批次的记录中撤回。</p>
          <div class="dm-intro__tags">
            <el-tag effect="plain" type="success">鲨鱼记账</el-tag>
            <el-tag effect="plain">通用模板</el-tag>
            <el-tag effect="plain">Excel / CSV</el-tag>
          </div>
        </div>
      </section>

      <!-- 导入卡 -->
      <section class="moona-card dm-card">
        <div class="dm-card__head">
          <h3>账单导入</h3>
          <el-button link type="primary" @click="downloadTemplate('xlsx')">下载 Excel 模板</el-button>
          <el-button link type="primary" @click="downloadTemplate('csv')">下载 CSV 模板</el-button>
        </div>
        <el-steps :active="importStep" finish-status="success" align-center class="dm-steps">
          <el-step title="上传文件" />
          <el-step title="选择空间" />
          <el-step title="预览确认" />
          <el-step title="导入结果" />
        </el-steps>

        <div v-if="importStep === 0" class="dm-upload-zone">
          <el-radio-group v-model="importFormatHint" class="dm-format-radio">
            <el-radio-button label="shark">鲨鱼记账</el-radio-button>
            <el-radio-button label="generic">通用模板</el-radio-button>
          </el-radio-group>
          <el-upload
            drag
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls,.csv"
            :on-change="onFileChange"
            :on-remove="() => (uploadFile = null)"
          >
            <el-icon class="dm-upload-icon"><UploadFilled /></el-icon>
            <div class="el-upload__text">拖拽或点击上传 Excel / CSV</div>
            <template #tip>
              <div class="el-upload__tip">鲨鱼表头：日期、收支类型、类别、账户、金额、备注</div>
            </template>
          </el-upload>
          <el-button type="primary" :loading="parsing" :disabled="!uploadFile" @click="parseFile">
            解析文件
          </el-button>
        </div>

        <div v-else-if="importStep === 1" class="dm-step-body">
          <p class="dm-meta">已识别 {{ parseResult?.format === 'shark' ? '鲨鱼记账' : '通用模板' }}，共 {{ parseResult?.totalRows }} 条</p>
          <el-form label-width="100px">
            <el-form-item label="导入到">
              <el-select v-model="selectedLifeSpaceId" placeholder="选择生活空间" style="width: 280px">
                <el-option
                  v-for="s in parseResult?.lifeSpaces || []"
                  :key="s.id"
                  :label="s.name"
                  :value="s.id"
                />
              </el-select>
            </el-form-item>
          </el-form>
          <el-button @click="importStep = 0">上一步</el-button>
          <el-button type="primary" :disabled="!selectedLifeSpaceId" @click="importStep = 2">预览</el-button>
        </div>

        <div v-else-if="importStep === 2" class="dm-step-body">
          <el-table :data="parseResult?.preview || []" size="small" max-height="320">
            <el-table-column prop="rowIndex" label="行" width="50" />
            <el-table-column prop="transactionDate" label="日期" width="110" />
            <el-table-column label="类型" width="80">
              <template #default="{ row }">{{ row.type === 'income' ? '收入' : '支出' }}</template>
            </el-table-column>
            <el-table-column prop="categoryName" label="类别" />
            <el-table-column prop="accountName" label="账户" width="90" />
            <el-table-column prop="amount" label="金额" width="90" />
            <el-table-column prop="note" label="备注" show-overflow-tooltip />
            <el-table-column label="校验" width="120">
              <template #default="{ row }">
                <el-tag v-if="!row.errors?.length" type="success" size="small">通过</el-tag>
                <el-tooltip v-else :content="row.errors.join('、')">
                  <el-tag type="danger" size="small">异常</el-tag>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
          <p class="dm-meta">仅展示前 20 条，确认后将导入全部 {{ parseResult?.totalRows }} 条</p>
          <el-button @click="importStep = 1">上一步</el-button>
          <el-button type="primary" :loading="importing" @click="confirmImport">确认导入</el-button>
        </div>

        <div v-else class="dm-step-body dm-result">
          <el-result
            :icon="importResult?.successRows ? 'success' : 'warning'"
            :title="importResult?.successRows ? '导入完成' : '导入未完成'"
          >
            <template #sub-title>
              成功 {{ importResult?.successRows ?? 0 }} 条，失败 {{ importResult?.failedRows ?? 0 }} 条
            </template>
            <template v-if="importResult?.errorSummary" #extra>
              <pre class="dm-error-pre">{{ importResult.errorSummary }}</pre>
            </template>
          </el-result>
          <el-button type="primary" @click="resetImport">继续导入</el-button>
        </div>
      </section>

      <!-- 导出卡 -->
      <section class="moona-card dm-card">
        <div class="dm-card__head"><h3>账单导出</h3></div>
        <el-form :inline="true" class="dm-export-form">
          <el-form-item label="时间">
            <el-date-picker
              v-model="exportRange"
              type="daterange"
              value-format="YYYY-MM-DD"
              start-placeholder="开始"
              end-placeholder="结束"
            />
          </el-form-item>
          <el-form-item label="空间">
            <el-select v-model="exportLifeSpaceId" clearable placeholder="全部" style="width: 140px">
              <el-option v-for="s in lifeSpaces" :key="s.id" :label="s.name" :value="s.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="exportType" clearable placeholder="全部" style="width: 100px">
              <el-option label="支出" value="expense" />
              <el-option label="收入" value="income" />
            </el-select>
          </el-form-item>
          <el-form-item label="格式">
            <el-radio-group v-model="exportFormat">
              <el-radio-button label="xlsx">Excel</el-radio-button>
              <el-radio-button label="csv">CSV</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="exporting" @click="doExport">开始导出</el-button>
          </el-form-item>
        </el-form>
      </section>

      <!-- 导入记录 -->
      <section class="moona-card dm-card">
        <div class="dm-card__head"><h3>导入记录</h3></div>
        <el-table v-loading="importBatchesLoading" :data="importBatches" size="small">
          <el-table-column prop="fileName" label="文件" min-width="140" show-overflow-tooltip />
          <el-table-column label="格式" width="80">
            <template #default="{ row }">{{ row.format === 'shark' ? '鲨鱼' : '通用' }}</template>
          </el-table-column>
          <el-table-column label="空间" width="100">
            <template #default="{ row }">{{ row.lifeSpace?.name || '-' }}</template>
          </el-table-column>
          <el-table-column label="结果" width="120">
            <template #default="{ row }">{{ row.successRows }}/{{ row.totalRows }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="batchStatusType(row.status)" size="small">{{ batchStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="时间" width="170">
            <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="90" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'completed'"
                link
                type="danger"
                @click="rollback(row.id)"
              >
                撤回
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <!-- 导出记录 -->
      <section class="moona-card dm-card">
        <div class="dm-card__head"><h3>导出记录</h3></div>
        <el-table v-loading="exportBatchesLoading" :data="exportBatches" size="small">
          <el-table-column prop="fileName" label="文件" min-width="160" show-overflow-tooltip />
          <el-table-column label="格式" width="70">
            <template #default="{ row }">{{ row.format?.toUpperCase() }}</template>
          </el-table-column>
          <el-table-column prop="rowCount" label="条数" width="70" align="right" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 'completed' ? 'success' : 'info'" size="small">
                {{ row.status === 'completed' ? '完成' : row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="时间" width="170">
            <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="90" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'completed' && row.downloadUrl"
                link
                type="primary"
                @click="downloadExport(row)"
              >
                下载
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </template>

    <el-empty v-else description="请先搜索并选择目标用户" class="dm-empty" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import dayjs from 'dayjs';
import { ElMessage, ElMessageBox } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import type { UploadFile } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import request from '@/utils/request';

type UserRow = { id: string; nickname: string; phone?: string; memberLevel: string };
type LifeSpace = { id: string; name: string };
type ParsedRow = {
  rowIndex: number;
  transactionDate?: string;
  type?: string;
  categoryName?: string;
  accountName?: string;
  amount?: number;
  note?: string;
  errors?: string[];
};
type ParseResult = {
  sessionId: string;
  format: string;
  totalRows: number;
  preview: ParsedRow[];
  lifeSpaces: LifeSpace[];
  defaultLifeSpaceId: string;
};

const route = useRoute();
const apiBase = (userId: string) => `/admin/users/${userId}/data-management`;

const userKeyword = ref('');
const userSearching = ref(false);
const userCandidates = ref<UserRow[]>([]);
const selectedUser = ref<UserRow | null>(null);

const importStep = ref(0);
const importFormatHint = ref('shark');
const uploadFile = ref<File | null>(null);
const parsing = ref(false);
const importing = ref(false);
const parseResult = ref<ParseResult | null>(null);
const selectedLifeSpaceId = ref('');
const importResult = ref<Record<string, unknown> | null>(null);

const lifeSpaces = ref<LifeSpace[]>([]);
const exportRange = ref<[string, string] | null>(null);
const exportLifeSpaceId = ref('');
const exportType = ref('');
const exportFormat = ref<'xlsx' | 'csv'>('xlsx');
const exporting = ref(false);

const importBatches = ref<Array<Record<string, unknown>>>([]);
const exportBatches = ref<Array<Record<string, unknown>>>([]);
const importBatchesLoading = ref(false);
const exportBatchesLoading = ref(false);

function fmt(v: string) {
  return dayjs(v).format('YYYY-MM-DD HH:mm');
}

function batchStatusLabel(s: string) {
  const map: Record<string, string> = {
    completed: '已完成',
    failed: '失败',
    rolled_back: '已撤回',
    pending: '处理中',
  };
  return map[s] || s;
}

function batchStatusType(s: string) {
  if (s === 'completed') return 'success';
  if (s === 'failed') return 'danger';
  if (s === 'rolled_back') return 'info';
  return 'warning';
}

async function searchUsers() {
  userSearching.value = true;
  try {
    const res = await request.get<{ items: UserRow[] }>('/admin/users', {
      params: { keyword: userKeyword.value || undefined, pageSize: 10 },
    });
    userCandidates.value = res.items;
  } finally {
    userSearching.value = false;
  }
}

function pickUser(row: UserRow) {
  selectedUser.value = row;
  userCandidates.value = [];
  loadBatches();
  loadLifeSpaces();
}

async function loadLifeSpaces() {
  if (!selectedUser.value) return;
  lifeSpaces.value = await request.get(`${apiBase(selectedUser.value.id)}/life-spaces`);
}

async function loadBatches() {
  if (!selectedUser.value) return;
  const uid = selectedUser.value.id;
  importBatchesLoading.value = true;
  exportBatchesLoading.value = true;
  try {
    const [imp, exp] = await Promise.all([
      request.get<{ items: Array<Record<string, unknown>> }>(`${apiBase(uid)}/import/batches`),
      request.get<{ items: Array<Record<string, unknown>> }>(`${apiBase(uid)}/export/batches`),
    ]);
    importBatches.value = imp.items;
    exportBatches.value = exp.items;
  } finally {
    importBatchesLoading.value = false;
    exportBatchesLoading.value = false;
  }
}

function onFileChange(file: UploadFile) {
  uploadFile.value = file.raw ?? null;
}

async function parseFile() {
  if (!selectedUser.value || !uploadFile.value) return;
  parsing.value = true;
  try {
    const fd = new FormData();
    fd.append('file', uploadFile.value);
    const res = await request.post<ParseResult>(
      `${apiBase(selectedUser.value.id)}/import/parse`,
      fd,
    );
    parseResult.value = res;
    selectedLifeSpaceId.value = res.defaultLifeSpaceId;
    importStep.value = 1;
  } finally {
    parsing.value = false;
  }
}

async function confirmImport() {
  if (!selectedUser.value || !parseResult.value) return;
  importing.value = true;
  try {
    importResult.value = await request.post(`${apiBase(selectedUser.value.id)}/import/confirm`, {
      sessionId: parseResult.value.sessionId,
      lifeSpaceId: selectedLifeSpaceId.value,
    });
    importStep.value = 3;
    ElMessage.success('导入已提交');
    loadBatches();
  } finally {
    importing.value = false;
  }
}

function resetImport() {
  importStep.value = 0;
  uploadFile.value = null;
  parseResult.value = null;
  importResult.value = null;
}

async function rollback(batchId: string) {
  if (!selectedUser.value) return;
  await ElMessageBox.confirm('撤回将删除该批次导入的全部账单，确认？', '撤回导入', { type: 'warning' });
  await request.post(`${apiBase(selectedUser.value.id)}/import/${batchId}/rollback`);
  ElMessage.success('已撤回');
  loadBatches();
}

async function doExport() {
  if (!selectedUser.value) return;
  exporting.value = true;
  try {
    const res = await request.post<{ downloadUrl: string }>(`${apiBase(selectedUser.value.id)}/export`, {
      format: exportFormat.value,
      dateFrom: exportRange.value?.[0],
      dateTo: exportRange.value?.[1],
      lifeSpaceId: exportLifeSpaceId.value || undefined,
      type: exportType.value || undefined,
    });
    ElMessage.success('导出成功');
    if (res.downloadUrl) window.open(`/api${res.downloadUrl}`, '_blank');
    loadBatches();
  } finally {
    exporting.value = false;
  }
}

function downloadExport(row: Record<string, unknown>) {
  const url = row.downloadUrl as string;
  if (url) window.open(`/api${url}`, '_blank');
}

function downloadTemplate(format: 'xlsx' | 'csv') {
  if (!selectedUser.value) return;
  window.open(`/api${apiBase(selectedUser.value.id)}/template/${format}`, '_blank');
}

watch(
  () => route.query.userId,
  async (id) => {
    if (typeof id === 'string' && id) {
      try {
        const detail = await request.get<UserRow & { id: string }>(`/admin/users/${id}`);
        selectedUser.value = {
          id: detail.id,
          nickname: detail.nickname,
          phone: detail.phone,
          memberLevel: 'free',
        };
        loadBatches();
        loadLifeSpaces();
      } catch {
        /* ignore */
      }
    }
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.dm-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.dm-card {
  padding: 20px 22px;
  &__head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      flex: 1;
    }
  }
  &__hint {
    font-size: 12px;
    color: var(--moona-text-muted);
  }
}
.dm-intro {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  &__icon {
    font-size: 36px;
    line-height: 1;
  }
  h3 {
    margin: 0 0 8px;
    font-size: 16px;
  }
  p {
    margin: 0 0 10px;
    color: var(--moona-text-secondary);
    font-size: 14px;
    line-height: 1.6;
  }
  &__tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}
.dm-steps {
  margin-bottom: 20px;
}
.dm-upload-zone {
  text-align: center;
  .dm-format-radio {
    margin-bottom: 16px;
  }
  .el-button {
    margin-top: 12px;
  }
}
.dm-upload-icon {
  font-size: 48px;
  color: var(--moona-primary);
}
.dm-step-body {
  padding: 8px 0;
}
.dm-meta {
  font-size: 13px;
  color: var(--moona-text-muted);
  margin: 0 0 12px;
}
.dm-export-form {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 0;
}
.dm-user-table {
  margin-top: 12px;
  cursor: pointer;
}
.dm-error-pre {
  text-align: left;
  max-width: 480px;
  font-size: 12px;
  white-space: pre-wrap;
  color: var(--moona-text-secondary);
}
.dm-empty {
  margin-top: 40px;
}
</style>
