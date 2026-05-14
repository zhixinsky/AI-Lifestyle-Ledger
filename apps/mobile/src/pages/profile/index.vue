<template>
  <PageShell>
    <!-- 用户信息 -->
    <view class="user-section" @tap="onUserSectionTap">
      <view class="user-avatar">
        <image v-if="avatarUrl" class="avatar-img" :src="avatarUrl" mode="aspectFill" />
        <view v-else class="avatar-face">
          <view class="av-eye l" /><view class="av-eye r" />
          <view class="av-mouth" />
        </view>
      </view>
      <view class="user-info">
        <view class="user-name-row">
          <text class="user-name">{{ userName }}</text>
          <text class="edit-icon">✎</text>
        </view>
        <text class="user-sub">连续记账 {{ streakDays }} 天</text>
      </view>
    </view>

    <!-- 编辑弹窗 -->
    <view v-if="showEditor" class="editor-mask" @tap="showEditor = false">
      <view class="editor-sheet" @tap.stop>
        <text class="editor-title">编辑个人资料</text>

        <!-- 头像预览 + 更换 -->
        <view class="editor-avatar-wrap" @tap="chooseAvatar">
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
        </view>
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

    <!-- 全屏裁剪遮罩 -->
    <view v-if="showCrop" class="crop-overlay">
      <view class="crop-header">
        <text class="crop-header-title">移动和缩放</text>
      </view>
      <view class="crop-body">
        <view class="crop-image-area">
          <movable-area class="crop-movable-area">
            <movable-view
              class="crop-movable-img"
              direction="all"
              :scale="true"
              :scale-min="1"
              :scale-max="4"
              :x="imgX" :y="imgY"
              @change="onImgMove"
              @scale="onImgScale"
            >
              <image :src="cropSourcePath" class="crop-source-img" mode="widthFix" />
            </movable-view>
          </movable-area>
          <view class="crop-mask-ring" />
        </view>
      </view>
      <view class="crop-footer">
        <button class="crop-btn crop-cancel" @tap="showCrop = false">取消</button>
        <button class="crop-btn crop-confirm" @tap="confirmCrop">选取</button>
      </view>
      <canvas canvas-id="cropCanvas" class="crop-hidden-canvas" />
    </view>

    <!-- VIP 卡片 -->
    <view v-if="isPro" :class="['vip-card', `vip-level-${memberStatus?.level}`]" @tap="goMembership">
      <view class="vip-level-top">
        <text class="vip-level-icon">{{ memberLevelIcon }}</text>
        <view class="vip-level-info">
          <text class="vip-level-name">{{ memberLevelName }}</text>
          <text class="vip-level-expire">{{ memberExpire }}</text>
        </view>
      </view>
      <button v-if="canUpgrade" class="vip-upgrade-btn">{{ upgradeText }}</button>
    </view>
    <view v-else class="vip-card" @tap="goMembership">
      <view class="vip-left">
        <text class="vip-title">AI 高级会员</text>
        <text class="vip-desc">享受更多 AI 分析功能</text>
      </view>
      <button class="vip-btn">开通</button>
    </view>

    <!-- 菜单列表 -->
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

    <!-- 退出 -->
    <view v-if="authStore.isLoggedIn" class="logout-wrap">
      <button class="logout-btn" @tap="handleLogout">退出登录</button>
    </view>

    <AppTabbar v-show="!showEditor && !showCrop" current="profile" />
  </PageShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import PageShell from '@/components/PageShell.vue';
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
const streakDays = computed(() => authStore.user?.streakDays || 0);
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

const showCrop = ref(false);
const cropSourcePath = ref('');
const imgX = ref(0);
const imgY = ref(0);
const imgScale = ref(1);
const imgW = ref(300);
const imgH = ref(300);
const AREA_SIZE = 300;
const RING_SIZE = 240;

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

function chooseAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const path = res.tempFilePaths[0];
      cropSourcePath.value = path;
      uni.getImageInfo({
        src: path,
        success: (info) => {
          const ratio = info.width / info.height;
          if (ratio > 1) {
            imgW.value = AREA_SIZE * ratio;
            imgH.value = AREA_SIZE;
          } else {
            imgW.value = AREA_SIZE;
            imgH.value = AREA_SIZE / ratio;
          }
          imgX.value = (AREA_SIZE - imgW.value) / 2;
          imgY.value = (AREA_SIZE - imgH.value) / 2;
          imgScale.value = 1;
          showCrop.value = true;
        },
        fail: () => {
          imgW.value = AREA_SIZE;
          imgH.value = AREA_SIZE;
          imgX.value = 0;
          imgY.value = 0;
          showCrop.value = true;
        },
      });
    },
  });
}

function onImgMove(e: any) {
  imgX.value = e.detail.x;
  imgY.value = e.detail.y;
}

function onImgScale(e: any) {
  imgScale.value = e.detail.scale;
}

function confirmCrop() {
  const canvasSize = 400;
  const ctx = uni.createCanvasContext('cropCanvas');

  const scaledW = imgW.value * imgScale.value;
  const scaledH = imgH.value * imgScale.value;
  const offset = (AREA_SIZE - RING_SIZE) / 2;
  const cropLeft = offset - imgX.value;
  const cropTop = offset - imgY.value;

  const sx = (cropLeft / scaledW);
  const sy = (cropTop / scaledH);
  const sSize = RING_SIZE / scaledW;

  ctx.drawImage(
    cropSourcePath.value,
    0, 0, canvasSize, canvasSize,
  );
  ctx.draw(false, () => {
    setTimeout(() => {
      const drawCtx = uni.createCanvasContext('cropCanvas');
      drawCtx.clearRect(0, 0, canvasSize, canvasSize);

      const drawX = -(sx * canvasSize) / sSize;
      const drawY = -(sy * canvasSize) / sSize;
      const drawW = canvasSize / sSize;
      const drawH = (canvasSize * scaledH / scaledW) / sSize;

      drawCtx.drawImage(cropSourcePath.value, drawX, drawY, drawW, drawH);
      drawCtx.draw(false, () => {
        setTimeout(() => {
          uni.canvasToTempFilePath({
            canvasId: 'cropCanvas',
            x: 0,
            y: 0,
            width: canvasSize,
            height: canvasSize,
            destWidth: canvasSize,
            destHeight: canvasSize,
            success: async (res) => {
              showCrop.value = false;
              previewAvatar.value = res.tempFilePath;
              try {
                const uploadRes = await uploadFile('/upload/image', res.tempFilePath);
                pendingAvatarUrl.value = uploadRes.url;
              } catch {
                uni.showToast({ title: '上传失败', icon: 'none' });
              }
            },
            fail: () => {
              showCrop.value = false;
              previewAvatar.value = cropSourcePath.value;
              uploadDirectly();
            },
          });
        }, 300);
      });
    }, 100);
  });
}

