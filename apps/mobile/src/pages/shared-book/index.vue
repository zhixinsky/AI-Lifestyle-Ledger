<template>
  <PageShell>
    <view class="nav">
      <view class="nav-back" @tap="goBack">
        <view class="back-glass" />
        <image class="back-icon" :src="backIcon" />
      </view>
      <text class="nav-title">共享账本</text>
      <view class="nav-placeholder" />
    </view>

    <!-- 创建/加入 -->
    <view class="action-row">
      <button class="action-btn primary" @tap="showCreateSheet = true">创建账本</button>
      <button class="action-btn" @tap="showJoinSheet = true">加入账本</button>
    </view>

    <!-- 账本列表 -->
    <view v-if="books.length" class="book-list">
      <MoonaCard v-for="book in books" :key="book.id" class="book-card" @tap="goDetail(book.id)">
        <view class="book-header">
          <text class="book-type-icon">{{ book.type === 'couple' ? '💑' : '👨‍👩‍👧‍👦' }}</text>
          <view class="book-info">
            <text class="book-name">{{ book.name }}</text>
            <text class="book-meta">{{ book.type === 'couple' ? '情侣账本' : '家庭账本' }} · {{ book.memberCount }}人</text>
          </view>
          <text class="book-role">{{ roleText(book.myRole) }}</text>
        </view>
        <view class="book-code">
          <text class="code-label">邀请码</text>
          <text class="code-value" @tap.stop="copyCode(book.inviteCode)">{{ book.inviteCode }}</text>
        </view>
      </MoonaCard>
    </view>
    <view v-else class="empty">
      <text class="empty-icon">📒</text>
      <text class="empty-text">还没有共享账本</text>
      <text class="empty-sub">创建一个家庭或情侣账本，一起记账吧</text>
    </view>

    <!-- 创建弹窗 -->
    <view v-if="showCreateSheet" class="sheet-mask" @tap="showCreateSheet = false">
      <view class="sheet" @tap.stop>
        <text class="sheet-title">创建共享账本</text>
        <input class="sheet-input" v-model="createName" placeholder="账本名称" />
        <view class="type-row">
          <view :class="['type-option', { active: createType === 'family' }]" @tap="createType = 'family'">
            <text class="type-icon">👨‍👩‍👧‍👦</text>
            <text class="type-label">家庭账本</text>
          </view>
          <view :class="['type-option', { active: createType === 'couple' }]" @tap="createType = 'couple'">
            <text class="type-icon">💑</text>
            <text class="type-label">情侣账本</text>
          </view>
        </view>
        <button class="sheet-btn" @tap="doCreate">创建</button>
      </view>
    </view>

    <!-- 加入弹窗 -->
    <view v-if="showJoinSheet" class="sheet-mask" @tap="showJoinSheet = false">
      <view class="sheet" @tap.stop>
        <text class="sheet-title">加入共享账本</text>
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
import MoonaCard from '@/components/MoonaCard.vue';
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
.action-btn.primary { background: linear-gradient(135deg, #00d4c8, #00b8a9); color: #fff; border: none; }

.book-list { display: flex; flex-direction: column; gap: 16rpx; }
.book-card { padding: 28rpx !important; }
.book-header { display: flex; align-items: center; gap: 16rpx; }
.book-type-icon { font-size: 44rpx; }
.book-info { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.book-name { font-size: 30rpx; font-weight: 700; color: #1e1e1e; }
.book-meta { font-size: 22rpx; color: #88909b; }
.book-role { font-size: 22rpx; color: #00d4c8; font-weight: 600; padding: 4rpx 16rpx; border-radius: 20rpx; background: rgba(0,212,200,0.1); }
.book-code { display: flex; align-items: center; gap: 12rpx; margin-top: 16rpx; padding-top: 16rpx; border-top: 1rpx solid #f0f1f3; }
.code-label { font-size: 22rpx; color: #88909b; }
.code-value { font-size: 28rpx; font-weight: 700; color: #00d4c8; letter-spacing: 4rpx; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 100rpx 0; gap: 12rpx; }
.empty-icon { font-size: 80rpx; }
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
.type-option.active { border-color: #00d4c8; background: rgba(0,212,200,0.06); }
.type-icon { font-size: 40rpx; }
.type-label { font-size: 24rpx; color: #1e1e1e; font-weight: 600; }
.sheet-btn { height: 88rpx; line-height: 88rpx; border-radius: 44rpx; background: linear-gradient(135deg, #00d4c8, #00b8a9); color: #fff; font-size: 32rpx; font-weight: 700; }

.spacer { height: 60rpx; }
</style>
