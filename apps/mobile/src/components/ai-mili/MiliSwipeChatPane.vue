<template>
  <view class="pane">
    <view class="pane-head">
      <text class="pane-title">AI 聊天</text>
      <text class="pane-hint">生活消费 · 习惯 · 预算都可以问</text>
    </view>
    <scroll-view class="chat-scroll" scroll-y :scroll-top="scrollTop">
      <view v-for="(msg, idx) in aiStore.chatMessages" :key="idx" :class="['row', msg.role]">
        <view v-if="msg.role === 'assistant'" class="avatar">
          <text class="avatar-t">米</text>
        </view>
        <view
          v-if="msg.role === 'assistant'"
          :class="['voice-btn', { active: playingIndex === idx && isSpeaking, failed: failedIndex === idx }]"
          @tap="playReply(msg.content, idx)"
        >
          <view class="voice-wave" />
          <text class="voice-icon">{{ playingIndex === idx && isSpeaking ? 'Ⅱ' : '♪' }}</text>
        </view>
        <view :class="['bubble', msg.role]">
          <text class="bubble-t">{{ msg.content }}</text>
        </view>
      </view>
      <view v-if="aiStore.chatLoading" class="row assistant">
        <view class="avatar"><text class="avatar-t">米</text></view>
        <view class="bubble assistant">
          <view class="dots"><view class="d" /><view class="d" /><view class="d" /></view>
        </view>
      </view>
      <view class="tail" />
    </scroll-view>
    <view class="input-bar">
      <input
        v-model="text"
        class="inp"
        placeholder="输入想聊的内容…"
        confirm-type="send"
        @confirm="send"
      />
      <view class="send" :class="{ off: !text.trim() || aiStore.chatLoading }" @tap="send">
        <text>发送</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue';
import { useAiStore } from '@/stores/ai';
import { destroyTts, getVoiceReplyEnabled, isSpeaking, speakText, stopSpeak } from '@/utils/tts';

const aiStore = useAiStore();
const text = ref('');
const scrollTop = ref(0);
const playingIndex = ref(-1);
const failedIndex = ref(-1);

async function send() {
  const t = text.value.trim();
  if (!t || aiStore.chatLoading) return;
  text.value = '';
  await aiStore.sendMessage(t);
  await nextTick();
  scrollTop.value = 999999;
}

async function playReply(content: string, index: number) {
  if (playingIndex.value === index && isSpeaking.value) {
    stopSpeak();
    return;
  }
  failedIndex.value = -1;
  playingIndex.value = index;
  try {
    await speakText(content);
  } catch {
    failedIndex.value = index;
    uni.showToast({ title: '语音播放失败', icon: 'none' });
  } finally {
    if (playingIndex.value === index && !isSpeaking.value) {
      playingIndex.value = -1;
    }
  }
}

watch(
  () => aiStore.chatMessages.length,
  async () => {
    await nextTick();
    scrollTop.value = 999999;
    const lastIndex = aiStore.chatMessages.length - 1;
    const last = aiStore.chatMessages[lastIndex];
    if (last?.role === 'assistant' && getVoiceReplyEnabled()) {
      playReply(last.content, lastIndex);
    }
  }
);

onUnmounted(() => {
  destroyTts();
});
</script>

<style scoped>
.pane {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 28rpx;
  padding-top: calc(env(safe-area-inset-top, 0px) + 24rpx);
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 200rpx);
  box-sizing: border-box;
}
.pane-head {
  margin-bottom: 20rpx;
}
.pane-title {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: rgba(24, 56, 48, 0.9);
  letter-spacing: -1rpx;
}
.pane-hint {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: rgba(48, 92, 80, 0.55);
}
.chat-scroll {
  flex: 1;
  min-height: 0;
}
.row {
  display: flex;
  margin-bottom: 20rpx;
  gap: 14rpx;
  align-items: flex-start;
}
.row.user {
  flex-direction: row-reverse;
}
.avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: linear-gradient(145deg, #eafff6, #8cffd8);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 8rpx 24rpx rgba(127, 255, 212, 0.25);
}
.avatar-t {
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(28, 88, 72, 0.85);
}
.voice-btn {
  position: relative;
  width: 48rpx;
  height: 48rpx;
  margin-top: 4rpx;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  background: rgba(213, 255, 239, 0.58);
  border: 1rpx solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(18rpx);
  -webkit-backdrop-filter: blur(18rpx);
  box-shadow: 0 8rpx 26rpx rgba(46, 184, 160, 0.14);
}
.voice-btn.failed {
  background: rgba(255, 238, 238, 0.68);
}
.voice-icon {
  position: relative;
  z-index: 1;
  font-size: 23rpx;
  font-weight: 800;
  color: rgba(28, 128, 104, 0.82);
}
.voice-wave {
  position: absolute;
  inset: -8rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(46, 184, 160, 0.2);
  opacity: 0;
}
.voice-btn.active .voice-wave {
  animation: voiceRipple 1.25s ease-out infinite;
}
@keyframes voiceRipple {
  0% {
    transform: scale(0.72);
    opacity: 0.75;
  }
  100% {
    transform: scale(1.35);
    opacity: 0;
  }
}
.bubble {
  max-width: 72%;
  padding: 20rpx 24rpx;
  border-radius: 28rpx;
}
.bubble.assistant {
  background: rgba(255, 255, 255, 0.55);
  border: 1rpx solid rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(24rpx);
  -webkit-backdrop-filter: blur(24rpx);
  box-shadow: 0 12rpx 40rpx rgba(127, 255, 212, 0.1);
}
.bubble.user {
  background: linear-gradient(135deg, rgba(127, 255, 212, 0.45), rgba(46, 184, 160, 0.35));
  border: 1rpx solid rgba(255, 255, 255, 0.5);
}
.bubble-t {
  font-size: 28rpx;
  line-height: 1.5;
  color: rgba(24, 48, 44, 0.88);
}
.bubble.user .bubble-t {
  color: rgba(18, 42, 38, 0.92);
}
.dots {
  display: flex;
  gap: 8rpx;
  padding: 4rpx 0;
}
.d {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: rgba(46, 184, 160, 0.55);
  animation: bounce 1s ease-in-out infinite;
}
.d:nth-child(2) {
  animation-delay: 0.15s;
}
.d:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  50% {
    transform: translateY(-6rpx);
    opacity: 1;
  }
}
.tail {
  height: 24rpx;
}
.input-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.5);
  border: 1rpx solid rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(28rpx);
  -webkit-backdrop-filter: blur(28rpx);
  box-shadow: 0 12rpx 40rpx rgba(46, 184, 160, 0.08);
}
.inp {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  padding: 8rpx 12rpx;
}
.send {
  padding: 14rpx 28rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #7fffd4, #2eb8a0);
  color: #fff;
  font-size: 26rpx;
  font-weight: 700;
}
.send.off {
  opacity: 0.45;
}
</style>
