<template>
  <PageShell class="account-shell">
    <view class="nav">
      <view class="nav-back" @tap="goBack">
        <view class="back-glass" />
        <image class="back-icon" :src="backIcon" />
      </view>
      <text class="nav-title">账号与安全</text>
      <view class="nav-placeholder" />
    </view>

    <view :class="['profile-card', `profile-card--${memberTone}`]" @tap="openProfileForm">
      <view class="card-lines" />
      <image v-if="avatarUrl" class="avatar" :src="avatarUrl" mode="aspectFill" />
      <view v-else :class="['avatar-placeholder', `avatar-placeholder--${memberTone}`]">
        <text>{{ firstNameChar }}</text>
      </view>
      <view class="profile-info">
        <view class="name-row">
          <text class="nickname">{{ profile?.nickname || authStore.user?.nickname || '用户' }}</text>
          <text :class="['member-badge', `member-badge--${memberTone}`]">{{ memberBadgeText }}</text>
        </view>
        <text class="member-line">{{ memberLineText }}</text>
      </view>
      <view :class="['member-pill', `member-pill--${memberTone}`]" @tap.stop="goMembership">
        <text>{{ memberActionText }}</text>
        <text class="member-pill-arrow">›</text>
      </view>
    </view>

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
            <button class="code-btn" :disabled="sendingCode" @tap="sendPhoneCode">{{ sendingCode ? '发送中' : '获取验证码' }}</button>
          </view>
          <button class="primary-btn" :disabled="submitting" @tap="submitPhone">保存</button>
        </view>

        <view v-if="activeForm === 'email'" class="form">
          <input class="input" v-model="emailForm.email" type="text" placeholder="请输入邮箱" />
          <view class="code-row">
            <input class="input code-input" v-model="emailForm.code" type="number" maxlength="6" placeholder="验证码" />
            <button class="code-btn" :disabled="sendingCode" @tap="sendEmailCode">{{ sendingCode ? '发送中' : '获取验证码' }}</button>
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
import { computed, onMounted, reactive, ref } from 'vue';
import PageShell from '@/components/PageShell.vue';
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

const authStore = useAuthStore();
const financeStore = useFinanceStore();
const profile = ref<AccountProfile | null>(null);
const membership = ref<MembershipStatus | null>(null);
const activeForm = ref<'profile' | 'phone' | 'email' | 'password' | ''>('');
const sendingCode = ref(false);
const submitting = ref(false);

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
const memberTone = computed(() => {
  if (membership.value?.level === 'premium') return 'premium';
  if (membership.value?.level === 'pro') return 'pro';
  return 'free';
});
const memberBadgeText = computed(() => {
  if (memberTone.value === 'premium') return '尊享';
  if (memberTone.value === 'pro') return 'Pro';
  return '免费';
});
const memberLineText = computed(() => {
  if (!membership.value || membership.value.level === 'free') return '免费会员 | 开通后解锁更多 AI 能力';
  if (membership.value.level === 'premium' && !membership.value.expireAt) return '永久有效 | 尊享会员权益';
  if (membership.value.expireAt) return `${membership.value.expireAt.substring(0, 10)} 到期 | 立即续费`;
  return '会员权益已生效';
});
const memberActionText = computed(() => (membership.value?.level === 'free' ? '开通会员' : '会员中心'));
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
  if (!phoneForm.phone) return uni.showToast({ title: '请输入手机号', icon: 'none' });
  sendingCode.value = true;
  try {
    await accountApi.sendPhoneCode(phoneForm.phone);
    uni.showToast({ title: '验证码已发送', icon: 'success' });
  } catch (error: any) {
    uni.showToast({ title: error?.message || '发送失败', icon: 'none' });
  } finally {
    sendingCode.value = false;
  }
}

