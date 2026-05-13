<template>
  <PageShell>
    <view class="nav">
      <view class="nav-back" @tap="goBack">
        <view class="back-glass" />
        <image class="back-icon" :src="backIcon" />
      </view>
      <text class="nav-title">生活空间</text>
      <view class="nav-placeholder" />
    </view>

    <!-- 创建/加入 -->
    <view class="action-row">
      <button class="action-btn primary" @tap="showCreateSheet = true">创建空间</button>
      <button class="action-btn" @tap="showJoinSheet = true">加入空间</button>
    </view>

    <!-- 账本列表 -->
    <view v-if="books.length" class="book-list">
      <view
        v-for="book in books"
        :key="book.id"
        :class="['book-card', book.type === 'couple' ? 'book-card--couple' : 'book-card--family']"
        @tap="goDetail(book.id)"
      >
        <view class="book-art" aria-hidden="true">
          <view class="art-window" />
          <view class="art-line art-line-one" />
          <view class="art-line art-line-two" />
          <view class="art-base" />
        </view>
        <view class="book-content">
          <view class="book-header">
            <view :class="['book-type-icon', book.type === 'couple' ? 'life' : 'family']">
              <text>{{ book.type === 'couple' ? 'AI' : '家' }}</text>
            </view>
            <view class="book-info">
              <text class="book-name">{{ book.name }}</text>
              <text class="book-meta">{{ book.type === 'couple' ? 'AI双人生活空间' : '家庭生活空间' }} · {{ book.memberCount }}人</text>
            </view>
            <text class="book-role">{{ roleText(book.myRole) }}</text>
          </view>
          <view class="book-code">
            <text class="code-label">邀请码</text>
            <text class="code-value" @tap.stop="copyCode(book.inviteCode)">{{ book.inviteCode }}</text>
          </view>
        </view>
      </view>
    </view>
    <view v-else class="empty">
      <text class="empty-icon">AI</text>
      <text class="empty-text">还没有生活空间</text>
      <text class="empty-sub">为两个人创建一个能记录生活、观察节奏的空间</text>
    </view>

    <!-- 创建弹窗 -->
    <view v-if="showCreateSheet" class="sheet-mask" @tap="showCreateSheet = false">
      <view class="sheet" @tap.stop>
        <text class="sheet-title">创建生活空间</text>
        <input class="sheet-input" v-model="createName" placeholder="空间名称，例如：我们的生活" />
        <view class="type-row">
          <view :class="['type-option', { active: createType === 'family' }]" @tap="createType = 'family'">
            <text class="type-icon">家</text>
            <text class="type-label">家庭生活空间</text>
          </view>
          <view :class="['type-option', { active: createType === 'couple' }]" @tap="createType = 'couple'">
            <text class="type-icon">AI</text>
            <text class="type-label">双人生活空间</text>
          </view>
        </view>
        <button class="sheet-btn" @tap="doCreate">创建</button>
      </view>
    </view>

    <!-- 加入弹窗 -->
    <view v-if="showJoinSheet" class="sheet-mask" @tap="showJoinSheet = false">
      <view class="sheet" @tap.stop>
        <text class="sheet-title">加入生活空间</text>
        <input class="sheet-input" v-model="joinCode" placeholder="请输入邀请码" maxlength="6" />
        <button class="sheet-btn" @tap="doJoin">加入</button>
      </view>
    </view>

    <view class="spacer" />
  </PageShell>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { backIcon } from '@/utils/icons';
import PageShell from '@/components/PageShell.vue';
import { sharedBookApi } from '@/api/shared-book';
import type { SharedBook } from '@/types/domain';

const books = ref<SharedBook[]>([]);
const showCreateSheet = ref(false);
const showJoinSheet = ref(false);
const createName = ref('');
const createType = ref<'family' | 'couple'>('family');
const joinCode = ref('');

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) { uni.navigateBack(); }
  else { uni.switchTab({ url: '/pages/index/index' }); }
}
function goDetail(id: string) { uni.navigateTo({ url: `/pages/shared-book/detail?id=${id}` }); }

function roleText(role: string) {
  return role === 'owner' ? '创建者' : role === 'admin' ? '管理员' : '成员';
}

function copyCode(code: string) {
  uni.setClipboardData({ data: code });
}

async function loadBooks() {
  try { books.value = await sharedBookApi.list(); } catch {}
}

