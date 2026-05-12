<template>
  <PageShell>
    <view class="nav">
      <view class="nav-back" @tap="goBack">
        <view class="back-glass" />
        <image class="back-icon" :src="backIcon" />
      </view>
      <text class="nav-title">文章详情</text>
      <view class="nav-placeholder" />
    </view>

    <view v-if="article" class="article">
      <text class="article-title">{{ article.title }}</text>
      <view class="article-meta">
        <text class="meta-cat">{{ catLabel(article.category) }}</text>
        <text class="meta-date">{{ formatDate(article.createdAt) }}</text>
      </view>
      <view class="article-body">
        <rich-text :nodes="renderContent(article.content || '')" />
      </view>
    </view>

    <view class="spacer" />
  </PageShell>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { backIcon } from '@/utils/icons';
import PageShell from '@/components/PageShell.vue';
import { discoverApi } from '@/api/discover';
import type { Article } from '@/types/domain';

const article = ref<Article | null>(null);

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) { uni.navigateBack(); }
  else { uni.switchTab({ url: '/pages/index/index' }); }
}

function catLabel(cat: string) {
  const map: Record<string, string> = { tip: '技巧', knowledge: '知识', challenge: '挑战' };
  return map[cat] || cat;
}

function formatDate(iso: string) {
  return iso.substring(0, 10);
}

function renderContent(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, '<h3 style="font-size:28rpx;font-weight:700;color:#1e1e1e;margin:24rpx 0 12rpx;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:32rpx;font-weight:700;color:#1e1e1e;margin:28rpx 0 14rpx;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:36rpx;font-weight:800;color:#1e1e1e;margin:32rpx 0 16rpx;">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<p style="padding-left:20rpx;margin:6rpx 0;">• $1</p>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
  return `<div style="font-size:28rpx;color:#333;line-height:1.8;">${html}</div>`;
}

onMounted(async () => {
  const pages = getCurrentPages();
  const current = pages[pages.length - 1];
  const id = (current as any)?.options?.id;
  if (id) {
    try { article.value = await discoverApi.getArticle(id); } catch {}
  }
});
</script>

<style scoped>
.nav { display: flex; align-items: center; justify-content: space-between; padding-bottom: 16rpx; }
.nav-back { position: relative; width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center; }
.back-glass { position: absolute; top: 0; right: 0; bottom: 0; left: 0; border-radius: 50%; background: rgba(255,255,255,0.55); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1rpx solid rgba(255,255,255,0.5); }
.back-icon { position: relative; z-index: 1; width: 36rpx; height: 36rpx; margin-left: -4rpx; }
.nav-title { font-size: 34rpx; font-weight: 700; color: #1e1e1e; }
.nav-placeholder { width: 60rpx; }

.article { padding: 8rpx 0; }
.article-title { font-size: 38rpx; font-weight: 800; color: #1e1e1e; line-height: 1.4; margin-bottom: 16rpx; }
.article-meta { display: flex; gap: 16rpx; margin-bottom: 32rpx; }
.meta-cat {
  padding: 4rpx 16rpx; border-radius: 8rpx; font-size: 22rpx; font-weight: 600;
  background: rgba(0,212,200,0.1); color: #00d4c8;
}
.meta-date { font-size: 22rpx; color: #88909b; line-height: 36rpx; }
.article-body { line-height: 1.8; }

.spacer { height: 60rpx; }
</style>
