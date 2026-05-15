import { ref } from 'vue';

export const VOICE_REPLY_STORAGE_KEY = 'voiceReplyEnabled';
const MAX_TTS_LENGTH = 80;

export const isSpeaking = ref(false);

let audioContext: UniApp.InnerAudioContext | null = null;
let resolveCurrent: (() => void) | null = null;

function normalizeSpeakText(text: string) {
  const compact = text.replace(/\s+/g, ' ').trim();
  return compact.length > MAX_TTS_LENGTH ? `${compact.slice(0, MAX_TTS_LENGTH)}...` : compact;
}

export function getVoiceReplyEnabled() {
  try {
    return uni.getStorageSync(VOICE_REPLY_STORAGE_KEY) === true;
  } catch {
    return false;
  }
}

export function setVoiceReplyEnabled(enabled: boolean) {
  try {
    uni.setStorageSync(VOICE_REPLY_STORAGE_KEY, enabled);
  } catch {
    /* ignore */
  }
}

function finishSpeaking() {
  isSpeaking.value = false;
  const resolve = resolveCurrent;
  resolveCurrent = null;
  resolve?.();
}

function getAudioContext() {
  if (audioContext) return audioContext;
  audioContext = uni.createInnerAudioContext();
  return audioContext;
}

function recreateAudioContext() {
  try {
    audioContext?.destroy();
  } catch {
    /* ignore */
  }
  audioContext = uni.createInnerAudioContext();
  return audioContext;
}

function textToSpeechMp(text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    try {
      const plugin = requirePlugin('WechatSI');
      plugin.textToSpeech({
        lang: 'zh_CN',
        tts: true,
        content: text,
        success: (res: { filename?: string }) => {
          if (res.filename) resolve(res.filename);
          else reject(new Error('TTS missing filename'));
        },
        fail: (err: unknown) => reject(err instanceof Error ? err : new Error(String(err))),
      });
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
    // #endif

    // #ifndef MP-WEIXIN
    reject(new Error('WechatSI is only available in WeChat Mini Program'));
    // #endif
  });
}

function speakWithWebApi(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
      reject(new Error('Speech synthesis unavailable'));
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.onend = () => {
      finishSpeaking();
      resolve();
    };
    utterance.onerror = () => {
      finishSpeaking();
      reject(new Error('Speech synthesis failed'));
    };
    resolveCurrent = resolve;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}

export async function speakText(text: string) {
  const content = normalizeSpeakText(text);
  if (!content) return;

  stopSpeak();
  isSpeaking.value = true;

  try {
    // #ifdef MP-WEIXIN
    const filename = await textToSpeechMp(content);
    await new Promise<void>((resolve, reject) => {
      const audio = recreateAudioContext();
      audio.src = filename;
      resolveCurrent = resolve;
      audio.onEnded(() => finishSpeaking());
      audio.onStop(() => finishSpeaking());
      audio.onError((err) => {
        finishSpeaking();
        reject(err instanceof Error ? err : new Error('语音播放失败'));
      });
      audio.play();
    });
    // #endif

    // #ifndef MP-WEIXIN
    await speakWithWebApi(content);
    // #endif
  } catch (err) {
    finishSpeaking();
    throw err;
  }
}

export function stopSpeak() {
  if (!isSpeaking.value && !audioContext) return;
  try {
    audioContext?.stop();
  } catch {
    /* ignore */
  }
  // #ifndef MP-WEIXIN
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  // #endif
  finishSpeaking();
}

export function destroyTts() {
  stopSpeak();
  try {
    audioContext?.destroy();
  } catch {
    /* ignore */
  }
  audioContext = null;
}
