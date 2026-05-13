<template>
  <view v-if="visible" class="login-mask" @tap.self="onMaskTap">
    <view class="login-sheet" :style="{ paddingBottom: safeBottom + 'px' }">
      <view class="sheet-handle" />

      <!-- 步骤1: 登录 -->
      <view v-if="step === 'login'">
        <view class="sheet-header">
          <text class="sheet-title">登录 Moona</text>
          <text class="sheet-sub">AI 智能记账，懂你的每一笔花费</text>
        </view>

        <!-- #ifdef MP-WEIXIN -->
        <button class="wx-btn" @tap="wxLogin" :disabled="loading">
          <view class="wx-icon-wrap">
            <image class="wx-icon" :src="wxIconSrc" mode="aspectFit" />
          </view>
          <text>{{ loading ? '登录中...' : '微信快捷登录' }}</text>
        </button>
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <button class="wx-btn" @tap="goPhoneLogin" :disabled="loading">
          <text>手机号快捷登录</text>
        </button>
        <!-- #endif -->

        <view class="divider">
          <view class="divider-line" />
          <text class="divider-text">或</text>
          <view class="divider-line" />
        </view>

        <button class="phone-btn" @tap="goPhoneLogin">
          <text>手机号登录</text>
        </button>

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

      <!-- 步骤2: 完善资料（微信头像+昵称） -->
      <!-- #ifdef MP-WEIXIN -->
      <view v-if="step === 'profile'">
        <view class="sheet-header">
          <text class="sheet-title">完善资料</text>
          <text class="sheet-sub">设置你的头像和昵称</text>
        </view>

        <form class="profile-form" @submit.prevent="saveProfile">
          <view class="avatar-row">
            <text class="avatar-label">头像</text>
            <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
              <image class="avatar-img" :src="tempAvatar || defaultAvatar" mode="aspectFill" />
              <text class="avatar-hint">点击选择</text>
            </button>
          </view>

          <view class="nickname-row">
            <text class="nickname-label">昵称</text>
            <input
              type="nickname"
              v-model="tempNickname"
              class="nickname-input"
              placeholder="请输入昵称"
              @blur="onNicknameBlur"
            />
          </view>

          <button class="save-btn" form-type="submit" :disabled="saving">
            {{ saving ? '保存中...' : '进入应用' }}
          </button>
        </form>

        <view class="skip-wrap" @tap="skipProfile">
          <text class="skip-text">跳过，稍后设置</text>
        </view>
      </view>
      <!-- #endif -->
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/api/auth';
import { uploadWxCloudAvatar } from '@/utils/request';
import { makeSvgIcon } from '@/utils/icons';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const authStore = useAuthStore();
const loading = ref(false);
const saving = ref(false);
const step = ref<'login' | 'profile'>('login');
const agreementAccepted = ref(false);
const tempAvatar = ref('');
const tempNickname = ref('');
const defaultAvatar = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

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

function onMaskTap() {}

function goPhoneLogin() {
  emit('close');
  uni.navigateTo({ url: '/pages/login/index' });
}

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

