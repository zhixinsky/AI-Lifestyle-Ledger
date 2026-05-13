<template>
  <PageShell>
    <!-- 导航 -->
    <view class="nav">
      <view class="nav-back" @tap="goBack">
        <view class="back-glass" />
        <image class="back-icon" :src="backIcon" mode="aspectFit" />
      </view>
      <text class="nav-title">AI 财务助手</text>
      <view class="nav-placeholder" />
    </view>

    <!-- 聊天区域 -->
    <scroll-view class="chat-area" scroll-y :scroll-top="scrollTop">
      <!-- 欢迎消息 -->
      <view class="msg msg-ai">
        <view class="msg-avatar">
          <view class="avatar-face">
            <view class="av-eye l" /><view class="av-eye r" />
          </view>
        </view>
        <view class="msg-bubble bubble-ai">
          <text class="msg-text">Hi，我是你的 AI 财务助手 ✨</text>
          <text v-if="mode === 'chat'" class="msg-text">长按麦克风说话，或者切换文字输入～</text>
          <text v-else class="msg-text">对着麦克风说"午饭32，奶茶15"试试</text>
        </view>
      </view>

      <!-- 聊天消息 -->
      <view v-for="(msg, idx) in aiStore.chatMessages" :key="idx" :class="['msg', msg.role === 'user' ? 'msg-me' : 'msg-ai']">
        <view v-if="msg.role === 'assistant'" class="msg-avatar">
          <view class="avatar-face">
            <view class="av-eye l" /><view class="av-eye r" />
          </view>
        </view>
        <view :class="['msg-bubble', msg.role === 'user' ? 'bubble-me' : 'bubble-ai']">
          <text class="msg-text">{{ msg.content }}</text>
        </view>
      </view>

      <!-- loading -->
      <view v-if="aiStore.chatLoading || parsing" class="msg msg-ai">
        <view class="msg-avatar">
          <view class="avatar-face">
            <view class="av-eye l" /><view class="av-eye r" />
          </view>
        </view>
        <view class="msg-bubble bubble-ai">
          <view class="typing-dots">
            <view class="dot" /><view class="dot" /><view class="dot" />
          </view>
        </view>
      </view>

      <!-- 快捷建议 -->
      <view v-if="showSuggestions" class="suggestions">
        <view
          v-for="item in currentSuggestions"
          :key="item"
          class="suggestion-chip"
          @tap="handleQuickTap(item)"
        >
          <text>{{ item }}</text>
        </view>
      </view>

      <view class="chat-bottom-space" />
    </scroll-view>

    <!-- 底部输入区：语音为主 -->
    <view class="bottom-area">
      <!-- 文字输入模式 -->
      <view v-if="inputMode === 'text'" class="text-bar">
        <view class="text-bar-inner">
          <input
            v-model="input"
            class="chat-input"
            :placeholder="mode === 'chat' ? '输入问题...' : '描述消费...'"
            confirm-type="send"
            @confirm="handleSend"
          />
          <view class="send-btn" :class="{ disabled: !input.trim() || busy }" @tap="handleSend">
            <text>发送</text>
          </view>
        </view>
        <view class="switch-voice" @tap="inputMode = 'voice'">
          <text>🎙</text>
        </view>
      </view>

      <!-- 语音输入模式（默认） -->
      <view v-else class="voice-area">
        <!-- 识别到的文字预览 -->
        <text v-if="voiceText && !recording" class="voice-preview">{{ voiceText }}</text>

        <!-- 录音状态提示 -->
        <view v-if="recording" class="record-status">
          <view class="wave-bars">
            <view v-for="i in 7" :key="i" class="wave-bar" :style="{ animationDelay: (i * 0.08) + 's' }" />
          </view>
          <text class="record-text">{{ dragDirection === 'left' ? '对话模式' : dragDirection === 'right' ? '记账模式' : '正在聆听...' }}</text>
        </view>

        <!-- 滑动切换指示器 + 麦克风 -->
        <view class="slide-switch">
          <view :class="['slide-label slide-left', { active: mode === 'chat', dragging: dragDirection === 'left' }]">
            <text>💬</text>
            <text class="slide-label-text">对话</text>
          </view>

          <!-- 麦克风大按钮 -->
          <view class="mic-stage">
            <view v-if="recording" class="mic-ripple r1" />
            <view v-if="recording" class="mic-ripple r2" />
            <view v-if="recording" class="mic-ripple r3" />

            <view
              class="mic-btn"
              :class="{ active: recording }"
              @touchstart.prevent="onMicTouchStart"
              @touchmove.prevent="onMicTouchMove"
              @touchend.prevent="onMicTouchEnd"
              @mousedown.prevent="startRecord"
              @mouseup.prevent="stopRecord"
            >
              <view class="mic-inner">
                <view class="mic-svg">
                  <text class="mic-glyph">🎙️</text>
                </view>
              </view>
            </view>
          </view>

          <view :class="['slide-label slide-right', { active: mode === 'bill', dragging: dragDirection === 'right' }]">
            <text>📝</text>
            <text class="slide-label-text">记账</text>
          </view>
        </view>

        <!-- 当前模式指示 -->
        <view class="mode-indicator">
          <view :class="['mode-dot', { active: mode === 'chat' }]" />
          <text class="mic-tip">{{ recording ? '← 对话 · 松开发送 · 记账 →' : mode === 'chat' ? '对话模式 · 长按说话' : '记账模式 · 长按说话' }}</text>
          <view :class="['mode-dot', { active: mode === 'bill' }]" />
        </view>

        <!-- 切换到文字输入 -->
        <view class="switch-text" @tap="inputMode = 'text'">
          <text class="switch-text-icon">⌨</text>
          <text class="switch-text-label">切换文字</text>
        </view>
      </view>
    </view>

  </PageShell>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import PageShell from '@/components/PageShell.vue';
