<template>
  <div v-loading="loading">
    <el-row :gutter="16" class="mb-4">
      <el-col v-for="item in statCards" :key="item.label" :xs="12" :sm="8" :md="6" :lg="4">
        <div class="stat-card">
          <div class="stat-card__label">{{ item.label }}</div>
          <div class="stat-card__value">{{ item.value }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <div class="page-card">
          <h3>近7日新增用户</h3>
          <div ref="userChartRef" style="height: 280px" />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="page-card">
          <h3>近7日 AI 调用</h3>
          <div ref="aiChartRef" style="height: 280px" />
        </div>
      </el-col>
    </el-row>

    <div class="page-card mt-4">
      <h3>最近异常</h3>
      <el-table :data="summary?.recentErrors || []" size="small">
        <el-table-column prop="userId" label="用户" width="200" />
        <el-table-column prop="message" label="信息" />
        <el-table-column prop="createdAt" label="时间" width="180">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import request from '@/utils/request';

type Summary = {
  todayNewUsers: number;
  totalUsers: number;
  todayTransactions: number;
  todayAiCalls: number;
  todayVoiceBills: number;
  todaySmsCount: number;
  todayNewMembers: number;
  todayOrders: number;
  aiSuccessRate: number;
  aiFailedCount: number;
  correctionCount: number;
  recentErrors: Array<{ id: string; userId: string; message: string; createdAt: string }>;
};

const loading = ref(true);
const summary = ref<Summary | null>(null);
const trends = ref<{ days: Array<{ date: string; newUsers: number; aiCalls: number; transactions: number }> } | null>(null);
const userChartRef = ref<HTMLDivElement>();
const aiChartRef = ref<HTMLDivElement>();

const statCards = computed(() => {
  const s = summary.value;
  if (!s) return [];
  return [
    { label: '今日新增用户', value: s.todayNewUsers },
    { label: '总用户数', value: s.totalUsers },
    { label: '今日记账', value: s.todayTransactions },
    { label: '今日 AI 调用', value: s.todayAiCalls },
    { label: 'AI 成功率', value: `${s.aiSuccessRate}%` },
    { label: 'AI 失败', value: s.aiFailedCount },
    { label: '用户纠错', value: s.correctionCount },
    { label: '今日会员新增', value: s.todayNewMembers },
    { label: '今日订单', value: s.todayOrders },
  ];
});

function formatTime(v: string) {
  return dayjs(v).format('YYYY-MM-DD HH:mm');
}

function renderCharts() {
  const days = trends.value?.days || [];
  const dates = days.map((d) => d.date.slice(5));
  if (userChartRef.value) {
    const chart = echarts.init(userChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value' },
      series: [{ type: 'line', smooth: true, data: days.map((d) => d.newUsers), areaStyle: {} }],
      color: ['#5b8def'],
    });
  }
  if (aiChartRef.value) {
    const chart = echarts.init(aiChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: days.map((d) => d.aiCalls) }],
      color: ['#7ee0d2'],
    });
  }
}

onMounted(async () => {
  try {
    summary.value = await request.get<Summary>('/admin/dashboard/summary');
    trends.value = await request.get('/admin/dashboard/trends');
    renderCharts();
  } finally {
    loading.value = false;
  }
});

watch(trends, renderCharts);
</script>

<style scoped>
.mb-4 { margin-bottom: 16px; }
.mt-4 { margin-top: 16px; }
h3 { margin: 0 0 12px; font-size: 15px; }
</style>
