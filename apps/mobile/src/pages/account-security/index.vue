<template>
  <PageShell class="account-shell">
    <view class="nav">
      <view class="nav-back" @tap="goBack">
        <view class="back-glass" />
        <image class="back-icon" :src="backIcon" />
      </view>
      <text class="nav-title">账户设置</text>
      <view class="nav-placeholder" />
    </view>

    <MemberProfileCard
      :level="membership?.level || 'free'"
      :title="profile?.nickname || authStore.user?.nickname || '用户'"
      :avatar-url="avatarUrl"
      :expire-at="membership?.expireAt || null"
      :action-text="memberActionText"
      @tap="openProfileForm"
      @action="goMembership"
    />

    <view class="section-title">账号绑定</view>
    <view class="ios-card">
      <view class="row">
        <view class="row-main">
          <text class="row-icon">💬</text>
          <text class="row-label">微信账号</text>
        </view>
        <text class="status ok">{{ profile?.wechatBound ? '已绑定' : '未绑定' }}</text>
      </view>
      <view class="row" @tap="openPhoneForm">
        <view class="row-main">
          <text class="row-icon">📱</text>
          <text class="row-label">手机号</text>
        </view>
        <view class="row-right">
          <text class="status">{{ maskedPhone }}</text>
          <text class="arrow">›</text>
        </view>
      </view>
      <view class="row" @tap="openEmailForm">
        <view class="row-main">
          <text class="row-icon">✉️</text>
          <text class="row-label">邮箱</text>
        </view>
        <view class="row-right">
          <text class="status">{{ maskedEmail }}</text>
          <text class="arrow">›</text>
        </view>
      </view>
      <view class="row" @tap="openPasswordForm">
        <view class="row-main">
          <text class="row-icon">🔑</text>
          <text class="row-label">登录密码</text>
        </view>
        <view class="row-right">
          <text class="status">{{ profile?.hasPassword ? '已设置' : '未设置' }}</text>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>

    <view class="section-title">操作</view>
    <view class="ios-card">
      <view v-if="authStore.isLoggedIn" class="row">
        <text class="action-text">智能问候</text>
        <switch :checked="smartGreetingOn" color="#00d4c8" @change="onSmartGreetingChange" />
      </view>
      <view class="row">
        <view class="action-main">
          <text class="action-text">语音播放回复</text>
          <text class="action-desc">开启后，AI米粒回复时可自动播放语音</text>
        </view>
        <switch :checked="voiceReplyEnabled" color="#00d4c8" @change="onVoiceReplyChange" />
      </view>
      <view v-if="authStore.isLoggedIn" class="row" @tap="openDefaultLifeSpacePicker">
        <view class="action-main">
          <text class="action-text">AI米粒默认空间</text>
          <text class="action-desc">进入 AI米粒页面时默认使用哪个生活空间</text>
        </view>
        <view class="row-right">
          <text class="status">{{ defaultLifeSpaceLabel }}</text>
          <text class="arrow">›</text>
        </view>
      </view>
      <view class="row" @tap="goCardSettings">
        <text class="action-text">概览卡片管理</text>
        <text class="arrow">›</text>
      </view>
      <view class="row" @tap="openPhoneForm">
        <text class="action-text">{{ profile?.phone ? '更换手机号' : '绑定手机号' }}</text>
        <text class="arrow">›</text>
      </view>
      <view class="row" @tap="openEmailForm">
        <text class="action-text">{{ profile?.email ? '修改邮箱' : '绑定邮箱' }}</text>
        <text class="arrow">›</text>
      </view>
      <view class="row" @tap="openPasswordForm">
        <text class="action-text">{{ profile?.hasPassword ? '修改密码' : '设置登录密码' }}</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <view class="ios-card danger-card">
      <view class="row" @tap="handleLogout">
        <text class="danger-soft">退出登录</text>
      </view>
      <view class="row" @tap="handleDeleteAccount">
        <text class="danger">注销账号</text>
      </view>
    </view>

    <view v-if="activeForm" class="modal-mask" @tap="closeForm">
      <view class="modal-panel" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ sheetTitle }}</text>
          <text class="modal-close" @tap="closeForm">×</text>
        </view>

        <view v-if="activeForm === 'profile'" class="form">
          <button class="profile-avatar-btn" open-type="chooseAvatar" @chooseavatar="onProfileAvatarChoose">
            <image v-if="profileForm.avatarPreview" class="profile-avatar-preview" :src="profileForm.avatarPreview" mode="aspectFill" />
            <view v-else class="profile-avatar-preview profile-avatar-empty">
              <text>{{ firstNameChar }}</text>
            </view>
            <text class="profile-avatar-tip">点击更换头像</text>
          </button>
          <input class="input" v-model="profileForm.nickname" type="nickname" placeholder="请输入昵称" />
          <button class="primary-btn" :disabled="submitting" @tap="submitProfile">保存资料</button>
        </view>

        <view v-if="activeForm === 'phone'" class="form">
          <input class="input" v-model="phoneForm.phone" type="number" maxlength="11" placeholder="请输入手机号" />
          <view class="code-row">
            <input class="input code-input" v-model="phoneForm.code" type="number" maxlength="6" placeholder="验证码" />
            <button class="code-btn" :disabled="phoneCodeDisabled" @tap="sendPhoneCode">{{ phoneCodeText }}</button>
          </view>
          <button class="primary-btn" :disabled="submitting" @tap="submitPhone">保存</button>
        </view>

        <view v-if="activeForm === 'email'" class="form">
          <input class="input" v-model="emailForm.email" type="text" placeholder="请输入邮箱" />
          <view class="code-row">
            <input class="input code-input" v-model="emailForm.code" type="number" maxlength="6" placeholder="验证码" />
            <button class="code-btn" :disabled="emailCodeDisabled" @tap="sendEmailCode">{{ emailCodeText }}</button>
          </view>
          <button class="primary-btn" :disabled="submitting" @tap="submitEmail">保存</button>
        </view>

        <view v-if="activeForm === 'password'" class="form">
          <input v-if="profile?.hasPassword" class="input" v-model="passwordForm.oldPassword" password placeholder="旧密码" />
          <input class="input" v-model="passwordForm.password" password :placeholder="profile?.hasPassword ? '新密码，至少 8 位' : '登录密码，至少 8 位'" />
          <input class="input" v-model="passwordForm.confirmPassword" password placeholder="再次输入密码" />
          <button class="primary-btn" :disabled="submitting" @tap="submitPassword">{{ profile?.hasPassword ? '修改密码' : '设置密码' }}</button>
        </view>
      </view>
    </view>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import PageShell from '@/components/PageShell.vue';
