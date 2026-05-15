<template>
  <view class="login-page">
    <view class="glow glow-a" />
    <view class="glow glow-b" />

    <view class="body">
      <!-- Logo -->
      <view class="logo-wrap">
        <image class="logo-img" src="/static/images/logo.png" mode="aspectFit" />
      </view>
      <text class="brand">AI生活账本</text>
      <text class="slogan">懂你的每一笔花费</text>

      <!-- 表单 -->
      <view class="form">
        <text class="greeting">欢迎回来</text>

        <view class="input-wrap">
          <text class="input-label">手机号</text>
          <input v-model="phone" type="number" maxlength="11" placeholder="请输入手机号" />
        </view>
        <view class="input-wrap">
          <text class="input-label">验证码</text>
          <view class="code-row">
            <input v-model="code" type="number" maxlength="6" placeholder="请输入验证码" class="code-input" />
            <view :class="['code-btn', { disabled: codeBtnDisabled }]" @tap="sendCode">
              <text>{{ codeBtnText }}</text>
            </view>
          </view>
        </view>

        <button class="submit-btn" :disabled="loading" @tap="submit">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </view>

      <!-- #ifdef MP-WEIXIN -->
      <view class="wx-section">
        <view class="divider">
          <view class="divider-line" />
          <text class="divider-text">或</text>
          <view class="divider-line" />
        </view>
        <button class="wx-quick-btn" :disabled="loading" @tap="wxLogin">
          <text>微信快捷登录</text>
        </button>
      </view>
      <!-- #endif -->

      <view class="agreement-row">
        <view class="agreement-check" :class="{ checked: agreementAccepted }" @tap="toggleAgreement">
          <text v-if="agreementAccepted">✓</text>
        </view>
        <view class="agreement-text">
          <text>我已阅读并同意</text>
          <text class="agreement-link" @tap="openUserAgreement">《用户服务协议》</text>
          <text>和</text>
          <text class="agreement-link" @tap="openPrivacyPolicy">《隐私政策》</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/api/auth';
import { VERIFICATION_CODE_RESEND_SECONDS } from '@/constants/verification-code';

const auth = useAuthStore();
const phone = ref('');
const code = ref('');
const loading = ref(false);
const sendingCode = ref(false);
const countdown = ref(0);
const agreementAccepted = ref(false);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const codeBtnText = computed(() => {
  if (sendingCode.value) return '发送中…';
  if (countdown.value > 0) return `${countdown.value}秒后可重发`;
  return '获取验证码';
});
const codeBtnDisabled = computed(() => sendingCode.value || countdown.value > 0);

function toggleAgreement() {
  agreementAccepted.value = !agreementAccepted.value;
}

function ensureAgreementAccepted() {
  if (agreementAccepted.value) return true;
  uni.showToast({ title: '请先阅读并同意协议', icon: 'none' });
  return false;
}

function openUserAgreement() {
  uni.navigateTo({ url: '/pages/legal/user-agreement' });
}

function openPrivacyPolicy() {
  uni.navigateTo({ url: '/pages/legal/privacy-policy' });
}

async function sendCode() {
  if (!ensureAgreementAccepted()) return;
  if (codeBtnDisabled.value) return;
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确手机号', icon: 'none' });
    return;
  }
  sendingCode.value = true;
  try {
    await authApi.sendCode(phone.value);
    uni.showToast({ title: '验证码已发送', icon: 'success' });
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    countdown.value = VERIFICATION_CODE_RESEND_SECONDS;
    countdownTimer = setInterval(() => {
      countdown.value -= 1;
      if (countdown.value <= 0 && countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
    }, 1000);
  } catch (e: any) {
    uni.showToast({ title: e?.message || '发送失败', icon: 'none' });
  } finally {
    sendingCode.value = false;
  }
}

