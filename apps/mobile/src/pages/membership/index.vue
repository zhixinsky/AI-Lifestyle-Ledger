<template>
  <PageShell class="membership-shell">
    <view class="nav">
      <view class="nav-back" @tap="goBack">
        <view class="back-glass" />
        <image class="back-icon" :src="backIcon" />
      </view>
      <text class="nav-title">会员中心</text>
      <view class="nav-placeholder" />
    </view>

    <MemberProfileCard
      :level="status?.level || 'free'"
      :title="levelName"
      :avatar-url="avatarUrl"
      :expire-at="status?.expireAt || null"
      :action-text="status?.isPro ? '续费会员' : '开通会员'"
      @tap="focusPlans"
      @action="focusPlans"
    />

    <!-- 会员权益 -->
    <view class="section-title benefits-title">会员权益</view>
    <view class="benefits-card">
      <view v-for="b in benefits" :key="b.label" class="benefit-row">
        <text class="benefit-icon">{{ b.icon }}</text>
        <view class="benefit-text">
          <text class="benefit-label">{{ b.label }}</text>
          <text class="benefit-desc">{{ b.desc }}</text>
        </view>
        <text :class="['benefit-status', { active: b.level <= currentLevelNum }]">
          {{ b.level <= currentLevelNum ? '✓' : levelNames[b.level] }}
        </text>
      </view>
    </view>

    <!-- 订阅方案 -->
    <view class="section-title plan-title">订阅方案</view>
    <view class="plan-grid">
      <view v-for="p in plans" :key="p.id" :class="['plan-card', { selected: selectedPlan === p.id }]" @tap="selectedPlan = p.id">
        <text v-if="p.tag" class="plan-tag">{{ p.tag }}</text>
        <text class="plan-name">{{ p.name }}</text>
        <text class="plan-price">¥{{ p.price }}</text>
        <text class="plan-unit">{{ p.unit }}</text>
      </view>
    </view>

    <button class="subscribe-btn" :loading="paying" :disabled="paying" @tap="handleSubscribe">
      {{ paying ? '正在拉起支付' : status?.isPro ? '续费会员' : '立即开通' }}
    </button>

    <view class="spacer" />
  </PageShell>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { backIcon } from '@/utils/icons';
import PageShell from '@/components/PageShell.vue';
import MemberProfileCard from '@/components/MemberProfileCard.vue';
import { membershipApi, type VirtualPaymentParams } from '@/api/membership';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';
import { useLoginSheetStore } from '@/stores/login-sheet';
import { getApiBase } from '@/utils/request';
import type { MembershipStatus } from '@/types/domain';

const status = ref<MembershipStatus | null>(null);
const selectedPlan = ref('monthly_pro');
const paying = ref(false);
const authStore = useAuthStore();
const loginSheet = useLoginSheetStore();

const levelNames = ['免费版', 'Pro', 'Premium'];
const currentLevelNum = computed(() => {
  if (!status.value) return 0;
  return status.value.level === 'premium' ? 2 : status.value.level === 'pro' ? 1 : 0;
});

const levelName = computed(() => ['免费版', 'Pro 会员', 'Premium 会员'][currentLevelNum.value]);
const avatarUrl = computed(() => {
  const url = authStore.user?.avatarUrl || '';
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('cloud://')) return url;
  return `${getApiBase().replace('/api', '')}${url}`;
});

const benefits = [
  { icon: '🤖', label: 'AI 智能对话', desc: '无限次 AI 财务对话', level: 0 },
  { icon: '📊', label: '高级分析报告', desc: '月度/年度深度财务分析', level: 1 },
  { icon: '🏡', label: '生活空间', desc: '家庭/情侣生活记录', level: 1 },
  { icon: '🏆', label: '成长体系', desc: '勋章和挑战系统', level: 0 },
  { icon: '📈', label: 'AI 财富建议', desc: '个性化存钱与理财建议', level: 1 },
  { icon: '🔮', label: 'AI 预测', desc: '消费趋势与目标预测', level: 2 },
  { icon: '☁️', label: '云端备份', desc: '数据多端同步', level: 2 },
];

const plans = [
  { id: 'monthly_pro', name: 'Pro 月卡', price: 8, unit: '/月', tag: '' },
  { id: 'quarterly_pro', name: 'Pro 季卡', price: 18, unit: '/季', tag: '省6元' },
  { id: 'yearly_pro', name: 'Pro 年卡', price: 68, unit: '/年', tag: '最划算' },
  { id: 'yearly_premium', name: '永久会员', price: 288, unit: '一次买断', tag: 'Premium' },
];

function formatDate(iso: string) {
  return iso.substring(0, 10);
}

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
  } else {
    uni.switchTab({ url: '/pages/profile/index' });
  }
}

function focusPlans() {
  uni.pageScrollTo({ selector: '.plan-title', duration: 240 });
}