import MemberProfileCard from '@/components/MemberProfileCard.vue';
import { backIcon } from '@/utils/icons';
import { getApiBase } from '@/utils/request';
import { uploadWxCloudAvatar } from '@/utils/request';
import { ensureLoggedIn } from '@/utils/ensure-logged-in';
import { useAuthStore } from '@/stores/auth';
import { useFinanceStore } from '@/stores/finance';
import { accountApi, type AccountProfile } from '@/api/account';
import { authApi } from '@/api/auth';
import { membershipApi } from '@/api/membership';
import type { MembershipStatus } from '@/types/domain';
import { VERIFICATION_CODE_RESEND_SECONDS } from '@/constants/verification-code';
import { getVoiceReplyEnabled, setVoiceReplyEnabled } from '@/utils/tts';
import { lifeSpaceApi } from '@/api/life-spaces';
import type { LifeSpace } from '@/types/domain';
import {
  clearDefaultLifeSpaceId,
  resolveDefaultLifeSpaceLabel,
  setDefaultLifeSpaceId,
} from '@/utils/life-space-selection';

const authStore = useAuthStore();
const financeStore = useFinanceStore();
const profile = ref<AccountProfile | null>(null);
const membership = ref<MembershipStatus | null>(null);
const activeForm = ref<'profile' | 'phone' | 'email' | 'password' | ''>('');
const sendingPhoneCode = ref(false);
const sendingEmailCode = ref(false);
const phoneCountdown = ref(0);
const emailCountdown = ref(0);
const submitting = ref(false);
let phoneCountdownTimer: ReturnType<typeof setInterval> | null = null;
let emailCountdownTimer: ReturnType<typeof setInterval> | null = null;

