<template>
  <view class="page">
    <view class="navbar">
      <view class="nav-back" @tap="goBack"><text class="back-txt">‹</text></view>
      <text class="nav-title">数据管理</text>
      <view class="nav-ph" />
    </view>

    <scroll-view scroll-y class="scroll">
      <view class="card intro">
        <text class="intro-title">📊 账单导入与导出</text>
        <text class="intro-desc">支持鲨鱼记账、通用模板（Excel/CSV）。导入后可在记录中撤回本批次。</text>
      </view>

      <view class="card">
        <text class="card-title">账单导入</text>
        <view v-if="importStep === 0">
          <view class="btn-primary" @tap="chooseFile">{{ uploading ? '解析中...' : '选择文件并解析' }}</view>
        </view>
        <view v-else-if="importStep === 1">
          <text class="hint">共 {{ parseResult?.totalRows }} 条 · {{ parseResult?.format === 'shark' ? '鲨鱼记账' : '通用模板' }}</text>
          <picker :range="spaceNames" @change="onSpacePick">
            <view class="picker-row">生活空间：{{ selectedSpaceName || '请选择' }}</view>
          </picker>
          <view class="row-btns">
            <view class="btn-ghost" @tap="importStep = 0">上一步</view>
            <view class="btn-primary" @tap="importStep = 2">预览</view>
          </view>
        </view>
        <view v-else-if="importStep === 2">
          <view v-for="row in parseResult?.preview || []" :key="row.rowIndex" class="preview-row">
            <text class="pr-line">{{ row.transactionDate }} · {{ row.type === 'income' ? '收' : '支' }} · ¥{{ row.amount }}</text>
            <text class="pr-sub">{{ row.categoryName }} {{ row.note ? '· ' + row.note : '' }}</text>
          </view>
          <text class="hint">仅展示前 20 条</text>
          <view class="row-btns">
            <view class="btn-ghost" @tap="importStep = 1">上一步</view>
            <view class="btn-primary" @tap="confirmImport">{{ importing ? '导入中' : '确认导入' }}</view>
          </view>
        </view>
        <view v-else class="result-box">
          <text>成功 {{ importResult?.successRows ?? 0 }} 条，失败 {{ importResult?.failedRows ?? 0 }} 条</text>
          <view class="btn-primary" @tap="resetImport">继续导入</view>
        </view>
      </view>

      <view class="card">
        <text class="card-title">账单导出</text>
        <picker :range="['Excel', 'CSV']" @change="onFormatPick">
          <view class="picker-row">格式：{{ exportFormat === 'xlsx' ? 'Excel' : 'CSV' }}</view>
        </picker>
        <view class="btn-primary" @tap="doExport">{{ exporting ? '导出中' : '开始导出' }}</view>
      </view>

      <view class="card">
        <text class="card-title">导入记录</text>
        <view v-for="b in importBatches" :key="b.id" class="batch-row">
          <text>{{ b.fileName }} · {{ b.successRows }}/{{ b.totalRows }}</text>
          <text v-if="b.status === 'completed'" class="link" @tap="rollback(b.id)">撤回</text>
        </view>
        <text v-if="!importBatches.length" class="empty">暂无</text>
      </view>

      <view class="card">
        <text class="card-title">导出记录</text>
        <view v-for="b in exportBatches" :key="b.id" class="batch-row">
          <text>{{ b.fileName || '导出文件' }} · {{ b.rowCount }} 条</text>
        </view>
        <text v-if="!exportBatches.length" class="empty">暂无</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { dataManagementApi, type ParseResult } from '@/api/data-management';
import { ensureLoggedIn } from '@/utils/ensure-logged-in';

const importStep = ref(0);
const uploading = ref(false);
const importing = ref(false);
const exporting = ref(false);
const parseResult = ref<ParseResult | null>(null);
const importResult = ref<Record<string, number> | null>(null);
const selectedSpaceIndex = ref(0);
const exportFormat = ref<'xlsx' | 'csv'>('xlsx');
const importBatches = ref<Array<Record<string, any>>>([]);
const exportBatches = ref<Array<Record<string, any>>>([]);

const spaceNames = computed(() => (parseResult.value?.lifeSpaces || []).map((s) => s.name));
const selectedSpaceName = computed(() => spaceNames.value[selectedSpaceIndex.value] || '');

function goBack() {
  uni.navigateBack();
}

function onSpacePick(e: { detail: { value: string } }) {
  selectedSpaceIndex.value = Number(e.detail.value);
}

function onFormatPick(e: { detail: { value: string } }) {
  exportFormat.value = Number(e.detail.value) === 1 ? 'csv' : 'xlsx';
}

async function loadBatches() {
  const [imp, exp] = await Promise.all([
    dataManagementApi.importBatches(),
    dataManagementApi.exportBatches(),
  ]);
  importBatches.value = imp.items;
  exportBatches.value = exp.items;
}