import { aiApi } from '@/api/ai';
import { useAiStore } from '@/stores/ai';
import { backIcon } from '@/utils/icons';

const aiStore = useAiStore();
const input = ref('');
const parsing = ref(false);
const scrollTop = ref(0);
const mode = ref<'chat' | 'bill'>('chat');
const inputMode = ref<'voice' | 'text'>('voice');
const recording = ref(false);
const voiceText = ref('');

let recognition: any = null;
// #ifdef MP-WEIXIN
let wxRecordManager: any = null;
// #endif

const busy = computed(() => aiStore.chatLoading || parsing.value);

const chatSuggestions = computed(() => aiStore.suggestions);
const billSuggestions = ['午饭32，奶茶15，停车费8', '昨天打车28，咖啡18', '工资5000'];

const currentSuggestions = computed(() =>
  mode.value === 'chat' ? chatSuggestions.value : billSuggestions
);

const showSuggestions = computed(() =>
  aiStore.chatMessages.length < 2 && !busy.value
);

// #ifdef MP-WEIXIN
onMounted(() => { uni.hideTabBar(); });
// #endif

const dragDirection = ref<'left' | 'right' | ''>('');
let touchStartX = 0;
const DRAG_THRESHOLD = 50;

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
  } else {
    uni.switchTab({ url: '/pages/mili/index' });
  }
}

function switchMode(m: 'chat' | 'bill') {
  mode.value = m;
  input.value = '';
  voiceText.value = '';
}

function onMicTouchStart(e: any) {
  touchStartX = e.touches[0].clientX;
  dragDirection.value = '';
  startRecord();
}

function onMicTouchMove(e: any) {
  const dx = e.touches[0].clientX - touchStartX;
  if (dx < -DRAG_THRESHOLD) {
    dragDirection.value = 'left';
  } else if (dx > DRAG_THRESHOLD) {
    dragDirection.value = 'right';
  } else {
    dragDirection.value = '';
  }
}

function onMicTouchEnd() {
  if (dragDirection.value === 'left') {
    switchMode('chat');
  } else if (dragDirection.value === 'right') {
    switchMode('bill');
  }
  dragDirection.value = '';
  stopRecord();
}

function handleQuickTap(text: string) {
  input.value = text;
  handleSend();
}

