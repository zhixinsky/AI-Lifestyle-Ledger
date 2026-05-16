<template>
  <view v-if="visible && current" class="announcement-mask" @tap="close">
    <view class="announcement-card" @tap.stop>
      <text class="announcement-card__title">{{ current.title }}</text>
      <text class="announcement-card__content">{{ current.content }}</text>
      <button class="announcement-card__btn" @tap="confirmRead">我知道了</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { announcementsApi, type ActiveAnnouncement } from '@/api/announcements';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const queue = ref<ActiveAnnouncement[]>([]);
const current = ref<ActiveAnnouncement | null>(null);
const visible = ref(false);

function showNext() {
  const next = queue.value.find((a) => a.type === 'popup' && !a.read);
  if (!next) {
    current.value = null;
    visible.value = false;
    return;
  }
  current.value = next;
  visible.value = true;
}

async function fetchAnnouncements() {
  if (!authStore.isLoggedIn) return;
  try {
    const list = await announcementsApi.getActive('global');
    queue.value = list.filter((a) => a.type === 'popup' && !a.read);
    showNext();
  } catch {
    /* ignore */
  }
}

async function confirmRead() {
  if (!current.value) return;
  try {
    await announcementsApi.markRead(current.value.id);
    queue.value = queue.value.filter((a) => a.id !== current.value?.id);
  } catch {
    /* ignore */
  }
  showNext();
}

function close() {
  if (current.value?.requireRead) return;
  showNext();
}

watch(
  () => authStore.isLoggedIn,
  (loggedIn) => {
    if (loggedIn) fetchAnnouncements();
    else {
      queue.value = [];
      visible.value = false;
    }
  },
);

onMounted(() => {
  if (authStore.isLoggedIn) fetchAnnouncements();
  uni.$on('login-success', fetchAnnouncements);
});
</script>

<style scoped>
.announcement-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
}

.announcement-card {
  width: 100%;
  max-width: 620rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx 32rpx 32rpx;
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.12);
}

.announcement-card__title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  color: #1e1e1e;
  margin-bottom: 16rpx;
}

.announcement-card__content {
  display: block;
  font-size: 28rpx;
  line-height: 1.6;
  color: #555;
  margin-bottom: 32rpx;
  white-space: pre-wrap;
}

.announcement-card__btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  background: #2eb8a0;
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
}
</style>
