<template>
  <PageShell>
    <view class="nav">
      <view class="nav-back" @tap="goBack">
        <view class="back-glass" />
        <image class="back-icon" :src="backIcon" mode="aspectFit" />
      </view>
      <text class="nav-title">关于 Moona</text>
      <view class="nav-placeholder" />
    </view>

    <view class="brand-card">
      <view class="brand-logo">
        <image class="brand-logo-img" :src="brandLogoSrc" mode="aspectFit" />
      </view>
      <text class="brand-name">Moona AI生活账本</text>
      <text class="brand-sub">让记账像聊天一样简单，让生活被温柔地看见。</text>
      <text class="version">Version 0.1.0</text>
    </view>

    <view class="section">
      <text class="section-title">我们在做什么</text>
      <MoonaCard class="copy-card">
        <text class="paragraph">Moona 是一个 AI 陪伴型生活账本。它不只记录消费，也会理解你的生活节奏、消费习惯、预算目标和重要提醒。</text>
        <text class="paragraph">你可以通过语音、手动记录和 AI 对话管理账单，让米粒逐渐成为更懂你的生活记账助手。</text>
      </MoonaCard>
    </view>

    <view class="section">
      <text class="section-title">核心能力</text>
      <MoonaCard class="feature-card">
        <view v-for="item in features" :key="item.title" class="feature-item">
          <view class="feature-icon"><text>{{ item.icon }}</text></view>
          <view class="feature-copy">
            <text class="feature-title">{{ item.title }}</text>
            <text class="feature-desc">{{ item.desc }}</text>
          </view>
        </view>
      </MoonaCard>
    </view>

    <view class="section">
      <text class="section-title">相关协议</text>
      <MoonaCard class="link-card">
        <view class="link-row" @tap="openUserAgreement">
          <text>用户服务协议</text>
          <text class="arrow">›</text>
        </view>
        <view class="link-row" @tap="openPrivacyPolicy">
          <text>隐私政策</text>
          <text class="arrow">›</text>
        </view>
      </MoonaCard>
    </view>
  </PageShell>
</template>

<script setup lang="ts">
import PageShell from '@/components/PageShell.vue';
import MoonaCard from '@/components/MoonaCard.vue';
import { backIcon } from '@/utils/icons';

const brandLogoSrc = 'cloud://prod-d3gw02rfhd26627e8.7072-prod-d3gw02rfhd26627e8-1432436662/ai.png';

const features = [
  { icon: '🎙', title: '语音记账', desc: '说一句话，米粒快速识别金额、分类和备注。' },
  { icon: '✨', title: 'AI观察', desc: '根据账单和偏好生成更贴近你的提醒。' },
  { icon: '🏡', title: '生活空间', desc: '记录两个人或一家人的共同生活节奏。' },
  { icon: '📈', title: '财富成长', desc: '用预算、目标和分析辅助长期规划。' },
];

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) uni.navigateBack();
  else uni.switchTab({ url: '/pages/profile/index' });
}

function openUserAgreement() {
  uni.navigateTo({ url: '/pages/legal/user-agreement' });
}

function openPrivacyPolicy() {
  uni.navigateTo({ url: '/pages/legal/privacy-policy' });
}
</script>

<style scoped>
.nav { display: flex; align-items: center; justify-content: space-between; padding-bottom: 18rpx; }
.nav-back { position: relative; width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center; }
.back-glass { position: absolute; inset: 0; border-radius: 50%; background: rgba(255,255,255,0.55); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1rpx solid rgba(255,255,255,0.5); }
.back-icon { position: relative; z-index: 1; width: 36rpx; height: 36rpx; margin-left: -4rpx; }
.nav-title { font-size: 34rpx; font-weight: 750; color: #1e1e1e; }
.nav-placeholder { width: 60rpx; }

.brand-card {
  margin-top: 12rpx;
  padding: 46rpx 34rpx;
  border-radius: 36rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(145deg, rgba(255,255,255,0.9), rgba(230,249,242,0.78));
  border: 1rpx solid rgba(255,255,255,0.82);
  box-shadow: 0 24rpx 70rpx rgba(77,126,112,0.12);
}
.brand-logo { width: 108rpx; height: 108rpx; display: flex; align-items: center; justify-content: center; }
.brand-logo-img { width: 100%; height: 100%; }
.brand-name { margin-top: 24rpx; font-size: 38rpx; font-weight: 850; color: #1f352f; }
.brand-sub { margin-top: 12rpx; font-size: 25rpx; line-height: 1.6; color: #667770; text-align: center; }
.version { margin-top: 20rpx; font-size: 22rpx; color: #9aa7a2; }
.section { margin-top: 30rpx; }
.section-title { display: block; margin-bottom: 8rpx; padding: 0 4rpx; font-size: 30rpx; font-weight: 760; color: #1e1e1e; }
.copy-card, .feature-card, .link-card { padding: 28rpx !important; }
.paragraph { display: block; font-size: 26rpx; line-height: 1.75; color: #4f615b; margin-bottom: 14rpx; }
.paragraph:last-child { margin-bottom: 0; }
.feature-item { display: flex; gap: 18rpx; padding: 18rpx 0; border-bottom: 1rpx solid #edf1ef; }
.feature-item:last-child { border-bottom: none; }
.feature-icon { width: 58rpx; height: 58rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; background: #eef8f4; font-size: 26rpx; flex-shrink: 0; }
.feature-copy { flex: 1; min-width: 0; }
.feature-title { display: block; font-size: 28rpx; font-weight: 760; color: #213a33; }
.feature-desc { display: block; margin-top: 6rpx; font-size: 24rpx; line-height: 1.5; color: #667770; }
.link-row { height: 86rpx; display: flex; align-items: center; justify-content: space-between; font-size: 28rpx; font-weight: 650; color: #213a33; border-bottom: 1rpx solid #edf1ef; }
.link-row:last-child { border-bottom: none; }
.arrow { font-size: 36rpx; color: #9aa7a2; }
</style>