async function wxLogin() {
  if (!ensureAgreementAccepted()) return;
  loading.value = true;
  try {
    const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
      uni.login({ provider: 'weixin', success: resolve, fail: reject });
    });
    if (!loginRes.code) throw new Error('获取微信code失败');
    const result = await authApi.wxLogin(loginRes.code);
    auth.token = result.accessToken;
    auth.user = result.user;
    uni.setStorageSync('token', result.accessToken);
    uni.switchTab({ url: '/pages/index/index' });
  } catch (e: any) {
    uni.showToast({ title: e?.message || '微信登录失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

async function submit() {
  if (!ensureAgreementAccepted()) return;
  if (!phone.value || !code.value) {
    uni.showToast({ title: '请填写完整', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    await auth.login(phone.value, code.value);
    uni.switchTab({ url: '/pages/index/index' });
  } catch (e: any) {
    uni.showToast({ title: e?.message || '登录失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
});
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #eafaf9 0%, #f7f8fa 50%);
  font-family: -apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif;
}

.glow {
  position: fixed;
  z-index: 0;
  border-radius: 50%;
  pointer-events: none;
}

.glow-a {
  top: -120rpx;
  right: -80rpx;
  width: 400rpx;
  height: 400rpx;
  background: radial-gradient(circle, rgba(0, 212, 200, 0.25), transparent 70%);
}

.glow-b {
  left: -100rpx;
  top: 400rpx;
  width: 320rpx;
  height: 320rpx;
  background: radial-gradient(circle, rgba(124, 140, 255, 0.2), transparent 70%);
}

.body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 48rpx;
  padding-top: calc(env(safe-area-inset-top, 44px) + 160rpx);
}

.logo-wrap {
  margin-bottom: 24rpx;
}

.logo-img {
  width: 180rpx;
  height: 180rpx;
}

.brand {
  display: block;
  font-size: 44rpx;
  font-weight: 800;
  color: #1e1e1e;
  line-height: 1.3;
  text-align: center;
}

.slogan {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #667085;
}

.form {
  width: 100%;
  margin-top: 60rpx;
  padding: 40rpx 36rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow: 0 12rpx 48rpx rgba(30, 30, 30, 0.06);
}

.greeting {
  display: block;
  font-size: 38rpx;
  font-weight: 800;
  color: #1e1e1e;
}

.form-sub {
  display: block;
  margin-top: 4rpx;
  font-size: 26rpx;
  color: #667085;
}

.input-wrap {
  margin-top: 32rpx;
}

.input-label {
  display: block;
  margin-bottom: 12rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: #344054;
}

.input-wrap input {
  width: 100%;
  height: 88rpx;
  padding: 0 28rpx;
  border-radius: 20rpx;
  background: #f7f8fa;
  font-size: 30rpx;
  color: #1e1e1e;
  box-sizing: border-box;
}

.code-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
}

.code-row .code-input {
  flex: 1;
  width: auto;
  min-width: 0;
}

.code-btn {
  flex-shrink: 0;
  min-width: 240rpx;
  height: 88rpx;
  padding: 0 28rpx;
  border-radius: 20rpx;
  background: rgba(0, 212, 200, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.code-btn.disabled {
  background: #edf1ef;
}

.code-btn text {
  font-size: 26rpx;
  color: #00a99f;
  font-weight: 600;
  white-space: nowrap;
}

.code-btn.disabled text {
  color: #98a2b3;
}

.submit-btn {
  width: 100%;
  height: 92rpx;
  margin-top: 40rpx;
  border: none;
  border-radius: 46rpx;
  background: linear-gradient(135deg, #00d4c8, #34d399);
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 92rpx;
  letter-spacing: 2rpx;
  box-shadow: 0 12rpx 36rpx rgba(0, 212, 200, 0.3);
}

.submit-btn[disabled] {
  opacity: 0.6;
}

.wx-section {
  width: 100%;
  margin-top: 40rpx;
}

.divider {
  display: flex;
  align-items: center;
  margin-bottom: 32rpx;
}

.divider-line {
  flex: 1;
  height: 1rpx;
  background: #e8e8e8;
}

.divider-text {
  padding: 0 24rpx;
  font-size: 24rpx;
  color: #98a2b3;
}

.wx-quick-btn {
  width: 60%;
  margin: 0 auto;
  height: 68rpx;
  border: 2rpx solid #07c160;
  border-radius: 34rpx;
  background: transparent;
  color: #07c160;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 68rpx;
}

.wx-quick-btn[disabled] {
  opacity: 0.6;
}

.wx-quick-btn::after {
  border: none;
}

.agreement-row {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 12rpx;
  margin-top: 120rpx;
}

.agreement-check {
  flex-shrink: 0;
  width: 28rpx;
  height: 28rpx;
  margin-top: 3rpx;
  border: 2rpx solid #cfd4dc;
  border-radius: 6rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20rpx;
  line-height: 1;
}

.agreement-check.checked {
  border-color: #2eb8a0;
  background: #2eb8a0;
}

.agreement-text {
  max-width: 560rpx;
  font-size: 22rpx;
  color: #98a2b3;
  line-height: 1.5;
  text-align: left;
}

.agreement-link {
  color: #2eb8a0;
}
</style>