async function wxLogin() {
  if (!ensureAgreementAccepted()) return;
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

    if (!result.user.nickname && !result.user.avatarUrl) {
      step.value = 'profile';
    } else {
      emit('success');
    }
  } catch (e: any) {
    uni.showToast({ title: e?.message || '微信登录失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function onChooseAvatar(e: any) {
  tempAvatar.value = e.detail.avatarUrl;
}

function onNicknameBlur(e: any) {
  tempNickname.value = e.detail.value || '';
}

/** chooseAvatar 返回本地临时路径或 https 临时 URL，均须上传后再存库，不可长期直接使用 */
async function resolveAvatarToLocalFile(avatarSrc: string): Promise<string> {
  if (avatarSrc.startsWith('http://') || avatarSrc.startsWith('https://')) {
    const dl = await new Promise<UniApp.DownloadSuccessData>((resolve, reject) => {
      uni.downloadFile({
        url: avatarSrc,
        success: resolve,
        fail: (err) => {
          console.error(
            '[LoginModal] downloadFile FAIL',
            JSON.stringify({ errMsg: (err as UniApp.GeneralCallbackResult)?.errMsg, filePath: avatarSrc })
          );
          reject(err);
        },
      });
    });
    if (dl.statusCode !== 200 || !dl.tempFilePath) {
      console.error(
        '[LoginModal] downloadFile bad response',
        JSON.stringify({ statusCode: dl.statusCode, filePath: avatarSrc })
      );
      throw new Error('头像下载失败');
    }
    return dl.tempFilePath;
  }
  return avatarSrc;
}

async function saveProfile() {
  saving.value = true;
  try {
    const updateData: { nickname?: string; avatarUrl?: string } = {};
    const nick = tempNickname.value?.trim();
    if (nick) updateData.nickname = nick;

    if (tempAvatar.value) {
      let filePath = await resolveAvatarToLocalFile(tempAvatar.value);
      try {
        const cr = await new Promise<{ tempFilePath: string }>((resolve, reject) => {
          uni.compressImage({
            src: filePath,
            quality: 68,
            success: resolve,
            fail: reject,
          });
        });
        filePath = cr.tempFilePath;
      } catch {
        // 使用已解析的本地路径
      }
      const fileID = await uploadWxCloudAvatar(filePath);
      if (fileID) updateData.avatarUrl = fileID;
    }

    if (Object.keys(updateData).length > 0) {
      const updated = await authApi.postUserProfile(updateData);
      authStore.user = { ...authStore.user!, ...updated };
    }
    emit('success');
  } catch (e: any) {
    console.error(
      '[LoginModal saveProfile] FAIL',
      JSON.stringify({
        message: e?.message,
        errMsg: e?.errMsg,
        tempAvatarSample: (tempAvatar.value || '').slice(0, 120),
      })
    );
    uni.showToast({ title: e?.message || '保存失败', icon: 'none' });
  } finally {
    saving.value = false;
  }
}

function skipProfile() {
  emit('success');
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

.wx-btn[disabled] { opacity: 0.6; }
.wx-btn::after { border: none; }

.wx-icon-wrap { width: 44rpx; height: 44rpx; }
.wx-icon { width: 44rpx; height: 44rpx; }

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

.phone-btn {
  width: 100%;
  height: 96rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 48rpx;
  background: #fff;
  color: #1e1e1e;
  font-size: 32rpx;
  font-weight: 600;
  letter-spacing: 2rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.phone-btn::after { border: none; }

.agreement-row {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 12rpx;
  margin-top: 32rpx;
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

/* 步骤2: 完善资料 */
.profile-form {
  margin-bottom: 40rpx;
}

.avatar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 36rpx;
}

.avatar-label {
  font-size: 30rpx;
  font-weight: 600;
  color: #1e1e1e;
}

.avatar-btn {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  line-height: normal;
}

.avatar-btn::after { border: none; }

.avatar-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: #f0f0f0;
}

.avatar-hint {
  font-size: 24rpx;
  color: #98a2b3;
}

.nickname-row {
  margin-bottom: 16rpx;
}

.nickname-label {
  display: block;
  margin-bottom: 12rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: #1e1e1e;
}

.nickname-input {
  width: 100%;
  height: 88rpx;
  padding: 0 28rpx;
  border-radius: 20rpx;
  background: #f7f8fa;
  font-size: 30rpx;
  color: #1e1e1e;
  box-sizing: border-box;
}

.save-btn {
  width: 100%;
  height: 92rpx;
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

.save-btn[disabled] { opacity: 0.6; }
.save-btn::after { border: none; }

.skip-wrap {
  margin-top: 24rpx;
  text-align: center;
}

.skip-text {
  font-size: 26rpx;
  color: #98a2b3;
}
</style>