async function handleSend() {
  const text = input.value.trim();
  if (!text || busy.value) return;
  input.value = '';

  if (mode.value === 'bill') {
    await parseBill(text);
  } else {
    await sendChat(text);
  }

  await nextTick();
  scrollTop.value = 99999;
}

async function submitVoiceText(text: string) {
  if (!text || busy.value) return;
  voiceText.value = '';

  if (mode.value === 'bill') {
    await parseBill(text);
  } else {
    await sendChat(text);
  }

  await nextTick();
  scrollTop.value = 99999;
}

async function sendChat(message: string) {
  await aiStore.sendMessage(message);
  await nextTick();
  scrollTop.value = 99999;
}

/** 从 AI 米粒统一入口跳转：非记账意图时带文案进入对话 */
onLoad(async (options: Record<string, string | undefined>) => {
  let text = '';
  if (options?.from === 'mili_bridge') {
    try {
      text = String(uni.getStorageSync('MILI_VOICE_PREFILL') || '').trim();
      uni.removeStorageSync('MILI_VOICE_PREFILL');
    } catch {
      /* ignore */
    }
  } else if (typeof options?.prefill === 'string' && options.prefill.trim()) {
    try {
      text = decodeURIComponent(options.prefill).trim();
    } catch {
      text = options.prefill.trim();
    }
  }
  if (!text) return;

  mode.value = 'chat';
  await nextTick();
  await sendChat(text);
  scrollTop.value = 99999;
});

async function parseBill(text: string) {
  aiStore.chatMessages.push({ role: 'user', content: text });
  parsing.value = true;
  try {
    const result = await aiApi.parseBill(text);
    if (!result.transactions.length) {
      aiStore.chatMessages.push({ role: 'assistant', content: '没有识别到账单，换个说法试试？' });
      return;
    }
    aiStore.setParsed(text, result.logId, result.transactions);
    const summary = result.transactions
      .map((t) => `${t.remark || t.category} ¥${t.amount}`)
      .join('、');
    aiStore.chatMessages.push({
      role: 'assistant',
      content: `识别到 ${result.transactions.length} 笔账单：${summary}。正在跳转确认页...`
    });
    setTimeout(() => {
      uni.navigateTo({ url: '/pages/ai-confirm/index' });
    }, 800);
  } catch {
    aiStore.chatMessages.push({ role: 'assistant', content: '识别失败，请稍后重试' });
  } finally {
    parsing.value = false;
  }
}

function startRecord() {
  if (busy.value) return;
  voiceText.value = '';
  recording.value = true;

  // #ifdef MP-WEIXIN
  startRecordWx();
  // #endif
  // #ifndef MP-WEIXIN
  startRecordH5();
  // #endif
}

function stopRecord() {
  recording.value = false;

  // #ifdef MP-WEIXIN
  stopRecordWx();
  // #endif
  // #ifndef MP-WEIXIN
  stopRecordH5();
  // #endif
}

// ====== 小程序：微信同声传译插件 ======
// #ifdef MP-WEIXIN
function initWxRecord() {
  if (wxRecordManager) return;
  const plugin = requirePlugin('WechatSI');
  wxRecordManager = plugin.getRecordRecognitionManager();

  wxRecordManager.onStart = () => {
    console.log('[WxVoice] 开始录音识别');
  };

  wxRecordManager.onStop = (res: any) => {
    recording.value = false;
    const text = res.result || '';
    voiceText.value = text;
    if (text) {
      submitVoiceText(text);
    } else {
      uni.showToast({ title: '未识别到语音，请重试', icon: 'none' });
    }
  };

  wxRecordManager.onError = (res: any) => {
    recording.value = false;
    console.error('[WxVoice] error:', res.msg);
    uni.showToast({ title: '语音识别失败，请重试', icon: 'none' });
  };
}

function startRecordWx() {
  initWxRecord();
  wxRecordManager.start({ duration: 60000, lang: 'zh_CN' });
}

function stopRecordWx() {
  if (wxRecordManager) {
    wxRecordManager.stop();
  }
}
// #endif