const phoneForm = reactive({ phone: '', code: '' });
const emailForm = reactive({ email: '', code: '' });
const passwordForm = reactive({ oldPassword: '', password: '', confirmPassword: '' });
const profileForm = reactive({ nickname: '', avatarPreview: '', avatarFilePath: '' });

const avatarUrl = computed(() => {
  const url = profile.value?.avatarUrl || authStore.user?.avatarUrl || '';
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('cloud://')) return url;
  return `${getApiBase().replace('/api', '')}${url}`;
});
const firstNameChar = computed(() => (profile.value?.nickname || authStore.user?.nickname || '用').slice(0, 1));
const maskedPhone = computed(() => (profile.value?.phone ? `${profile.value.phone.slice(0, 3)}****${profile.value.phone.slice(-4)}` : '未绑定'));
const maskedEmail = computed(() => {
  const email = profile.value?.email;
  if (!email) return '未绑定';
  const [name, domain] = email.split('@');
  if (!domain) return email;
  return `${name.slice(0, 1)}***@${domain}`;
});
const memberActionText = computed(() => (membership.value?.level === 'free' ? '开通会员' : '会员中心'));
const phoneCodeDisabled = computed(() => sendingPhoneCode.value || phoneCountdown.value > 0);
const emailCodeDisabled = computed(() => sendingEmailCode.value || emailCountdown.value > 0);
const phoneCodeText = computed(() => {
  if (phoneCountdown.value > 0) return `${phoneCountdown.value}秒后可重发`;
  if (sendingPhoneCode.value) return '发送中…';
  return '获取验证码';
});
const emailCodeText = computed(() => {
  if (emailCountdown.value > 0) return `${emailCountdown.value}秒后可重发`;
  if (sendingEmailCode.value) return '发送中…';
  return '获取验证码';
});
const smartGreetingOn = computed(() => authStore.user?.smartGreetingEnabled !== false);
const voiceReplyEnabled = ref(false);
const lifeSpacesForDefault = ref<LifeSpace[]>([]);
const defaultLifeSpaceLabel = computed(() => resolveDefaultLifeSpaceLabel(lifeSpacesForDefault.value));

async function onSmartGreetingChange(e: any) {
  if (!authStore.isLoggedIn) return;
  const val = Boolean(e.detail?.value);
  try {
    const updated = await authApi.updateProfile({ smartGreetingEnabled: val });
    authStore.user = updated;
    uni.showToast({ title: val ? '已开启智能问候' : '已关闭智能问候', icon: 'none' });
  } catch {
    uni.showToast({ title: '设置失败', icon: 'none' });
  }
}

function onVoiceReplyChange(e: any) {
  const val = Boolean(e.detail?.value);
  voiceReplyEnabled.value = val;
  setVoiceReplyEnabled(val);
  uni.showToast({ title: val ? '已开启语音播放' : '已关闭语音播放', icon: 'none' });
}

const sheetTitle = computed(() => {
  if (activeForm.value === 'profile') return '编辑个人资料';
  if (activeForm.value === 'phone') return profile.value?.phone ? '更换手机号' : '绑定手机号';
  if (activeForm.value === 'email') return profile.value?.email ? '修改邮箱' : '绑定邮箱';
  return profile.value?.hasPassword ? '修改密码' : '设置登录密码';
});

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) uni.navigateBack();
  else uni.switchTab({ url: '/pages/profile/index' });
}

