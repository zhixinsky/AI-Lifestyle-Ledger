<template>
  <div v-loading="loading" class="page-shell insight-page">
    <PageHeader :title="pageTitle" subtitle="单用户 AI 行为画像">
      <template #extra>
        <el-button @click="$router.push('/users')">返回列表</el-button>
      </template>
    </PageHeader>

    <template v-if="data">
      <!-- Hero -->
      <section class="moona-card insight-hero">
        <div class="insight-hero__main">
          <BrandLogo size="lg" class="insight-hero__avatar" />
          <div class="insight-hero__info">
            <h2 class="insight-hero__name">{{ profile?.nickname || '未命名' }}</h2>
            <p class="insight-hero__meta">
              {{ profile?.phone || '—' }} · {{ profile?.email || '无邮箱' }}
            </p>
            <div class="insight-hero__tags">
              <el-tag v-for="tag in data.tags" :key="tag" type="success" effect="plain" size="small">{{ tag }}</el-tag>
            </div>
            <p class="insight-hero__summary">{{ data.summary }}</p>
          </div>
        </div>
        <el-descriptions :column="2" border size="small" class="insight-hero__desc">
          <el-descriptions-item label="OpenID">{{ profile?.openid || '—' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="profile?.status === 'enabled' ? 'success' : 'danger'" size="small">
              {{ profile?.status === 'enabled' ? '正常' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="会员">{{ profile?.memberLevel }}</el-descriptions-item>
          <el-descriptions-item label="到期">{{ fmt(profile?.memberExpireAt) }}</el-descriptions-item>
          <el-descriptions-item label="注册">{{ fmt(profile?.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="最近登录">{{ fmt(profile?.lastLoginAt) }}</el-descriptions-item>
        </el-descriptions>
      </section>

      <!-- AI Stats -->
      <h3 class="section-title">AI 使用分析</h3>
      <el-row :gutter="12" class="stat-row">
        <el-col v-for="c in aiStatCards" :key="c.label" :xs="12" :sm="8" :md="6" :lg="4">
          <StatCard :label="c.label" :value="c.value" />
        </el-col>
      </el-row>
      <el-row :gutter="16" class="chart-row">
        <el-col :xs="24" :lg="12">
          <div class="moona-card chart-card">
            <h4>近 30 天 AI 调用趋势</h4>
            <div ref="aiTrendRef" class="chart-canvas" />
          </div>
        </el-col>
        <el-col :xs="24" :md="12" :lg="6">
          <div class="moona-card chart-card">
            <h4>输入方式</h4>
            <div ref="inputPieRef" class="chart-canvas chart-canvas--sm" />
          </div>
        </el-col>
        <el-col :xs="24" :md="12" :lg="6">
          <div class="moona-card chart-card">
            <h4>Intent 分布</h4>
            <div ref="intentPieRef" class="chart-canvas chart-canvas--sm" />
          </div>
        </el-col>
      </el-row>

      <!-- Bill -->
      <h3 class="section-title">账单行为分析</h3>
      <el-row :gutter="12" class="stat-row">
        <el-col v-for="c in billStatCards" :key="c.label" :xs="12" :sm="8" :md="6">
          <StatCard :label="c.label" :value="c.value" />
        </el-col>
      </el-row>
      <el-row :gutter="16" class="chart-row">
        <el-col :xs="24" :lg="12">
          <div class="moona-card chart-card">
            <h4>近 30 天记账趋势</h4>
            <div ref="billTrendRef" class="chart-canvas" />
          </div>
        </el-col>
        <el-col :xs="24" :md="12" :lg="6">
          <div class="moona-card chart-card">
            <h4>收支占比</h4>
            <div ref="iePieRef" class="chart-canvas chart-canvas--sm" />
          </div>
        </el-col>
        <el-col :xs="24" :md="12" :lg="6">
          <div class="moona-card chart-card">
            <h4>分类 Top5</h4>
            <div ref="catBarRef" class="chart-canvas chart-canvas--sm" />
          </div>
        </el-col>
      </el-row>

      <!-- Life spaces -->
      <h3 class="section-title">生活空间分析</h3>
      <el-row :gutter="16">
        <el-col :xs="24" :lg="14">
          <el-row :gutter="12">
            <el-col v-for="sp in data.lifeSpaces" :key="sp.id" :xs="24" :sm="12">
              <div class="moona-card space-card">
                <div class="space-card__head">
                  <span class="space-card__icon">{{ sp.icon }}</span>
                  <span class="space-card__name">{{ sp.name }}</span>
                  <el-tag v-if="sp.isVirtual" size="small" type="info">默认</el-tag>
                </div>
                <p class="space-card__stat">账单 {{ sp.transactionCount }} 笔 · 支出 ¥{{ sp.expenseTotal.toFixed(0) }}</p>
                <p class="space-card__stat">AI 互动 {{ sp.aiInteractionCount }} 次</p>
                <div v-if="sp.topCategories?.length" class="space-card__cats">
                  <el-tag v-for="c in sp.topCategories" :key="c.name" size="small">{{ c.name }} {{ c.count }}</el-tag>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-col>
        <el-col :xs="24" :lg="10">
          <div class="moona-card chart-card">
            <h4>空间消费占比</h4>
            <div ref="spacePieRef" class="chart-canvas" />
          </div>
        </el-col>
      </el-row>

      <!-- Timeline -->
      <h3 class="section-title">AI 互动时间轴</h3>
      <div class="moona-card timeline-wrap">
        <el-timeline v-if="timeline.length">
          <el-timeline-item
            v-for="item in timeline"
            :key="item.id"
            :timestamp="fmt(item.createdAt)"
            placement="top"
          >
            <div class="tl-item">
              <span class="tl-item__badge">{{ item.inputType === 'voice' ? '🎤 语音' : '💬 文字' }}</span>
              <span class="tl-item__intent">{{ item.intent || '—' }}</span>
              <el-tag :type="item.status === 'success' ? 'success' : 'danger'" size="small">{{ item.status }}</el-tag>
            </div>
            <p class="tl-item__input">「{{ item.rawInput }}」</p>
            <p class="tl-item__reply">{{ item.replySummary }}</p>
            <p v-if="item.billCreated" class="tl-item__bill">
              入账 {{ item.billCategory }} ¥{{ item.billAmount }}
            </p>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无 AI 记录" />
        <div v-if="timelineTotal > timeline.length" class="timeline-more">
          <el-button :loading="timelineLoading" @click="loadMoreTimeline">加载更多</el-button>
        </div>
      </div>

      <!-- Corrections -->
      <h3 class="section-title">AI 纠错记录（{{ data.correctionSummary.total }}）</h3>
      <el-row v-if="corrections.length" :gutter="16">
        <el-col v-for="c in corrections" :key="c.id" :xs="24" :lg="12">
          <div class="moona-card compare-card">
            <p class="compare-card__time">{{ fmt(c.createdAt) }} · {{ c.correctionType }}</p>
            <div class="compare-card__grid">
              <div class="compare-card__side compare-card__side--ai">
                <h5>AI 识别</h5>
                <p>{{ c.originalText }}</p>
                <pre>{{ JSON.stringify(c.aiResultJson, null, 2) }}</pre>
              </div>
              <div class="compare-card__side compare-card__side--user">
                <h5>用户修正</h5>
                <pre>{{ JSON.stringify(c.correctedResultJson, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
      <el-empty v-else description="暂无纠错" />

      <!-- Behavior graph -->
      <h3 class="section-title">AI 行为关系图谱</h3>
      <div class="moona-card chart-card">
        <div ref="graphRef" class="chart-canvas chart-canvas--graph" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import PageHeader from '@/components/common/PageHeader.vue';
import StatCard from '@/components/common/StatCard.vue';
import BrandLogo from '@/components/BrandLogo.vue';
import request from '@/utils/request';

type InsightData = {
  profile: Record<string, unknown>;
  tags: string[];
  summary: string;
  aiStats: Record<string, number>;
  aiTrend: Array<{ date: string; count: number }>;
  intentDistribution: Array<{ intent: string; count: number }>;
  inputTypeDistribution: Array<{ type: string; count: number }>;
  billStats: Record<string, number>;
  billTrend: Array<{ date: string; count: number }>;
  categoryTop: Array<{ name: string; amount: number; count: number }>;
  incomeExpenseRatio: Array<{ type: string; amount: number }>;
  lifeSpaces: Array<{
    id: string;
    name: string;
    icon: string;
    isVirtual?: boolean;
    transactionCount: number;
    expenseTotal: number;
    aiInteractionCount: number;
    topCategories?: Array<{ name: string; count: number }>;
  }>;
  spaceDistribution: Array<{ name: string; value: number }>;
  recentAiTimeline: Array<Record<string, unknown>>;
  correctionSummary: { total: number; recent: Array<Record<string, unknown>> };
  behaviorGraph: { nodes: Array<Record<string, unknown>>; links: Array<Record<string, unknown>> };
};

const route = useRoute();
const loading = ref(true);
const data = ref<InsightData | null>(null);
const timeline = ref<Array<Record<string, unknown>>>([]);
const timelinePage = ref(1);
const timelineTotal = ref(0);
const timelineLoading = ref(false);
const corrections = ref<Array<Record<string, unknown>>>([]);

const aiTrendRef = ref<HTMLDivElement>();
const inputPieRef = ref<HTMLDivElement>();
const intentPieRef = ref<HTMLDivElement>();
const billTrendRef = ref<HTMLDivElement>();
const iePieRef = ref<HTMLDivElement>();
const catBarRef = ref<HTMLDivElement>();
const spacePieRef = ref<HTMLDivElement>();
const graphRef = ref<HTMLDivElement>();

type Profile = {
  nickname?: string;
  phone?: string;
  email?: string;
  openid?: string;
  status?: string;
  memberLevel?: string;
  memberExpireAt?: string;
  createdAt?: string;
  lastLoginAt?: string;
};

const profile = computed(() => data.value?.profile as Profile | undefined);
const pageTitle = computed(() => profile.value?.nickname || '用户洞察');

const aiStatCards = computed(() => {
  const s = data.value?.aiStats;
  if (!s) return [];
  return [
    { label: 'AI 总调用', value: s.totalCalls },
    { label: '语音输入', value: s.voiceCount },
    { label: '文字输入', value: s.textCount },
    { label: '记账识别', value: s.billParseCount },
    { label: '成功率', value: `${s.successRate}%` },
    { label: '失败', value: s.failedCount },
    { label: '平均耗时', value: `${s.avgDurationMs}ms` },
    { label: '已确认入账', value: s.confirmedCount },
  ];
});

const billStatCards = computed(() => {
  const s = data.value?.billStats;
  if (!s) return [];
  return [
    { label: '总记账', value: s.totalCount },
    { label: 'AI 入账', value: s.aiGeneratedCount },
    { label: '手动入账', value: s.manualCount },
    { label: '本月支出', value: `¥${s.monthExpense}` },
    { label: '本月收入', value: `¥${s.monthIncome}` },
    { label: '均单笔', value: `¥${s.avgAmount}` },
  ];
});

function fmt(v: unknown) {
  return v ? dayjs(String(v)).format('YYYY-MM-DD HH:mm') : '—';
}

async function loadInsight() {
  loading.value = true;
  try {
    data.value = await request.get(`/admin/users/${route.params.id}/insight`);
    timeline.value = [...(data.value?.recentAiTimeline || [])];
    corrections.value = [...(data.value?.correctionSummary?.recent || [])];
    const tl = await request.get<{ total: number }>(`/admin/users/${route.params.id}/ai-timeline`, {
      params: { page: 1, pageSize: 20 },
    });
    timelineTotal.value = tl.total;
    await nextTick();
    renderCharts();
  } finally {
    loading.value = false;
  }
}

async function loadMoreTimeline() {
  timelineLoading.value = true;
  try {
    timelinePage.value += 1;
    const res = await request.get<{ items: Array<Record<string, unknown>>; total: number }>(
      `/admin/users/${route.params.id}/ai-timeline`,
      { params: { page: timelinePage.value, pageSize: 20 } },
    );
    timeline.value.push(...res.items);
    timelineTotal.value = res.total;
  } finally {
    timelineLoading.value = false;
  }
}

function renderLine(el: HTMLDivElement | undefined, trend: Array<{ date: string; count: number }>, color: string) {
  if (!el) return;
  const chart = echarts.init(el);
  chart.setOption({
    grid: { left: 40, right: 16, top: 24, bottom: 28 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: trend.map((d) => d.date.slice(5)) },
    yAxis: { type: 'value' },
    series: [{ type: 'line', smooth: true, data: trend.map((d) => d.count), lineStyle: { color }, itemStyle: { color } }],
  });
}

function renderPie(el: HTMLDivElement | undefined, items: Array<{ name: string; value: number }>) {
  if (!el || !items.length) return;
  const chart = echarts.init(el);
  chart.setOption({
    tooltip: { trigger: 'item' },
    series: [{ type: 'pie', radius: ['42%', '68%'], data: items }],
  });
}

function renderCharts() {
  const d = data.value;
  if (!d) return;
  const primary = '#2EB8A0';
  renderLine(aiTrendRef.value, d.aiTrend, primary);
  renderLine(billTrendRef.value, d.billTrend, '#5B8FF9');
  renderPie(
    inputPieRef.value,
    d.inputTypeDistribution.map((x) => ({
      name: x.type === 'voice' ? '语音' : '文字',
      value: x.count,
    })),
  );
  renderPie(
    intentPieRef.value,
    d.intentDistribution.map((x) => ({ name: x.intent, value: x.count })),
  );
  renderPie(
    iePieRef.value,
    d.incomeExpenseRatio.map((x) => ({
      name: x.type === 'expense' ? '支出' : '收入',
      value: x.amount,
    })),
  );
  renderPie(
    spacePieRef.value,
    d.spaceDistribution.map((x) => ({ name: x.name, value: x.value })),
  );
  if (catBarRef.value && d.categoryTop.length) {
    const chart = echarts.init(catBarRef.value);
    chart.setOption({
      grid: { left: 56, right: 12, top: 12, bottom: 28 },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: d.categoryTop.map((c) => c.name).reverse() },
      series: [{ type: 'bar', data: d.categoryTop.map((c) => c.amount).reverse(), itemStyle: { color: primary } }],
    });
  }
  if (graphRef.value && d.behaviorGraph.nodes.length) {
    const chart = echarts.init(graphRef.value);
    const categories = [...new Set(d.behaviorGraph.nodes.map((n) => String(n.category)))];
    chart.setOption({
      tooltip: {},
      legend: { data: categories },
      series: [{
        type: 'graph',
        layout: 'force',
        roam: true,
        label: { show: true, fontSize: 10 },
        force: { repulsion: 120, edgeLength: 80 },
        categories: categories.map((name) => ({ name })),
        data: d.behaviorGraph.nodes.map((n) => ({
          id: String(n.id),
          name: String(n.name),
          category: categories.indexOf(String(n.category)),
          symbolSize: Math.min(48, 20 + Math.sqrt(Number(n.value) || 1)),
        })),
        links: d.behaviorGraph.links.map((l) => ({
          source: String(l.source),
          target: String(l.target),
          value: Number(l.value),
        })),
      }],
    });
  }
}

watch(data, () => nextTick(renderCharts));
onMounted(loadInsight);
</script>

<style scoped lang="scss">
.insight-page { padding-bottom: 48px; }
.section-title {
  margin: 28px 0 14px;
  font-size: 16px;
  font-weight: 600;
}
.insight-hero {
  padding: 24px;
  margin-bottom: 8px;
}
.insight-hero__main {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}
.insight-hero__avatar { flex-shrink: 0; }
.insight-hero__name { margin: 0 0 6px; font-size: 22px; font-weight: 700; }
.insight-hero__meta { margin: 0 0 10px; color: var(--moona-text-secondary); font-size: 14px; }
.insight-hero__tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.insight-hero__summary {
  margin: 0;
  padding: 12px 14px;
  background: var(--moona-primary-soft);
  border-radius: 10px;
  color: var(--moona-primary-text);
  font-size: 14px;
  line-height: 1.6;
}
.stat-row { margin-bottom: 8px; }
.chart-row { margin-bottom: 8px; }
.chart-card {
  padding: 16px 18px;
  margin-bottom: 16px;
  h4 { margin: 0 0 8px; font-size: 14px; font-weight: 600; }
}
.chart-canvas { height: 260px; }
.chart-canvas--sm { height: 220px; }
.chart-canvas--graph { height: 420px; }
.space-card {
  padding: 14px 16px;
  margin-bottom: 12px;
  min-height: 120px;
}
.space-card__head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.space-card__icon { font-size: 22px; }
.space-card__name { font-weight: 600; flex: 1; }
.space-card__stat { margin: 0 0 4px; font-size: 13px; color: var(--moona-text-secondary); }
.space-card__cats { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.timeline-wrap { padding: 20px 24px; }
.tl-item { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tl-item__input { margin: 6px 0 4px; font-weight: 500; }
.tl-item__reply { margin: 0; color: var(--moona-text-secondary); font-size: 13px; }
.tl-item__bill { margin: 4px 0 0; color: var(--moona-primary-text); font-size: 13px; }
.timeline-more { text-align: center; padding-top: 12px; }
.compare-card { padding: 16px; margin-bottom: 16px; }
.compare-card__time { margin: 0 0 10px; font-size: 12px; color: var(--moona-text-muted); }
.compare-card__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.compare-card__side {
  padding: 12px;
  border-radius: 10px;
  font-size: 12px;
  h5 { margin: 0 0 8px; }
  pre { margin: 0; white-space: pre-wrap; max-height: 160px; overflow: auto; }
  &--ai { background: #fff7f7; }
  &--user { background: #f0fdf8; }
}
</style>
