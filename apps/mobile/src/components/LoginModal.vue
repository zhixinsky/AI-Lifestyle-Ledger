<template>
  <view v-if="visible" class="login-mask" @tap.self="onMaskTap">
    <view class="login-sheet" :style="{ paddingBottom: safeBottom + 'px' }">
      <view class="sheet-handle" />
      <view class="sheet-header">
        <text class="sheet-title">登录 Moona</text>
        <text class="sheet-sub">AI 智能记账，懂你的每一笔花费</text>
      </view>

      <!-- 微信一键登录 -->
      <!-- #ifdef MP-WEIXIN -->
      <button class="wx-btn" @tap="wxLogin" :disabled="loading">
        <view class="wx-icon-wrap">
          <image class="wx-icon" :src="wxIconSrc" mode="aspectFit" />
        </view>
        <text>{{ loading ? '登录中...' : '微信快捷登录' }}</text>
      </button>
      <!-- #endif -->
      <!-- #ifndef MP-WEIXIN -->
      <button class="wx-btn" @tap="switchToPhone" :disabled="loading">
        <text>手机号快捷登录</text>
      </button>
      <!-- #endif -->

      <view class="divider">
        <view class="divider-line" />
        <text class="divider-text">或</text>
        <view class="divider-line" />
      </view>

      <!-- 手机号登录 -->
      <view v-if="showPhone" class="phone-form">
        <view class="input-wrap">
          <text class="input-label">手机号</text>
          <input v-model="phone" type="number" maxlength="11" placeholder="请输入手机号" />
        </view>
        <view class="input-wrap">
          <text class="input-label">验证码</text>
          <view class="code-row">
            <input v-model="code" type="number" maxlength="6" placeholder="请输入验证码" class="code-input" />
            <view class="code-btn" @tap="sendCode">
              <text>{{ codeBtnText }}</text>
            </view>
          </view>
        </view>
        <button class="submit-btn" :disabled="loading" @tap="phoneLogin">
          {{ loading ? '登录中...' : '登录 / 注册' }}
        </button>
      </view>
      <view v-else class="phone-toggle" @tap="switchToPhone">
        <text class="phone-toggle-text">使用手机号登录</text>
      </view>

      <text class="legal">登录即同意《用户协议》和《隐私政策》</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/api/auth';
import { makeSvgIcon } from '@/utils/icons';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const authStore = useAuthStore();
const loading = ref(false);
const showPhone = ref(false);
const phone = ref('');
const code = ref('');
const countdown = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const safeBottom = (() => {
  try {
    const sys = uni.getSystemInfoSync();
    return sys.safeAreaInsets?.bottom || 0;
  } catch { return 0; }
})();

const wxIconSrc = makeSvgIcon(
  '<path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.89 1.08 3.57 2.78 4.72L4.25 17l2.5-1.25C7.58 16 8.52 16.15 9.5 16.15c.34 0 .67-.02 1-.06A5.47 5.47 0 0110 14.5C10 11.46 12.46 9 15.5 9c.34 0 .67.03 1 .08C16.07 6.22 13.07 4 9.5 4zM7 9a1 1 0 110-2 1 1 0 010 2zm5 0a1 1 0 110-2 1 1 0 010 2zm3.5 2.5c-2.76 0-5 1.79-5 4s2.24 4 5 4c.59 0 1.16-.08 1.69-.22L19 20.5l-.38-1.88C19.89 17.77 20.5 16.7 20.5 15.5c0-2.21-2.24-4-5-4zm-1.5 3a.75.75 0 110-1.5.75.75 0 010 1.5zm3 0a.75.75 0 110-1.5.75.75 0 010 1.5z"/>',
  '#ffffff', '0'
);

const codeBtnText = computed(() => countdown.value > 0 ? `${countdown.value}s` : '获取验证码');

function onMaskTap() {
  if (!loading.value) emit('close');
}

function switchToPhone() {
  showPhone.value = true;
}

async function sendCode() {
  if (countdown.value > 0) return;
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确手机号', icon: 'none' });
    return;
  }
  try {
    await authApi.sendCode(phone.value);
    uni.showToast({ title: '验证码已发送', icon: 'success' });
    countdown.value = 60;
    countdownTimer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0 && countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
    }, 1000);
  } catch (e: any) {
    uni.showToast({ title: e?.message || '发送失败', icon: 'none' });
  }
}

async function phoneLogin() {
  if (!phone.value || !code.value) {
    uni.showToast({ title: '请填写完整', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    await authStore.login(phone.value, code.value);
    emit('success');
  } catch (e: any) {
    uni.showToast({ title: e?.message || '登录失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

async function wxLogin() {
  loading.value = true;
  try {
    const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
      uni.login({ provider: 'weixin', success: resolve, fail: reject });
    });
    if (!loginRes.code) throw new Error('获取微信code失败');
    const result = await authApi.wxLogin(loginRes.code);
    authStore.token = result.accessToken;
    authStore.user = result.user;
    uni.setStorageSync('token', result.accessToken);
    emit('success');
  } catch (e: any) {
    uni.showToast({ title: e?.message || '微信登录失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
}

.login-sheet {
  width: 100%;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 20rpx 48rpx 40rpx;
  animation: slide-up 0.3s ease;
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.sheet-handle {
  width: 64rpx;
  height: 8rpx;
  border-radius: 4rpx;
  background: #e0e0e0;
  margin: 0 auto 32rpx;
}

.sheet-header {
  margin-bottom: 40rpx;
}

.sheet-title {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: #1e1e1e;
}

.sheet-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #667085;
}

.wx-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  width: 100%;
  height: 96rpx;
  border: none;
  border-radius: 48rpx;
  background: #07c160;
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
  box-shadow: 0 8rpx 32rpx rgba(7, 193, 96, 0.3);
}

.wx-btn[disabled] {
  opacity: 0.6;
}

.wx-btn::after {
  border: none;
}

.wx-icon-wrap {
  width: 44rpx;
  height: 44rpx;
}

.wx-icon {
  width: 44rpx;
  height: 44rpx;
}

.divider {
  display: flex;
  align-items: center;
  margin: 36rpx 0;
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

.phone-toggle {
  padding: 24rpx 0;
  text-align: center;
}

.phone-toggle-text {
  font-size: 28rpx;
  color: #00a99f;
  font-weight: 500;
}

.phone-form {
  display: flex;
  flex-direction: column;
}

.input-wrap {
  margin-bottom: 24rpx;
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
  gap: 16rpx;
}

.code-input {
  flex: 1;
}

.code-btn {
  flex-shrink: 0;
  height: 88rpx;
  padding: 0 28rpx;
  border-radius: 20rpx;
  background: rgba(0, 212, 200, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.code-btn text {
  font-size: 26rpx;
  color: #00a99f;
  font-weight: 600;
  white-space: nowrap;
}

.submit-btn {
  width: 100%;
  height: 92rpx;
  margin-top: 16rpx;
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

.submit-btn::after {
  border: none;
}

.legal {
  display: block;
  margin-top: 32rpx;
  font-size: 22rpx;
  color: #98a2b3;
  text-align: center;
}
</style>