async function sendEmailCode() {
  if (!emailForm.email) return uni.showToast({ title: '请输入邮箱', icon: 'none' });
  sendingCode.value = true;
  try {
    await accountApi.sendEmailCode(emailForm.email);
    uni.showToast({ title: '验证码已发送', icon: 'success' });
  } catch (error: any) {
    uni.showToast({ title: error?.message || '发送失败', icon: 'none' });
  } finally {
    sendingCode.value = false;
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

onMounted(loadProfile);
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
.profile-card {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 24rpx;
  min-height: 180rpx;
  padding: 34rpx 28rpx;
  border-radius: 28rpx;
  box-shadow: 0 14rpx 42rpx rgba(78, 66, 55, 0.08);
}
.profile-card--free {
  background:
    linear-gradient(110deg, rgba(255, 247, 238, 0.96) 0%, rgba(255, 231, 210, 0.88) 100%);
}
.profile-card--pro {
  background:
    linear-gradient(110deg, rgba(231, 250, 246, 0.96) 0%, rgba(207, 238, 255, 0.9) 100%);
  box-shadow: 0 14rpx 42rpx rgba(31, 142, 132, 0.1);
}
.profile-card--premium {
  background:
    linear-gradient(110deg, #242229 0%, #111115 58%, #31281f 100%);
  box-shadow: 0 18rpx 48rpx rgba(17, 17, 21, 0.2);
}
.card-lines {
  position: absolute;
  top: -80rpx;
  left: 255rpx;
  width: 260rpx;
  height: 260rpx;
  border: 2rpx solid rgba(200, 156, 118, 0.14);
  border-radius: 60rpx;
  box-shadow:
    0 0 0 12rpx rgba(200, 156, 118, 0.08),
    0 0 0 24rpx rgba(200, 156, 118, 0.06),
    0 0 0 36rpx rgba(200, 156, 118, 0.04);
  transform: rotate(45deg);
}
.profile-card--premium .card-lines {
  border-color: rgba(242, 199, 132, 0.16);
  box-shadow:
    0 0 0 12rpx rgba(242, 199, 132, 0.1),
    0 0 0 24rpx rgba(242, 199, 132, 0.06),
    0 0 0 36rpx rgba(242, 199, 132, 0.04);
}
.avatar, .avatar-placeholder {
  position: relative;
  z-index: 1;
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  flex-shrink: 0;
  border: 4rpx solid rgba(255, 255, 255, 0.62);
}
.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00d4c8, #7cbcff);
  color: #fff;
  font-size: 36rpx;
  font-weight: 800;
}
.avatar-placeholder--premium {
  background: linear-gradient(135deg, #f3d28d, #9b7438);
  color: #1c1712;
}
.profile-info {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 0;
}
.nickname {
  max-width: 280rpx;
  font-size: 36rpx;
  font-weight: 800;
  color: #1e1e1e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.profile-card--premium .nickname {
  color: #f9e3bb;
}
.member-badge {
  flex-shrink: 0;
  height: 36rpx;
  line-height: 34rpx;
  padding: 0 14rpx;
  border-radius: 10rpx;
  font-size: 22rpx;
  font-weight: 700;
  box-sizing: border-box;
}
.member-badge--free {
  color: #9b6f4d;
  border: 2rpx solid rgba(155, 111, 77, 0.32);
  background: rgba(255, 255, 255, 0.32);
}
.member-badge--pro {
  color: #137d73;
  border: 2rpx solid rgba(19, 125, 115, 0.28);
  background: rgba(255, 255, 255, 0.38);
}
.member-badge--premium {
  color: #24170b;
  background: linear-gradient(135deg, #ffe7ad, #b88943);
}
.member-line {
  max-width: 420rpx;
  font-size: 27rpx;
  color: #2b2724;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.profile-card--pro .member-line {
  color: #245651;
}
.profile-card--premium .member-line {
  color: rgba(255, 228, 183, 0.78);
}
.member-pill {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  height: 60rpx;
  padding: 0 22rpx;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 25rpx;
  font-weight: 700;
}
.member-pill--free {
  color: #6f4b31;
  background: rgba(255, 255, 255, 0.6);
}
.member-pill--pro {
  color: #0e6f66;
  background: rgba(255, 255, 255, 0.62);
}
.member-pill--premium {
  color: #ffe4ad;
  background: rgba(255, 255, 255, 0.1);
  border: 1rpx solid rgba(255, 224, 170, 0.22);
}
.member-pill-arrow {
  font-size: 32rpx;
  line-height: 1;
}
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
  width: 210rpx;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 18rpx;
  background: #e8f7f4;
  color: #168f82;
  font-size: 25rpx;
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
