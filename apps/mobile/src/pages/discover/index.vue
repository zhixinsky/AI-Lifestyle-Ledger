<template>
  <PageShell>
    <!-- 顶部标题 -->
    <view class="topbar">
      <text class="page-title">发现</text>
    </view>

    <!-- 分类标签 -->
    <view class="tab-row">
      <view v-for="tab in tabs" :key="tab.value" :class="['tab-item', { active: activeTab === tab.value }]" @tap="activeTab = tab.value">
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="quick-row">
      <view class="quick-card" @tap="goGrowth">
        <text class="quick-icon">🏆</text>
        <text class="quick-label">成长中心</text>
      </view>
      <view class="quick-card" @tap="goWealth">
        <text class="quick-icon">📈</text>
        <text class="quick-label">财富成长</text>
      </view>
      <view class="quick-card" @tap="goBills">
        <text class="quick-icon">📋</text>
        <text class="quick-label">账单</text>
      </view>
    </view>

    <!-- 文章列表 -->
    <view class="article-list">
      <MoonaCard v-for="article in articles" :key="article.id" class="article-card" @tap="goArticle(article.id)">
        <view class="article-content">
          <view class="article-text">
            <view class="article-cat-badge">
              <text>{{ catLabel(article.category) }}</text>
            </view>
            <text class="article-title">{{ article.title }}</text>
            <text class="article-summary">{{ article.summary }}</text>
          </view>
          <view v-if="article.coverUrl" class="article-cover">
            <image :src="article.coverUrl" mode="aspectFill" class="cover-img" />
          </view>
        </view>
      </MoonaCard>
    </view>

    <view v-if="!articles.length" class="empty">
      <text class="empty-text">暂无文章</text>
    </view>

    <AppTabbar current="discover" />
  </PageShell>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import PageShell from '@/components/PageShell.vue';
import MoonaCard from '@/components/MoonaCard.vue';
import AppTabbar from '@/components/AppTabbar.vue';
import { discoverApi } from '@/api/discover';
import type { Article } from '@/types/domain';

const activeTab = ref('');
const articles = ref<Article[]>([]);

const tabs = [
  { label: '全部', value: '' },
  { label: '理财技巧', value: 'tip' },
  { label: '财务知识', value: 'knowledge' },
  { label: '挑战活动', value: 'challenge' },
];

function goGrowth() { uni.navigateTo({ url: '/pages/growth/index' }); }
function goWealth() { uni.navigateTo({ url: '/pages/saving-goals/index' }); }
function goBills() { uni.switchTab({ url: '/pages/bills/index' }); }
function goArticle(id: string) { uni.navigateTo({ url: `/pages/discover/article?id=${id}` }); }

function catLabel(cat: string) {
  const map: Record<string, string> = { tip: '技巧', knowledge: '知识', challenge: '挑战' };
  return map[cat] || cat;
}

async function loadArticles() {
  try {
    const res = await discoverApi.listArticles(activeTab.value || undefined);
    articles.value = res.items;
  } catch {}
}

watch(activeTab, loadArticles);
onMounted(() => {
  // #ifdef MP-WEIXIN
  uni.hideTabBar();
  // #endif
  loadArticles();
});
</script>

<style scoped>
.topbar { padding-bottom: 8rpx; }
.page-title { font-size: 38rpx; font-weight: 800; color: #1e1e1e; }

.tab-row { display: flex; gap: 12rpx; margin-bottom: 20rpx; }
.tab-item {
  padding: 10rpx 24rpx; border-radius: 32rpx; font-size: 26rpx; font-weight: 600; color: #88909b;
  background: rgba(255,255,255,0.6); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
}
.tab-item.active { background: #1e1e1e; color: #fff; }

.quick-row { display: flex; gap: 16rpx; margin-bottom: 24rpx; }
.quick-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 24rpx 16rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 8rpx 32rpx rgba(30, 30, 30, 0.06);
}
.quick-icon { font-size: 36rpx; }
.quick-label { font-size: 22rpx; color: #1e1e1e; font-weight: 600; }

.article-list { display: flex; flex-direction: column; gap: 16rpx; }
.article-card { padding: 24rpx !important; }
.article-content { display: flex; gap: 20rpx; }
.article-text { flex: 1; display: flex; flex-direction: column; gap: 8rpx; }
.article-cat-badge {
  display: inline-flex; align-self: flex-start; padding: 4rpx 14rpx; border-radius: 8rpx;
  background: rgba(0,212,200,0.1); font-size: 20rpx; color: #00d4c8; font-weight: 600;
}
.article-title { font-size: 28rpx; font-weight: 700; color: #1e1e1e; line-height: 1.4; }
.article-summary { font-size: 24rpx; color: #88909b; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.article-cover { flex-shrink: 0; width: 160rpx; height: 120rpx; border-radius: 12rpx; overflow: hidden; }
.cover-img { width: 100%; height: 100%; }

.empty { text-align: center; padding: 80rpx 0; }
.empty-text { font-size: 28rpx; color: #88909b; }
</style>
