<template>
  <PageShell>
    <view class="topbar">
      <text class="page-title">个人中心</text>
    </view>

    <!-- 编辑弹窗 -->
    <view v-if="showEditor" class="editor-mask" @tap="showEditor = false">
      <view class="editor-sheet" @tap.stop>
        <text class="editor-title">编辑个人资料</text>

        <!-- 头像预览 + 更换 -->
        <button class="editor-avatar-wrap" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
          <image v-if="previewAvatar" class="editor-avatar" :src="previewAvatar" mode="aspectFill" />
          <view v-else class="editor-avatar editor-avatar-placeholder">
            <view class="avatar-face-sm">
              <view class="av-eye l" /><view class="av-eye r" />
              <view class="av-mouth" />
            </view>
          </view>
          <view class="editor-avatar-badge">
            <text>📷</text>
          </view>
        </button>
        <text class="editor-avatar-hint">点击更换头像</text>

        <!-- 昵称输入 -->
        <view class="editor-field">
          <text class="editor-label">昵称</text>
          <input class="editor-input" v-model="editName" placeholder="请输入昵称" maxlength="20" />
        </view>

        <!-- 保存 -->
        <button class="editor-save-btn" :disabled="saving" @tap="saveProfile">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </view>
    </view>

    <view class="profile-member-card-wrap">
      <MemberProfileCard
        :level="memberStatus?.level || 'free'"
        :title="userName"
        :avatar-url="avatarUrl"
        :expire-at="memberStatus?.expireAt || null"
        :action-text="memberStatus?.isPro ? '会员中心' : '开通会员'"
        @tap="onUserSectionTap"
        @action="goMembership"
      />
    </view>

    <!-- 菜单列表 -->
    <view class="profile-menu-card-wrap">
      <MoonaCard v-if="authStore.isLoggedIn" class="menu-card settings-pref-card">
        <view class="menu-item menu-item--toggle">
          <view class="menu-left menu-left--stack">
            <text class="menu-icon">✨</text>
            <view class="menu-text-col">
              <text class="menu-label">智能问候</text>
              <text class="menu-sub">关闭后，AI 米粒页仅使用本地默认文案</text>
            </view>
          </view>
          <switch :checked="smartGreetingOn" color="#00d4c8" @change="onSmartGreetingChange" />
        </view>
      </MoonaCard>

      <MoonaCard class="menu-card">
        <view v-for="(group, gIdx) in menuGroups" :key="gIdx">
          <view v-for="(item, idx) in group" :key="item.label" :class="['menu-item', { bordered: idx < group.length - 1 }]" @tap="onMenuTap(item)">
            <view class="menu-left">
              <text class="menu-icon">{{ item.icon }}</text>
              <text class="menu-label">{{ item.label }}</text>
            </view>
            <text class="menu-arrow">›</text>
          </view>
          <view v-if="gIdx < menuGroups.length - 1" class="menu-divider" />
        </view>
      </MoonaCard>
    </view>

    <!-- 退出 -->
    <view v-if="authStore.isLoggedIn" class="logout-wrap">
      <button class="logout-btn" @tap="handleLogout">退出登录</button>
    </view>

    <AppTabbar v-show="!showEditor" current="profile" />
  </PageShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import PageShell from '@/components/PageShell.vue';
import MemberProfileCard from '@/components/MemberProfileCard.vue';
import MoonaCard from '@/components/MoonaCard.vue';
import AppTabbar from '@/components/AppTabbar.vue';
import { useAuthStore } from '@/stores/auth';
import { useFinanceStore } from '@/stores/finance';
import { authApi } from '@/api/auth';
import { membershipApi } from '@/api/membership';
import { uploadFile, getApiBase } from '@/utils/request';
import type { MembershipStatus } from '@/types/domain';
import { ensureLoggedIn } from '@/utils/ensure-logged-in';

const authStore = useAuthStore();
const financeStore = useFinanceStore();
const userName = computed(() => authStore.user?.nickname || '用户');
const avatarUrl = computed(() => {
  const url = authStore.user?.avatarUrl;
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('cloud://')) return url;
  const base = getApiBase().replace('/api', '');
  return `${base}${url}`;
});

const showEditor = ref(false);
const editName = ref('');
const previewAvatar = ref('');
const pendingAvatarUrl = ref('');
const saving = ref(false);

function onUserSectionTap() {
  if (!ensureLoggedIn()) return;
  openEditor();
}

function goMembership() {
  if (!ensureLoggedIn()) return;
  uni.navigateTo({ url: '/pages/membership/index' });
}

function openEditor() {
  editName.value = userName.value;
  previewAvatar.value = avatarUrl.value;
  pendingAvatarUrl.value = '';
  showEditor.value = true;
}

async function onChooseAvatar(e: any) {
  const avatar = e?.detail?.avatarUrl || '';
  if (!avatar) return;
  previewAvatar.value = avatar;
  try {
    const uploadRes = await uploadFile('/upload/image', avatar);
    pendingAvatarUrl.value = uploadRes.url;
  } catch {
    uni.showToast({ title: '上传失败', icon: 'none' });
  }
}

async function saveProfile() {
  const name = editName.value.trim();
  if (!name) return uni.showToast({ title: '请输入昵称', icon: 'none' });

  saving.value = true;
  try {
    const data: { nickname?: string; avatarUrl?: string } = { nickname: name };
    if (pendingAvatarUrl.value) data.avatarUrl = pendingAvatarUrl.value;
    const updated = await authApi.updateProfile(data);
    authStore.user = updated;
    showEditor.value = false;
    uni.showToast({ title: '保存成功', icon: 'success' });
  } catch {
    uni.showToast({ title: '保存失败', icon: 'none' });
  } finally {
    saving.value = false;
  }
}