async function doCreate() {
  if (!createName.value.trim()) return uni.showToast({ title: '请输入名称', icon: 'none' });
  try {
    await sharedBookApi.create({ name: createName.value.trim(), type: createType.value });
    showCreateSheet.value = false;
    createName.value = '';
    uni.showToast({ title: '创建成功', icon: 'success' });
    loadBooks();
  } catch { uni.showToast({ title: '创建失败', icon: 'none' }); }
}

async function doJoin() {
  if (!joinCode.value.trim()) return uni.showToast({ title: '请输入邀请码', icon: 'none' });
  try {
    await sharedBookApi.join(joinCode.value.trim().toUpperCase());
    showJoinSheet.value = false;
    joinCode.value = '';
    uni.showToast({ title: '加入成功', icon: 'success' });
    loadBooks();
  } catch { uni.showToast({ title: '加入失败', icon: 'none' }); }
}

onMounted(loadBooks);
</script>

<style scoped>
.nav { display: flex; align-items: center; justify-content: space-between; padding-bottom: 16rpx; }
.nav-back { position: relative; width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center; }
.back-glass { position: absolute; top: 0; right: 0; bottom: 0; left: 0; border-radius: 50%; background: rgba(255,255,255,0.55); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1rpx solid rgba(255,255,255,0.5); }
.back-icon { position: relative; z-index: 1; width: 36rpx; height: 36rpx; margin-left: -4rpx; }
.nav-title { font-size: 34rpx; font-weight: 700; color: #1e1e1e; }
.nav-placeholder { width: 60rpx; }

.action-row { display: flex; gap: 16rpx; margin-bottom: 16rpx; }
.action-btn {
  flex: 1; height: 80rpx; line-height: 80rpx; border-radius: 40rpx; font-size: 28rpx; font-weight: 600;
  background: rgba(255,255,255,0.7); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: #1e1e1e; border: 1rpx solid rgba(0,0,0,0.06);
}
.action-btn.primary {
  color: #1f5147;
  border: 1rpx solid rgba(255,255,255,0.66);
  background: linear-gradient(168deg, rgba(232,255,246,0.92) 0%, rgba(178,240,218,0.68) 48%, rgba(118,214,188,0.58) 100%);
  box-shadow:
    0 18rpx 48rpx rgba(92, 200, 168, 0.22),
    inset 0 2rpx 0 rgba(255,255,255,0.78),
    inset 0 -12rpx 28rpx rgba(100,200,175,0.12);
}

.book-list { display: flex; flex-direction: column; gap: 22rpx; }
.book-card {
  position: relative;
  overflow: hidden;
  min-height: 210rpx;
  padding: 30rpx;
  border-radius: 38rpx;
  backdrop-filter: blur(22px) saturate(112%);
  -webkit-backdrop-filter: blur(22px) saturate(112%);
}
.book-card--couple {
  background:
    linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,236,238,0.8)),
    linear-gradient(28deg, rgba(255,210,197,0.52), rgba(255,255,255,0) 58%);
  box-shadow: 0 24rpx 62rpx rgba(201, 126, 133, 0.14);
}
.book-card--family {
  background:
    linear-gradient(145deg, rgba(255,255,255,0.9), rgba(239,248,230,0.82)),
    linear-gradient(28deg, rgba(209,228,159,0.48), rgba(255,255,255,0) 58%);
  box-shadow: 0 24rpx 62rpx rgba(124, 151, 104, 0.13);
}
.book-content {
  position: relative;
  z-index: 2;
}
.book-art {
  position: absolute;
  right: 26rpx;
  top: 24rpx;
  width: 210rpx;
  height: 156rpx;
  opacity: 0.5;
  z-index: 1;
}
.art-window {
  position: absolute;
  right: 8rpx;
  top: 0;
  width: 116rpx;
  height: 112rpx;
  border-radius: 52rpx 52rpx 24rpx 24rpx;
  border: 4rpx solid rgba(255,255,255,0.72);
  background: rgba(255,255,255,0.22);
}
.art-window::before,
.art-window::after {
  content: '';
  position: absolute;
  background: rgba(255,255,255,0.62);
}
.art-window::before { left: 50%; top: 16rpx; bottom: 16rpx; width: 3rpx; }
.art-window::after { left: 18rpx; right: 18rpx; top: 56rpx; height: 3rpx; }
.art-line {
  position: absolute;
  left: 8rpx;
  height: 12rpx;
  border-radius: 999rpx;
  background: rgba(255,255,255,0.58);
}
.art-line-one { top: 38rpx; width: 86rpx; }
.art-line-two { top: 70rpx; width: 58rpx; }
.art-base {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 184rpx;
  height: 34rpx;
  border-radius: 999rpx 999rpx 20rpx 20rpx;
  background: rgba(255,255,255,0.42);
}
.book-card--couple .book-art { color: #c77b86; }
.book-card--couple .art-window { border-color: rgba(255,255,255,0.76); background: rgba(255,205,210,0.22); }
.book-card--couple .art-line,
.book-card--couple .art-base { background: rgba(255,255,255,0.54); }
.book-card--family .art-window { border-color: rgba(255,255,255,0.76); background: rgba(211,230,166,0.22); }
.book-card--family .art-line,
.book-card--family .art-base { background: rgba(255,255,255,0.54); }
.book-header { display: flex; align-items: center; gap: 16rpx; }
.book-type-icon {
  width: 62rpx; height: 62rpx; border-radius: 22rpx;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 22rpx; font-weight: 850;
  background: linear-gradient(145deg, #42556d, #a8b8ad);
}
.book-type-icon.life { background: linear-gradient(145deg, #bd6e7c, #f1b9be); }
.book-type-icon.family { background: linear-gradient(145deg, #617d43, #b8cd85); }
.book-info { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.book-name { font-size: 30rpx; font-weight: 700; color: #1e1e1e; }
.book-meta { font-size: 22rpx; color: #88909b; }
.book-role { font-size: 22rpx; color: #4f8174; font-weight: 600; padding: 4rpx 16rpx; border-radius: 20rpx; background: rgba(79,129,116,0.1); }
.book-code { display: flex; align-items: center; gap: 12rpx; margin-top: 16rpx; padding-top: 16rpx; border-top: 1rpx solid #f0f1f3; }
.code-label { font-size: 22rpx; color: #88909b; }
.code-value { font-size: 28rpx; font-weight: 700; color: #4f8174; letter-spacing: 4rpx; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 100rpx 0; gap: 12rpx; }
.empty-icon {
  width: 96rpx; height: 96rpx; border-radius: 32rpx;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(145deg, #2c574d, #8fcfbd);
  color: #fff; font-size: 26rpx; font-weight: 850;
  box-shadow: 0 18rpx 42rpx rgba(44, 87, 77, 0.18);
}
.empty-text { font-size: 30rpx; font-weight: 600; color: #1e1e1e; }
.empty-sub { font-size: 24rpx; color: #88909b; }

.sheet-mask { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 999; background: rgba(0,0,0,0.4); display: flex; align-items: flex-end; }
.sheet {
  width: 100%; padding: 40rpx 40rpx calc(env(safe-area-inset-bottom, 0px) + 40rpx); border-radius: 32rpx 32rpx 0 0;
  background: #fff; display: flex; flex-direction: column; gap: 24rpx;
}
.sheet-title { font-size: 34rpx; font-weight: 700; color: #1e1e1e; text-align: center; }
.sheet-input { height: 88rpx; border-radius: 16rpx; background: #f7f8fa; padding: 0 24rpx; font-size: 28rpx; }
.type-row { display: flex; gap: 16rpx; }
.type-option {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8rpx; padding: 24rpx; border-radius: 16rpx;
  background: #f7f8fa; border: 2rpx solid transparent;
}
.type-option.active { border-color: #70ad9e; background: rgba(112,173,158,0.08); }
.type-icon {
  width: 54rpx; height: 54rpx; border-radius: 18rpx;
  display: flex; align-items: center; justify-content: center;
  background: #edf5f2; color: #4f8174; font-size: 22rpx; font-weight: 850;
}
.type-label { font-size: 24rpx; color: #1e1e1e; font-weight: 600; }
.sheet-btn {
  height: 88rpx; line-height: 88rpx; border-radius: 44rpx;
  color: #1f5147; font-size: 32rpx; font-weight: 700;
  background: linear-gradient(168deg, rgba(232,255,246,0.94) 0%, rgba(178,240,218,0.72) 48%, rgba(118,214,188,0.62) 100%);
  box-shadow: 0 18rpx 48rpx rgba(92, 200, 168, 0.2), inset 0 2rpx 0 rgba(255,255,255,0.78);
}

.spacer { height: 60rpx; }
</style>
