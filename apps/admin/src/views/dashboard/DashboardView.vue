<template>
  <div v-loading="loading" class="page-shell">
    <PageHeader title="运营驾驶舱" subtitle="实时掌握用户、AI 与业务核心指标" />

    <el-row :gutter="16" class="stat-row">
      <el-col v-for="item in statCards" :key="item.label" :xs="12" :sm="8" :md="6" :lg="6">
        <StatCard :label="item.label" :value="item.value" :accent="item.accent" :icon="item.icon" />
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :lg="12">
        <div class="moona-card chart-card">
          <h3 class="chart-card__title">近 7 日新增用户</h3>
          <div ref="userChartRef" class="chart-card__canvas" />
        </div>
      </el-col>
      <el-col :xs="24" :lg="12">
        <div class="moona-card chart-card">
          <h3 class="chart-card__title">近 7 日 AI 调用</h3>
          <div ref="aiChartRef" class="chart-card__canvas" />
        </div>
      </el-col>
      <el-col :xs="24" :lg="12">
        <div class="moona-card chart-card">
          <h3 class="chart-card__title">近 7 日记账笔数</h3>
          <div ref="txChartRef" class="chart-card__canvas" />
        </div>
      </el-col>
      <el-col :xs="24" :lg="12">
        <div class="moona-card chart-card">
          <h3 class="chart-card__title">近 7 日会员转化</h3>
          <div ref="memberChartRef" class="chart-card__canvas" />
        </div>
      </el-col>
    </el-row>

    <DataTableCard
      class="mt-20"
      :show-empty="!(summary?.recentErrors?.length)"
      empty-title="暂无异常"
      empty-description="最近没有 AI 调用失败记录"
      empty-emoji="✨"
      :filter-show-actions="false"
    >
      <template v-if="summary?.recentErrors?.length">
        <el-table :data="summary.recentErrors" size="default">
          <el-table-column prop="userId" label="用户" width="200" show-overflow-tooltip />
          <el-table-column prop="message" label="信息" min-width="240" show-overflow-tooltip />
          <el-table-column prop="createdAt" label="时间" width="180">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
        </el-table>
      </template>
    </DataTableCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import { User, TrendCharts, Coin, Cpu, CircleCheck, Warning, EditPen, Medal, ShoppingCart } from '@element-plus/icons-vue';
import type { Component } from 'vue';
import request from '@/utils/request';
import PageHeader from '@/components/common/PageHeader.vue';
import StatCard from '@/components/common/StatCard.vue';
import DataTableCard from '@/components/common/DataTableCard.vue';

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
const trends = ref<{
  days: Array<{ date: string; newUsers: number; aiCalls: number; transactions: number; newMembers: number }>;
} | null>(null);
const userChartRef = ref<HTMLDivElement>();
const aiChartRef = ref<HTMLDivElement>();
const txChartRef = ref<HTMLDivElement>();
const memberChartRef = ref<HTMLDivElement>();

const statCards = computed(() => {
  const s = summary.value;
  if (!s) return [];
  const cards: Array<{ label: string; value: string | number; icon?: Component; accent?: boolean }> = [
    { label: '今日新增用户', value: s.todayNewUsers, icon: User, accent: true },
    { label: '总用户数', value: s.totalUsers, icon: TrendCharts },
    { label: '今日记账', value: s.todayTransactions, icon: Coin },
    { label: '今日 AI 调用', value: s.todayAiCalls, icon: Cpu },
    { label: 'AI 成功率', value: `${s.aiSuccessRate}%`, icon: CircleCheck },
    { label: 'AI 失败', value: s.aiFailedCount, icon: Warning },
    { label: '用户纠错', value: s.correctionCount, icon: EditPen },
    { label: '今日会员新增', value: s.todayNewMembers, icon: Medal },
    { label: '今日订单', value: s.todayOrders, icon: ShoppingCart },
  ];
  return cards;
});

function formatTime(v: string) {
  return dayjs(v).format('YYYY-MM-DD HH:mm');
}

function renderCharts() {
  const days = trends.value?.days || [];
  const dates = days.map((d) => d.date.slice(5));
  const primary = '#2EB8A0';
  if (userChartRef.value) {
    const chart = echarts.init(userChartRef.value);
    chart.setOption({
      grid: { left: 40, right: 16, top: 24, bottom: 28 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#EEF0F4' } } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#F2F4F7' } } },
      series: [{
        type: 'line',
        smooth: true,
        data: days.map((d) => d.newUsers),
        areaStyle: { color: 'rgba(46,184,160,0.12)' },
        lineStyle: { color: primary, width: 2 },
        itemStyle: { color: primary },
      }],
    });
  }
  if (aiChartRef.value) {
    const chart = echarts.init(aiChartRef.value);
    chart.setOption({
      grid: { left: 40, right: 16, top: 24, bottom: 28 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#EEF0F4' } } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#F2F4F7' } } },
      series: [{
        type: 'bar',
        data: days.map((d) => d.aiCalls),
        itemStyle: { color: primary, borderRadius: [6, 6, 0, 0] },
      }],
    });
  }
  if (txChartRef.value) {
    const chart = echarts.init(txChartRef.value);
    chart.setOption({
      grid: { left: 40, right: 16, top: 24, bottom: 28 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#EEF0F4' } } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#F2F4F7' } } },
      series: [{
        type: 'line',
        smooth: true,
        data: days.map((d) => d.transactions),
        lineStyle: { color: '#5B8FF9', width: 2 },
        itemStyle: { color: '#5B8FF9' },
      }],
    });
  }
  if (memberChartRef.value) {
    const chart = echarts.init(memberChartRef.value);
    chart.setOption({
      grid: { left: 40, right: 16, top: 24, bottom: 28 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#EEF0F4' } } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#F2F4F7' } } },
      series: [{
        type: 'bar',
        data: days.map((d) => d.newMembers),
        itemStyle: { color: '#F6BD16', borderRadius: [6, 6, 0, 0] },
      }],
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

<style scoped lang="scss">
.stat-row {
  margin-bottom: 20px;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  padding: 20px;
  margin-bottom: 16px;
}

.chart-card__title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--moona-text);
}

.chart-card__canvas {
  height: 280px;
}

.mt-20 {
  margin-top: 20px;
}
</style>