function chooseFile() {
  if (!ensureLoggedIn()) return;
  // #ifdef MP-WEIXIN
  uni.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['.xlsx', '.xls', '.csv'],
    success: async (res) => {
      const f = res.tempFiles[0];
      uploading.value = true;
      try {
        parseResult.value = await dataManagementApi.parseImport(f.path, f.name);
        const idx = (parseResult.value.lifeSpaces || []).findIndex(
          (s) => s.id === parseResult.value?.defaultLifeSpaceId,
        );
        selectedSpaceIndex.value = idx >= 0 ? idx : 0;
        importStep.value = 1;
      } catch (e: any) {
        uni.showToast({ title: e?.message || '解析失败', icon: 'none' });
      } finally {
        uploading.value = false;
      }
    },
  });
  // #endif
  // #ifndef MP-WEIXIN
  uni.showToast({ title: '请在微信小程序中使用', icon: 'none' });
  // #endif
}

async function confirmImport() {
  if (!parseResult.value) return;
  const space = parseResult.value.lifeSpaces[selectedSpaceIndex.value];
  if (!space) return;
  importing.value = true;
  try {
    importResult.value = (await dataManagementApi.confirmImport(
      parseResult.value.sessionId,
      space.id,
    )) as Record<string, number>;
    importStep.value = 3;
    uni.showToast({ title: '导入完成', icon: 'success' });
    loadBatches();
  } catch (e: any) {
    uni.showToast({ title: e?.message || '导入失败', icon: 'none' });
  } finally {
    importing.value = false;
  }
}

function resetImport() {
  importStep.value = 0;
  parseResult.value = null;
  importResult.value = null;
}

async function rollback(id: string) {
  await dataManagementApi.rollback(id);
  uni.showToast({ title: '已撤回', icon: 'success' });
  loadBatches();
}

async function doExport() {
  if (!ensureLoggedIn()) return;
  exporting.value = true;
  try {
    await dataManagementApi.export({ format: exportFormat.value });
    uni.showToast({ title: '已生成导出', icon: 'success' });
    loadBatches();
  } catch (e: any) {
    uni.showToast({ title: e?.message || '导出失败', icon: 'none' });
  } finally {
    exporting.value = false;
  }
}

onMounted(() => {
  if (!ensureLoggedIn()) return;
  loadBatches();
});
</script>

<style scoped lang="scss">
.page { min-height: 100vh; background: #f6f8fb; }
.navbar {
  display: flex; align-items: center; padding: 48rpx 32rpx 24rpx;
  .nav-title { flex: 1; text-align: center; font-size: 34rpx; font-weight: 600; }
  .back-txt { font-size: 48rpx; color: #2eb8a0; padding: 0 16rpx; }
  .nav-ph { width: 64rpx; }
}
.scroll { height: calc(100vh - 120rpx); padding: 0 24rpx 48rpx; box-sizing: border-box; }
.card {
  background: #fff; border-radius: 24rpx; padding: 28rpx; margin-bottom: 20rpx;
  box-shadow: 0 8rpx 30rpx rgba(16, 24, 40, 0.04);
}
.card-title { font-size: 30rpx; font-weight: 600; margin-bottom: 20rpx; display: block; }
.intro-title { font-size: 30rpx; font-weight: 600; display: block; margin-bottom: 12rpx; }
.intro-desc { font-size: 26rpx; color: #475467; line-height: 1.6; }
.btn-primary {
  background: #2eb8a0; color: #fff; text-align: center; padding: 22rpx;
  border-radius: 16rpx; font-size: 28rpx;
}
.btn-ghost {
  background: #e9fbf6; color: #129b7f; text-align: center; padding: 22rpx;
  border-radius: 16rpx; font-size: 28rpx; flex: 1;
}
.row-btns { display: flex; gap: 16rpx; margin-top: 20rpx; }
.picker-row {
  padding: 20rpx; background: #f6f8fb; border-radius: 12rpx; margin-bottom: 16rpx; font-size: 26rpx;
}
.hint { font-size: 24rpx; color: #98a2b3; margin-bottom: 12rpx; display: block; }
.preview-row {
  padding: 16rpx 0; border-bottom: 1rpx solid #eef0f4;
  .pr-line { font-size: 26rpx; display: block; }
  .pr-sub { font-size: 22rpx; color: #98a2b3; margin-top: 4rpx; display: block; }
}
.batch-row {
  display: flex; justify-content: space-between; padding: 16rpx 0;
  font-size: 24rpx; border-bottom: 1rpx solid #eef0f4;
  .link { color: #e85d5d; }
}
.empty { font-size: 24rpx; color: #98a2b3; }
.result-box { text-align: center; font-size: 28rpx; .btn-primary { margin-top: 20rpx; } }
</style>