const memberStatus = ref<MembershipStatus | null>(null);

async function refreshProfileData() {
  if (!authStore.isLoggedIn) return;
  authStore.loadProfile();
  try {
    memberStatus.value = await membershipApi.getStatus();
  } catch {
    /* ignore */
  }
}

onShow(() => {
  refreshProfileData();
});

const smartGreetingOn = computed(() => authStore.user?.smartGreetingEnabled !== false);

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

const menuGroups = [
  [
    { icon: '⭐', label: '会员中心', url: '/pages/membership/index' },
    { icon: '💰', label: '预算管理', url: '/pages/budget/index' },
    { icon: '📈', label: '财富成长', url: '/pages/saving-goals/index' },
  ],
  [
    { icon: '🏡', label: '生活空间', url: '/pages/shared-book/index' },
    { icon: '🏆', label: '成长中心', url: '/pages/growth/index' },
  ],
  [
    { icon: '📂', label: '分类管理', url: '/pages/category-settings/index' },
    { icon: '🏷', label: '标签管理', url: '' },
  ],
  [
    { icon: '🔐', label: '账号与安全', url: '/pages/account-security/index' },
    { icon: '💾', label: '数据备份', url: '' },
  ],
  [
    { icon: '💬', label: '帮助与反馈', url: '/pages/help/index' },
    { icon: 'ℹ', label: '关于 Moona', url: '/pages/about/index' },
  ],
];

const tabBarPages = ['/pages/overview/index', '/pages/bills/index', '/pages/index/index', '/pages/discover/index', '/pages/profile/index'];
const protectedPages = [
  '/pages/account-security/index',
  '/pages/budget/index',
  '/pages/saving-goals/index',
  '/pages/shared-book/index',
  '/pages/growth/index',
  '/pages/category-settings/index',
];

function onMenuTap(item: { label: string; url: string }) {
  if (!item.url) {
    uni.showToast({ title: `${item.label} 即将上线`, icon: 'none' });
    return;
  }
  if (protectedPages.includes(item.url) && !ensureLoggedIn()) return;
  if (tabBarPages.includes(item.url)) {
    uni.switchTab({ url: item.url });
  } else {
    uni.navigateTo({ url: item.url });
  }
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success(res) {
      if (res.confirm) {
        authStore.logout();
        financeStore.reset();
        uni.switchTab({ url: '/pages/index/index' });
      }
    }
  });
}
</script>

<style scoped>
.topbar { padding-bottom: 8rpx; }
.page-title { font-size: 38rpx; font-weight: 800; color: #1e1e1e; }

/* 编辑弹窗 */
.editor-mask {
  position: fixed;
  top: 0; right: 0; bottom: 0; left: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
}

.editor-sheet {
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 40rpx 40rpx calc(env(safe-area-inset-bottom, 0px) + 60rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.editor-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1e1e1e;
}

.editor-avatar-wrap {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  margin-top: 8rpx;
  padding: 0;
  background: transparent;
  line-height: normal;
}
.editor-avatar-wrap::after { border: none; }

.editor-avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(0, 212, 200, 0.2);
}

.editor-avatar-placeholder {
  background: linear-gradient(135deg, #00d4c8, #7cbcff);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-face-sm {
  position: relative;
  width: 100%;
  height: 100%;
}

.avatar-face-sm .av-eye { top: 54rpx; width: 20rpx; height: 26rpx; }
.avatar-face-sm .av-eye.l { left: 44rpx; }
.avatar-face-sm .av-eye.r { right: 44rpx; }
.avatar-face-sm .av-mouth { top: 98rpx; width: 36rpx; height: 18rpx; margin-left: -18rpx; }

.editor-avatar-badge {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 2rpx solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.editor-avatar-hint {
  font-size: 22rpx;
  color: #88909b;
  margin-top: -8rpx;
}

/* 昵称输入 */
.editor-field {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  background: #f7f8fa;
}

.editor-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #1e1e1e;
  flex-shrink: 0;
}

.editor-input {
  flex: 1;
  font-size: 28rpx;
  color: #1e1e1e;
}

.editor-save-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  background: linear-gradient(135deg, #00d4c8, #00b8a9);
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
}

.profile-member-card-wrap {
  margin-top: 32rpx;
}

.profile-menu-card-wrap {
  margin-top: -8rpx;
}

.menu-item--toggle {
  align-items: flex-start;
  padding-top: 28rpx;
  padding-bottom: 28rpx;
  height: auto;
  min-height: 100rpx;
}

.menu-left--stack {
  align-items: flex-start;
  flex: 1;
  min-width: 0;
}

.menu-text-col {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.menu-sub {
  font-size: 22rpx;
  color: #88909b;
  line-height: 1.35;
}

.settings-pref-card {
  margin-bottom: 16rpx;
}

/* 菜单 */
.menu-card {
  padding: 0 28rpx !important;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100rpx;
}

.menu-item.bordered {
  border-bottom: 1rpx solid #f0f1f3;
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.menu-icon {
  font-size: 32rpx;
}

.menu-label {
  font-size: 28rpx;
  color: #1e1e1e;
}

.menu-arrow {
  font-size: 36rpx;
  color: #c0c4cc;
}

.menu-divider {
  height: 16rpx;
  margin: 0 -28rpx;
  background: rgba(247, 248, 250, 0.6);
}

/* 退出 */
.logout-wrap {
  margin-top: 48rpx;
  padding: 0 40rpx;
}

.logout-btn {
  width: 100%;
  height: 84rpx;
  border-radius: 42rpx;
  background: rgba(255, 255, 255, 0.8);
  color: #ff6b6b;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 84rpx;
}
</style>