async function loadProfile() {
  if (!ensureLoggedIn()) return;
  try {
    await authStore.loadProfile();
  } catch {
    /* ignore */
  }
  const [accountProfile, membershipStatus] = await Promise.all([
    accountApi.profile(),
    membershipApi.getStatus().catch(() => null),
  ]);
  profile.value = accountProfile;
  membership.value = membershipStatus;
}

function goMembership() {
  uni.navigateTo({ url: '/pages/membership/index' });
}

function goCardSettings() {
  uni.navigateTo({ url: '/pages/card-settings/index' });
}

async function loadLifeSpacesForDefault() {
  if (!authStore.isLoggedIn) {
    lifeSpacesForDefault.value = [];
    return;
  }
  lifeSpacesForDefault.value = await lifeSpaceApi.list().catch(() => []);
}

function openDefaultLifeSpacePicker() {
  const spaces = lifeSpacesForDefault.value;
  if (!spaces.length) {
    uni.showToast({ title: '暂无生活空间', icon: 'none' });
    return;
  }
  uni.showActionSheet({
    itemList: [...spaces.map((s) => s.name), '清除默认（沿用上次选择）'],
    success: (res) => {
      if (res.tapIndex === spaces.length) {
        clearDefaultLifeSpaceId();
        uni.showToast({ title: '已清除默认空间', icon: 'none' });
        return;
      }
      const picked = spaces[res.tapIndex];
      if (picked) {
        setDefaultLifeSpaceId(picked.id);
        uni.showToast({ title: `已设为 ${picked.name}`, icon: 'success' });
      }
    },
  });
}

function openProfileForm() {
  profileForm.nickname = profile.value?.nickname || authStore.user?.nickname || '';
  profileForm.avatarPreview = avatarUrl.value;
  profileForm.avatarFilePath = '';
  activeForm.value = 'profile';
}

function openPhoneForm() {
  phoneForm.phone = profile.value?.phone || '';
  phoneForm.code = '';
  activeForm.value = 'phone';
}

function openEmailForm() {
  emailForm.email = profile.value?.email || '';
  emailForm.code = '';
  activeForm.value = 'email';
}

function openPasswordForm() {
  passwordForm.oldPassword = '';
  passwordForm.password = '';
  passwordForm.confirmPassword = '';
  activeForm.value = 'password';
}

function closeForm() {
  activeForm.value = '';
}

function startCountdown(target: 'phone' | 'email') {
  const countdown = target === 'phone' ? phoneCountdown : emailCountdown;
  const currentTimer = target === 'phone' ? phoneCountdownTimer : emailCountdownTimer;
  if (currentTimer) clearInterval(currentTimer);
  countdown.value = VERIFICATION_CODE_RESEND_SECONDS;
  const timer = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      clearInterval(timer);
      if (target === 'phone') phoneCountdownTimer = null;
      else emailCountdownTimer = null;
    }
  }, 1000);
  if (target === 'phone') phoneCountdownTimer = timer;
  else emailCountdownTimer = timer;
}

function onProfileAvatarChoose(e: any) {
  const avatar = e?.detail?.avatarUrl || '';
  if (!avatar) return;
  profileForm.avatarPreview = avatar;
  profileForm.avatarFilePath = avatar;
}