async function uploadDirectly() {
  try {
    const uploadRes = await uploadFile('/upload/image', cropSourcePath.value);
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
const isPro = computed(() => memberStatus.value?.isPro ?? false);
const upgradeText = computed(() => {
  if (!isPro.value) return '';
  const s = memberStatus.value!;
  if (s.level === 'premium') return '';
  if (s.level === 'pro' && s.expireAt) {
    const remain = (new Date(s.expireAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (remain <= 93) return '升级年卡';
  }
  return '升级会员';
});
const canUpgrade = computed(() => !!upgradeText.value);
const memberLevelNum = computed(() => {
  if (!memberStatus.value) return 0;
  return memberStatus.value.level === 'premium' ? 2 : memberStatus.value.level === 'pro' ? 1 : 0;
});
const memberLevelIcon = computed(() => ['🌱', '⭐', '💎'][memberLevelNum.value]);
const memberLevelName = computed(() => ['免费版', 'Pro 会员', 'Premium 会员'][memberLevelNum.value]);
const memberExpire = computed(() => {
  if (memberStatus.value?.level === 'premium' && !memberStatus.value.expireAt) return '永久有效';
  if (!memberStatus.value?.expireAt) return '';
  return `有效期至 ${memberStatus.value.expireAt.substring(0, 10)}`;
});

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
/* 用户信息 */
.user-section {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding-bottom: 8rpx;
}

.user-avatar {
  flex-shrink: 0;
}

.avatar-img {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  box-shadow: 0 12rpx 32rpx rgba(0, 212, 200, 0.25);
}

.avatar-face {
  position: relative;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #00d4c8, #7cbcff);
  box-shadow: 0 12rpx 32rpx rgba(0, 212, 200, 0.25);
}

.av-eye {
  position: absolute;
  top: 34rpx;
  width: 14rpx;
  height: 18rpx;
  border-radius: 50%;
  background: #fff;
}

.av-eye.l { left: 28rpx; }
.av-eye.r { right: 28rpx; }

.av-mouth {
  position: absolute;
  left: 50%;
  top: 62rpx;
  width: 24rpx;
  height: 12rpx;
  margin-left: -12rpx;
  border-radius: 0 0 12rpx 12rpx;
  background: #fff;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.user-name {
  font-size: 38rpx;
  font-weight: 800;
  color: #1e1e1e;
}

.edit-icon {
  font-size: 26rpx;
  color: #c0c4cc;
  margin-top: 4rpx;
}

.user-sub {
  font-size: 24rpx;
  color: #88909b;
}

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
}

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

/* 全屏裁剪 */
.crop-overlay {
  position: fixed;
  top: 0; right: 0; bottom: 0; left: 0;
  z-index: 10001;
  background: #000;
  display: flex;
  flex-direction: column;
}

.crop-header {
  padding: calc(env(safe-area-inset-top, 44px) + 16rpx) 32rpx 16rpx;
  text-align: center;
}

.crop-header-title {
  font-size: 30rpx;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.crop-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.crop-image-area {
  position: relative;
  width: 300px;
  height: 300px;
}

.crop-movable-area {
  width: 300px;
  height: 300px;
  overflow: hidden;
}

.crop-movable-img {
  width: 300px;
  height: 300px;
}

.crop-source-img {
  width: 300px;
  pointer-events: none;
}

.crop-mask-ring {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  pointer-events: none;
  border-radius: 0;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.7),
              inset 0 0 0 2000px transparent;
  background: radial-gradient(circle at center, transparent 120px, rgba(0, 0, 0, 0.6) 120px);
}

.crop-footer {
  flex-shrink: 0;
  display: flex;
  gap: 24rpx;
  padding: 32rpx 40rpx calc(env(safe-area-inset-bottom, 0px) + 48rpx);
  background: #000;
}

.crop-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  font-size: 30rpx;
  font-weight: 600;
  text-align: center;
}

.crop-cancel {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.crop-confirm {
  background: linear-gradient(135deg, #00d4c8, #00b8a9);
  color: #fff;
}

.crop-hidden-canvas {
  position: fixed;
  left: -9999px;
  top: -9999px;
  width: 400px;
  height: 400px;
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

/* VIP */
.vip-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  margin-top: 20rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #1e1e1e 0%, #2d3748 100%);
  box-shadow: 0 8rpx 32rpx rgba(30, 30, 30, 0.15);
}

.vip-card.vip-level-pro {
  background: linear-gradient(135deg, #2d3748, #4a5568);
}
.vip-card.vip-level-premium {
  background: linear-gradient(135deg, #44337a, #6b46c1);
}

.vip-level-top {
  display: flex;
  align-items: center;
  gap: 24rpx;
}
.vip-level-icon { font-size: 52rpx; }
.vip-level-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.vip-level-name {
  font-size: 34rpx;
  font-weight: 800;
  color: #ffd700;
}
.vip-level-expire {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.vip-left {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.vip-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #ffd700;
}

.vip-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.vip-btn {
  padding: 0 36rpx;
  height: 60rpx;
  line-height: 60rpx;
  border-radius: 30rpx;
  background: linear-gradient(135deg, #ffd700, #ffb86b);
  color: #1e1e1e;
  font-size: 26rpx;
  font-weight: 700;
  margin-right: 8rpx;
}

.vip-upgrade-btn {
  padding: 0 28rpx;
  height: 56rpx;
  line-height: 56rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #ffd700, #ffb86b);
  color: #1e1e1e;
  font-size: 24rpx;
  font-weight: 700;
  flex-shrink: 0;
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