async function handleSubscribe() {
  if (paying.value) return;
  if (!authStore.isLoggedIn) {
    uni.showToast({ title: '请登录后再订阅', icon: 'none' });
    loginSheet.open();
    return;
  }
  const plan = plans.find((p) => p.id === selectedPlan.value);
  if (!plan) return;

  try {
    paying.value = true;
    await refreshWechatPaySession();
    const res = await membershipApi.createOrder({
      type: 'subscription',
      planId: plan.id,
    });
    if (res.mock) {
      // 模拟支付
      uni.showModal({
        title: '模拟支付',
        content: `确认支付 ¥${plan.price}？（测试模式）`,
        async success(r) {
          if (r.confirm) {
            await membershipApi.mockPay(res.orderId);
            uni.showToast({ title: '开通成功！', icon: 'success' });
            loadStatus();
          }
        },
      });
      return;
    }
    if (!res.virtualPayParams) throw new Error('缺少微信虚拟支付参数');
    await requestWechatVirtualPayment(res.virtualPayParams);
    const syncResult = await membershipApi.syncOrder(res.orderId, true);
    if (syncResult.paid) {
      uni.showToast({ title: '开通成功！', icon: 'success' });
      await loadStatus();
    } else {
      uni.showToast({ title: '支付成功，等待到账确认', icon: 'none' });
      setTimeout(loadStatus, 1500);
    }
  } catch (error: any) {
    const message = String(error?.errMsg || error?.message || '');
    if (message.includes('cancel')) {
      uni.showToast({ title: '已取消支付', icon: 'none' });
    } else {
      uni.showToast({ title: message || '支付失败，请稍后重试', icon: 'none' });
    }
  } finally {
    paying.value = false;
  }
}

async function refreshWechatPaySession() {
  // #ifdef MP-WEIXIN
  const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
    uni.login({ provider: 'weixin', success: resolve, fail: reject });
  });
  if (!loginRes.code) throw new Error('获取微信支付登录态失败');
  await authApi.refreshSession(loginRes.code);
  // #endif
}

function requestWechatVirtualPayment(params: VirtualPaymentParams) {
  return new Promise<void>((resolve, reject) => {
    // #ifdef MP-WEIXIN
    // @ts-ignore
    wx.requestVirtualPayment({
      mode: params.mode,
      signData: params.signData,
      paySig: params.paySig,
      signature: params.signature,
      success: () => resolve(),
      fail: (err: UniApp.GeneralCallbackResult) => reject(err),
    });
    // #endif

    // #ifndef MP-WEIXIN
    reject(new Error('请在微信小程序内使用虚拟支付'));
    // #endif
  });
}

async function loadStatus() {
  try {
    status.value = await membershipApi.getStatus();
  } catch {}
}

async function loadMembershipPage() {
  if (authStore.isLoggedIn) {
    await authStore.loadProfile().catch(() => {});
  }
  await loadStatus();
}

onShow(loadMembershipPage);
</script>

<style scoped>
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16rpx;
}
.nav-back {
  position: relative;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.back-glass {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1rpx solid rgba(255, 255, 255, 0.5);
}
.back-icon {
  position: relative;
  z-index: 1;
  width: 36rpx;
  height: 36rpx;
  margin-left: -4rpx;
}
.nav-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1e1e1e;
}
.nav-placeholder { width: 60rpx; }

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1e1e1e;
  margin: 18rpx 0 4rpx 8rpx;
}

.benefits-title {
  margin-top: 18rpx;
}

.plan-title {
  margin-top: 18rpx;
}

.benefits-card {
  margin-top: 12rpx;
  margin-bottom: 6rpx;
  padding: 16rpx 28rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 8rpx 32rpx rgba(30, 30, 30, 0.06);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}
.benefit-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f1f3;
}
.benefit-row:last-child { border-bottom: none; }
.benefit-icon { font-size: 36rpx; }
.benefit-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}
.benefit-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #1e1e1e;
}
.benefit-desc {
  font-size: 22rpx;
  color: #88909b;
}
.benefit-status {
  font-size: 24rpx;
  color: #c0c4cc;
  font-weight: 600;
}
.benefit-status.active { color: #00d4c8; }

.plan-grid {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}
.plan-card {
  position: relative;
  flex: 1;
  min-width: 140rpx;
  padding: 24rpx 16rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 2rpx solid rgba(0, 0, 0, 0.06);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}
.plan-card.selected {
  border-color: #00d4c8;
  background: rgba(0, 212, 200, 0.06);
}
.plan-tag {
  position: absolute;
  top: -12rpx;
  right: 8rpx;
  padding: 2rpx 12rpx;
  border-radius: 10rpx;
  background: linear-gradient(135deg, #ff6b6b, #ff9a76);
  color: #fff;
  font-size: 18rpx;
  font-weight: 600;
}
.plan-name {
  font-size: 24rpx;
  font-weight: 600;
  color: #1e1e1e;
}
.plan-price {
  font-size: 40rpx;
  font-weight: 800;
  color: #00d4c8;
}
.plan-unit {
  font-size: 22rpx;
  color: #88909b;
}

.subscribe-btn {
  margin-top: 22rpx;
  width: 100%;
  height: 88rpx;
  border-radius: 44rpx;
  background: linear-gradient(135deg, #00d4c8, #00b8a9);
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 88rpx;
}

.membership-shell :deep(.page-body) {
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 32rpx);
}

.spacer { height: 16rpx; }
</style>
