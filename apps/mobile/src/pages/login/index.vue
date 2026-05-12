<template>
  <view class="login-page">
    <view class="glow glow-a" />
    <view class="glow glow-b" />

    <view class="body">
      <!-- 吉祥物 -->
      <view class="mascot-wrap">
        <view class="mascot">
          <view class="eye left" />
          <view class="eye right" />
          <view class="mouth" />
        </view>
      </view>
      <text class="brand">你的财务</text>
      <text class="brand">AI 好友</text>
      <text class="slogan">懂你的每一笔花费</text>

      <!-- 表单 -->
      <view class="form">
        <text class="greeting">欢迎回来</text>
        <text class="form-sub">AI 财务生活助手</text>

        <view class="input-wrap">
          <text class="input-label">手机号</text>
          <input v-model="phone" type="number" maxlength="11" placeholder="请输入手机号" />
        </view>
        <view class="input-wrap">
          <text class="input-label">验证码</text>
          <input v-model="code" type="number" maxlength="6" placeholder="请输入验证码" />
        </view>

        <button class="submit-btn" :disabled="loading" @tap="submit">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </view>

      <text class="legal">登录即同意《用户协议》和《隐私政策》</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const phone = ref('');
const code = ref('');
const loading = ref(false);

async function submit() {
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
  padding-top: calc(env(safe-area-inset-top, 44px) + 60rpx);
}

.mascot-wrap {
  margin-bottom: 24rpx;
}

.mascot {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #00d4c8, #7cbcff);
  box-shadow: 0 20rpx 60rpx rgba(0, 212, 200, 0.3);
}

.eye {
  position: absolute;
  top: 52rpx;
  width: 24rpx;
  height: 32rpx;
  border-radius: 50%;
  background: #1e1e1e;
}

.eye.left {
  left: 44rpx;
}

.eye.right {
  right: 44rpx;
}

.mouth {
  position: absolute;
  left: 50%;
  top: 98rpx;
  width: 36rpx;
  height: 18rpx;
  margin-left: -18rpx;
  border-radius: 0 0 18rpx 18rpx;
  background: #1e1e1e;
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

.legal {
  margin-top: 120rpx;
  font-size: 22rpx;
  color: #98a2b3;
  text-align: center;
}
</style>