// ====== H5：Web Speech API ======
// #ifndef MP-WEIXIN
function startRecordH5() {
  try {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      recording.value = false;
      uni.showToast({ title: '当前浏览器不支持语音，请用文字输入', icon: 'none' });
      inputMode.value = 'text';
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (e: any) => {
      let final = '';
      let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript;
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      voiceText.value = final || interim;
    };

    recognition.onerror = () => {
      recording.value = false;
      if (!voiceText.value) {
        uni.showToast({ title: '未识别到语音，请重试', icon: 'none' });
      }
    };

    recognition.onend = () => {
      recording.value = false;
      if (voiceText.value) {
        submitVoiceText(voiceText.value);
      }
    };

    recognition.start();
  } catch {
    recording.value = false;
    uni.showToast({ title: '语音功能不可用，请用文字输入', icon: 'none' });
    inputMode.value = 'text';
  }
}

function stopRecordH5() {
  if (recognition) {
    try { recognition.stop(); } catch { /* ignore */ }
  }
}
// #endif
</script>

<style scoped>
/* 导航 */
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16rpx;
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
  top: 0; right: 0; bottom: 0; left: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1rpx solid rgba(255, 255, 255, 0.5);
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
  font-weight: 800;
  color: #1e1e1e;
}
.nav-placeholder { width: 60rpx; }

/* 聊天区 */
.chat-area {
  height: calc(100vh - 560rpx);
  margin-top: 16rpx;
}

.chat-bottom-space {
  height: 60rpx;
}

/* 消息 */
.msg {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  margin-bottom: 28rpx;
}

.msg-me {
  flex-direction: row-reverse;
}

.msg-avatar {
  flex-shrink: 0;
  width: 64rpx;
  height: 64rpx;
}

.avatar-face {
  position: relative;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #00d4c8, #7cbcff);
}

.av-eye {
  position: absolute;
  top: 22rpx;
  width: 10rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #fff;
}

.av-eye.l { left: 18rpx; }
.av-eye.r { right: 18rpx; }

.msg-bubble {
  max-width: 72%;
  padding: 20rpx 24rpx;
  border-radius: 24rpx;
}

.bubble-ai {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 4rpx 24rpx 24rpx 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.bubble-me {
  background: #00d4c8;
  border-radius: 24rpx 4rpx 24rpx 24rpx;
}

.bubble-me .msg-text {
  color: #fff;
}

.msg-text {
  display: block;
  font-size: 28rpx;
  line-height: 1.6;
  color: #344054;
  word-break: break-all;
}

.msg-text + .msg-text {
  margin-top: 6rpx;
}

/* 打字动画 */
.typing-dots {
  display: flex;
  gap: 10rpx;
  padding: 8rpx 0;
}

.dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #00d4c8;
  animation: bounce 1.2s infinite;
}

.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-10rpx); opacity: 1; }
}

/* 快捷建议 */
.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 16rpx;
  padding-left: 80rpx;
}

.suggestion-chip {
  padding: 12rpx 28rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  font-size: 24rpx;
  color: #344054;
}

/* ===== 底部输入区 ===== */
.bottom-area {
  position: fixed;
  z-index: 20;
  left: 0;
  right: 0;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 24rpx);
  padding: 0 24rpx;
}

