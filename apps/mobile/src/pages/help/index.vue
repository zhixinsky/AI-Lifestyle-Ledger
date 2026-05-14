<template>
  <PageShell>
    <view class="nav">
      <view class="nav-back" @tap="goBack">
        <view class="back-glass" />
        <image class="back-icon" :src="backIcon" mode="aspectFit" />
      </view>
      <text class="nav-title">帮助与反馈</text>
      <view class="nav-placeholder" />
    </view>

    <view class="hero">
      <text class="hero-title">联系客服</text>
      <text class="hero-sub">遇到问题或有建议，可以直接进入微信客服会话，我们会在客服工具中回复你。</text>
    </view>

    <view class="section">
      <text class="section-title">在线客服</text>
      <MoonaCard class="service-card">
        <text class="service-title">微信客服会话</text>
        <text class="service-desc">适合反馈识别错误、账单异常、会员问题、功能建议等。进入后可发送文字或图片。</text>
        <!-- #ifdef MP-WEIXIN -->
        <button
          class="service-btn"
          open-type="contact"
          :session-from="sessionFrom"
          :show-message-card="true"
          :send-message-title="messageCardTitle"
          :send-message-path="messageCardPath"
          @contact="handleContact"
        >
          联系在线客服
        </button>
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <button class="service-btn" @tap="copyEmail">复制客服邮箱</button>
        <!-- #endif -->
      </MoonaCard>
    </view>

    <view class="section">
      <text class="section-title">反馈前可参考</text>
      <MoonaCard class="faq-card">
        <view v-for="(item, index) in faqs" :key="item.q" :class="['faq-item', { bordered: index < faqs.length - 1 }]">
          <text class="faq-q">{{ item.q }}</text>
          <text class="faq-a">{{ item.a }}</text>
        </view>
      </MoonaCard>
    </view>

    <view class="section">
      <text class="section-title">联系方式</text>
      <MoonaCard class="contact-card">
        <view class="contact-row" @tap="copyEmail">
          <view>
            <text class="contact-title">邮箱反馈</text>
            <text class="contact-sub">{{ supportEmail }}</text>
          </view>
          <text class="contact-action">复制</text>
        </view>
      </MoonaCard>
    </view>
  </PageShell>
</template>

<script setup lang="ts">
import PageShell from '@/components/PageShell.vue';
import MoonaCard from '@/components/MoonaCard.vue';
import { backIcon } from '@/utils/icons';

const supportEmail = 'admin@dokor.cn';
const sessionFrom = 'moona_help_feedback';
const messageCardTitle = 'Moona AI生活账本帮助与反馈';
const messageCardPath = '/pages/help/index';

const faqs = [
  { q: '语音记账没有识别成功怎么办？', a: '可以换成更明确的说法，例如“午饭花了28元”或“工资到账5000”。' },
  { q: '为什么 AI 提醒看起来不够准确？', a: 'AI 会基于你的账单记录逐步学习，记录越连续，分析会越贴近你的生活节奏。' },
  { q: '不登录可以使用吗？', a: '可以浏览基础页面。保存账单、语音识别和个性化 AI 分析需要登录后使用。' },
  { q: '如何删除或修改账单？', a: '进入账单页，点击明细里的备注、金额或分类即可修改；语音记账成功卡片也支持修改和删除。' },
];

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) uni.navigateBack();
  else uni.switchTab({ url: '/pages/profile/index' });
}

function handleContact(e: any) {
  const path = e?.detail?.path;
  const query = e?.detail?.query;
  if (path) {
    const queryString = query && typeof query === 'object'
      ? Object.entries(query).map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`).join('&')
      : '';
    uni.navigateTo({ url: `${path}${queryString ? `?${queryString}` : ''}` });
  }
}

function copyEmail() {
  uni.setClipboardData({ data: supportEmail });
}
</script>

<style scoped>
.nav { display: flex; align-items: center; justify-content: space-between; padding-bottom: 18rpx; }
.nav-back { position: relative; width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center; }
.back-glass { position: absolute; inset: 0; border-radius: 50%; background: rgba(255,255,255,0.55); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1rpx solid rgba(255,255,255,0.5); }
.back-icon { position: relative; z-index: 1; width: 36rpx; height: 36rpx; margin-left: -4rpx; }
.nav-title { font-size: 34rpx; font-weight: 750; color: #1e1e1e; }
.nav-placeholder { width: 60rpx; }

.hero { padding: 28rpx 4rpx 12rpx; }
.hero-title { display: block; font-size: 44rpx; font-weight: 850; color: #1e352f; }
.hero-sub { display: block; margin-top: 10rpx; font-size: 26rpx; line-height: 1.55; color: #667770; }
.section { margin-top: 28rpx; }
.section-title { display: block; margin-bottom: 8rpx; padding: 0 4rpx; font-size: 30rpx; font-weight: 760; color: #1e1e1e; }
.faq-card, .service-card, .contact-card { padding: 28rpx !important; }
.service-title { display: block; font-size: 32rpx; font-weight: 820; color: #213a33; }
.service-desc { display: block; margin-top: 12rpx; font-size: 25rpx; line-height: 1.6; color: #667770; }
.service-btn { margin-top: 26rpx; width: 100%; height: 84rpx; line-height: 84rpx; border-radius: 999rpx; background: linear-gradient(135deg, #9ee8d3, #72d7bd); color: #16483d; font-size: 29rpx; font-weight: 800; }
.service-btn::after { border: none; }
.faq-item { padding: 18rpx 0; }
.faq-item:first-child { padding-top: 0; }
.faq-item.bordered { border-bottom: 1rpx solid #edf1ef; }
.faq-q { display: block; font-size: 28rpx; font-weight: 750; color: #213a33; }
.faq-a { display: block; margin-top: 8rpx; font-size: 24rpx; line-height: 1.6; color: #667770; }
.contact-row { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; }
.contact-title { display: block; font-size: 28rpx; font-weight: 750; color: #213a33; }
.contact-sub { display: block; margin-top: 6rpx; font-size: 24rpx; color: #667770; }
.contact-action { flex-shrink: 0; font-size: 24rpx; font-weight: 700; color: #2eb8a0; }
</style>