async function submitProfile() {
  const nickname = profileForm.nickname.trim();
  if (!nickname) return uni.showToast({ title: '请输入昵称', icon: 'none' });

  submitting.value = true;
  try {
    let uploadedAvatar = '';
    if (profileForm.avatarFilePath) {
      uploadedAvatar = await uploadWxCloudAvatar(profileForm.avatarFilePath);
    }
    const updated = await authApi.updateProfile({
      nickname,
      ...(uploadedAvatar ? { avatarUrl: uploadedAvatar } : {}),
    });
    authStore.user = updated;
    profile.value = profile.value
      ? { ...profile.value, nickname: updated.nickname, avatarUrl: updated.avatarUrl }
      : await accountApi.profile();
    closeForm();
    uni.showToast({ title: '保存成功', icon: 'success' });
  } catch (error: any) {
    uni.showToast({ title: error?.message || '保存失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}

async function sendPhoneCode() {
  if (phoneCodeDisabled.value) return;
  const p = phoneForm.phone.trim();
  if (!/^\d{11}$/.test(p)) {
    uni.showToast({ title: '请输入11位手机号', icon: 'none' });
    return;
  }
  sendingPhoneCode.value = true;
  try {
    await accountApi.sendPhoneCode(p);
    startCountdown('phone');
    uni.showToast({ title: '验证码已发送', icon: 'success' });
  } catch (error: any) {
    uni.showToast({ title: error?.message || '发送失败', icon: 'none' });
  } finally {
    sendingPhoneCode.value = false;
  }
}

async function sendEmailCode() {
  if (emailCodeDisabled.value) return;
  const em = emailForm.email.trim();
  if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
    uni.showToast({ title: '请输入有效邮箱', icon: 'none' });
    return;
  }
  sendingEmailCode.value = true;
  try {
    await accountApi.sendEmailCode(em);
    startCountdown('email');
    uni.showToast({ title: '验证码已发送', icon: 'success' });
  } catch (error: any) {
    uni.showToast({ title: error?.message || '发送失败', icon: 'none' });
  } finally {
    sendingEmailCode.value = false;
  }
}

async function submitPhone() {
  submitting.value = true;
  try {
    profile.value = await accountApi.bindPhone(phoneForm.phone, phoneForm.code);
    authStore.user = authStore.user ? { ...authStore.user, phone: profile.value.phone } : authStore.user;
    closeForm();
    uni.showToast({ title: '手机号已绑定', icon: 'success' });
  } catch (error: any) {
    uni.showToast({ title: error?.message || '保存失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}

async function submitEmail() {
  submitting.value = true;
  try {
    profile.value = await accountApi.bindEmail(emailForm.email, emailForm.code);
    authStore.user = authStore.user ? { ...authStore.user, email: profile.value.email } : authStore.user;
    closeForm();
    uni.showToast({ title: '邮箱已绑定', icon: 'success' });
  } catch (error: any) {
    uni.showToast({ title: error?.message || '保存失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}

async function submitPassword() {
  submitting.value = true;
  try {
    if (profile.value?.hasPassword) {
      await accountApi.changePassword(passwordForm.oldPassword, passwordForm.password, passwordForm.confirmPassword);
    } else {
      await accountApi.setPassword(passwordForm.password, passwordForm.confirmPassword);
    }
    closeForm();
    await loadProfile();
    uni.showToast({ title: '密码已保存', icon: 'success' });
  } catch (error: any) {
    uni.showToast({ title: error?.message || '保存失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}

async function handleLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    async success(res) {
      if (!res.confirm) return;
      try {
        await accountApi.logout();
      } catch {}
      authStore.logout();
      financeStore.reset();
      uni.switchTab({ url: '/pages/profile/index' });
    },
  });
}

async function handleDeleteAccount() {
  uni.showModal({
    title: '注销账号',
    content: '注销后账号资料、账单和会员记录将删除且不可恢复，请再次确认。',
    confirmText: '继续注销',
    confirmColor: '#d92d20',
    success(res) {
      if (!res.confirm) return;
      uni.showModal({
        title: '最终确认',
        content: '请确认永久注销当前账号。',
        confirmText: '永久注销',
        confirmColor: '#d92d20',
        async success(second) {
          if (!second.confirm) return;
          try {
            await accountApi.deleteAccount();
            authStore.logout();
            financeStore.reset();
            uni.showToast({ title: '账号已注销', icon: 'success' });
            setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 600);
          } catch (error: any) {
            uni.showToast({ title: error?.message || '注销失败', icon: 'none' });
          }
        },
      });
    },
  });
}

onMounted(() => {
  voiceReplyEnabled.value = getVoiceReplyEnabled();
  loadProfile();
  void loadLifeSpacesForDefault();
});
onShow(() => {
  voiceReplyEnabled.value = getVoiceReplyEnabled();
  loadProfile();
  void loadLifeSpacesForDefault();
});

onUnmounted(() => {
  if (phoneCountdownTimer) clearInterval(phoneCountdownTimer);
  if (emailCountdownTimer) clearInterval(emailCountdownTimer);
});
</script>

<style scoped>
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 18rpx;
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
  inset: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  border: 1rpx solid rgba(255, 255, 255, 0.55);
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
  font-weight: 750;
  color: #1e1e1e;
}
.nav-placeholder { width: 60rpx; }
.section-title {
  margin: 28rpx 8rpx 12rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: #66736f;
}
.ios-card {
  overflow: hidden;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.82);
}
.row {
  min-height: 96rpx;
  padding: 0 28rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid rgba(229, 233, 231, 0.9);
}
.row:last-child { border-bottom: none; }
.row-main, .row-right {
  display: flex;
  align-items: center;
  gap: 14rpx;
}
.row-icon {
  width: 42rpx;
  font-size: 30rpx;
}
.row-label, .action-text {
  font-size: 29rpx;
  color: #1e1e1e;
}
.action-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.action-desc {
  max-width: 460rpx;
  font-size: 23rpx;
  line-height: 1.35;
  color: #8b9490;
}
.status {
  max-width: 360rpx;
  font-size: 27rpx;
  color: #8b9490;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.status.ok { color: #2eb8a0; }
.arrow {
  color: #b7bfbc;
  font-size: 38rpx;
}
.danger-card { margin-top: 28rpx; }
.danger-soft, .danger {
  width: 100%;
  text-align: center;
  font-size: 29rpx;
}
.danger-soft { color: #d97706; }
.danger { color: #d92d20; }
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  background: rgba(0, 0, 0, 0.42);
  box-sizing: border-box;
}
.modal-panel {
  width: 100%;
  max-width: 680rpx;
  max-height: 72vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 30rpx 30rpx 34rpx;
  border-radius: 28rpx;
  background: #fff;
  box-sizing: border-box;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 26rpx;
}
.modal-title {
  font-size: 34rpx;
  font-weight: 750;
  color: #1e1e1e;
}
.modal-close {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  text-align: center;
  line-height: 52rpx;
  background: #f3f5f4;
  color: #66736f;
  font-size: 38rpx;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}
.profile-avatar-btn {
  width: 100%;
  padding: 0;
  margin: 0 0 6rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  background: transparent;
  line-height: normal;
}
.profile-avatar-preview {
  width: 136rpx;
  height: 136rpx;
  border-radius: 50%;
  background: #f0f3f2;
}
.profile-avatar-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00d4c8, #7cbcff);
  color: #fff;
  font-size: 42rpx;
  font-weight: 800;
}
.profile-avatar-tip {
  font-size: 24rpx;
  color: #7b8783;
}
.input {
  height: 88rpx;
  padding: 0 24rpx;
  border-radius: 18rpx;
  background: #f6f8f7;
  font-size: 29rpx;
  color: #1e1e1e;
  box-sizing: border-box;
}
.code-row {
  display: flex;
  gap: 16rpx;
}
.code-input { flex: 1; }
.code-btn {
  width: 240rpx;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 18rpx;
  background: #e8f7f4;
  color: #168f82;
  font-size: 25rpx;
}
.code-btn[disabled] {
  background: #edf1ef;
  color: #98a2b3;
}
.primary-btn {
  margin-top: 8rpx;
  width: 100%;
  height: 90rpx;
  line-height: 90rpx;
  border-radius: 45rpx;
  background: linear-gradient(135deg, #00d4c8, #00b8a9);
  color: #fff;
  font-size: 31rpx;
  font-weight: 750;
}
button::after { border: none; }
.account-shell :deep(.page-body) {
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 44rpx);
}
</style>