/* ── 文字输入模式 ── */
.text-bar {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.text-bar-inner {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 10rpx 10rpx 10rpx 24rpx;
  border-radius: 44rpx;
  background: #fff;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.chat-input {
  flex: 1;
  height: 64rpx;
  font-size: 28rpx;
  color: #1e1e1e;
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 100rpx;
  height: 64rpx;
  padding: 0 24rpx;
  border-radius: 32rpx;
  background: #00d4c8;
  color: #fff;
  font-size: 26rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.send-btn.disabled {
  opacity: 0.4;
}

.switch-voice {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  flex-shrink: 0;
}

/* ── 语音输入模式 ── */
.voice-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.voice-preview {
  font-size: 28rpx;
  color: #344054;
  padding: 12rpx 32rpx;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 24rpx;
  max-width: 80%;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

/* 录音状态 */
.record-status {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 14rpx 32rpx;
  border-radius: 32rpx;
  background: rgba(0, 212, 200, 0.08);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.wave-bars {
  display: flex;
  align-items: center;
  gap: 6rpx;
  height: 48rpx;
}

.wave-bar {
  width: 6rpx;
  border-radius: 3rpx;
  background: linear-gradient(180deg, #00d4c8, #34d399);
  animation: waveAnim 0.6s ease-in-out infinite alternate;
}

.wave-bar:nth-child(1) { height: 12rpx; }
.wave-bar:nth-child(2) { height: 20rpx; }
.wave-bar:nth-child(3) { height: 32rpx; }
.wave-bar:nth-child(4) { height: 44rpx; }
.wave-bar:nth-child(5) { height: 32rpx; }
.wave-bar:nth-child(6) { height: 20rpx; }
.wave-bar:nth-child(7) { height: 12rpx; }

@keyframes waveAnim {
  0% { transform: scaleY(0.4); }
  100% { transform: scaleY(1.2); }
}

.record-text {
  font-size: 26rpx;
  color: #00a99f;
  font-weight: 600;
}

/* 麦克风舞台 */
.mic-stage {
  position: relative;
  width: 260rpx;
  height: 260rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 脉冲波纹 */
.mic-ripple {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  border-radius: 50%;
  border: 2rpx solid rgba(0, 212, 200, 0.3);
  animation: rippleExpand 2s ease-out infinite;
}

.mic-ripple.r2 { animation-delay: 0.6s; }
.mic-ripple.r3 { animation-delay: 1.2s; }

@keyframes rippleExpand {
  0% { transform: scale(0.6); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}

/* 主按钮 */
.mic-btn {
  position: relative;
  z-index: 3;
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  padding: 8rpx;
  background: linear-gradient(135deg, rgba(0, 212, 200, 0.15), rgba(52, 211, 153, 0.15));
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mic-btn.active {
  transform: scale(1.12);
  background: linear-gradient(135deg, rgba(0, 212, 200, 0.25), rgba(52, 211, 153, 0.25));
}

.mic-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(145deg, #00d4c8, #28c9a0);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 8rpx 32rpx rgba(0, 212, 200, 0.4),
    inset 0 4rpx 12rpx rgba(255, 255, 255, 0.25);
  transition: all 0.3s;
}

.mic-btn.active .mic-inner {
  background: linear-gradient(145deg, #00e8d8, #34d399);
  box-shadow:
    0 12rpx 48rpx rgba(0, 212, 200, 0.55),
    inset 0 4rpx 16rpx rgba(255, 255, 255, 0.3);
}

.mic-svg {
  display: flex;
  align-items: center;
  justify-content: center;
}

.mic-glyph {
  font-size: 72rpx;
  transition: transform 0.3s;
}

.mic-btn.active .mic-glyph {
  transform: scale(1.15);
}

/* 提示文字 */
.mic-tip {
  font-size: 26rpx;
  color: #88909b;
  font-weight: 500;
  letter-spacing: 2rpx;
}

/* 切换到文字输入 */
.switch-text {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 28rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.switch-text-icon {
  font-size: 28rpx;
}

.switch-text-label {
  font-size: 24rpx;
  color: #88909b;
}

/* ── 滑动切换指示器 ── */
.slide-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32rpx;
  width: 100%;
}

.slide-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  opacity: 0.35;
  transition: all 0.3s ease;
}

.slide-label.active {
  opacity: 0.7;
}

.slide-label.dragging {
  opacity: 1;
  transform: scale(1.15);
}

.slide-label text:first-child {
  font-size: 40rpx;
}

.slide-label-text {
  font-size: 20rpx;
  color: #667085;
  font-weight: 600;
}

.slide-label.active .slide-label-text {
  color: #00a99f;
}

.slide-label.dragging .slide-label-text {
  color: #00d4c8;
  font-weight: 700;
}

/* 模式指示器 */
.mode-indicator {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.mode-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #d0d5dd;
  transition: all 0.3s;
}

.mode-dot.active {
  background: #00d4c8;
  width: 20rpx;
  border-radius: 5rpx;
}
</style>
