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

export function readStorageFlag(key: string) {
  try {
    const value = uni.getStorageSync(key);
    return value === true || value === 1 || value === '1' || value === 'true';
  } catch {
    return false;
  }
}

export function getVoiceReplyEnabled() {
  return readStorageFlag(VOICE_REPLY_STORAGE_KEY);
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

function recreateAudioContext() {
  try {
    audioContext?.destroy();
  } catch {
    /* ignore */
  }
  // #ifdef MP-WEIXIN
  audioContext = wx.createInnerAudioContext();
  // #endif

  // #ifndef MP-WEIXIN
  audioContext = uni.createInnerAudioContext();
  // #endif
  return audioContext;
}

function configureMiniProgramAudio() {
  // #ifdef MP-WEIXIN
  try {
    wx.setInnerAudioOption({
      obeyMuteSwitch: false,
      mixWithOther: true,
      success: () => console.log('[TTS] inner audio option ready'),
      fail: (err: unknown) => console.warn('[TTS] inner audio option failed:', err),
    });
  } catch (err) {
    console.warn('[TTS] setInnerAudioOption unavailable:', err);
  }
  // #endif
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
          if (res.filename) {
            console.log('[TTS] textToSpeech success:', res.filename);
            resolve(res.filename);
          }
          else reject(new Error('TTS missing filename'));
        },
        fail: (err: unknown) => {
          console.error('[TTS] textToSpeech failed:', err);
          reject(err instanceof Error ? err : new Error(String(err)));
        },
      });
    } catch (err) {
      console.error('[TTS] WechatSI unavailable:', err);
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
    configureMiniProgramAudio();
    const filename = await textToSpeechMp(content);
    await new Promise<void>((resolve, reject) => {
      const audio = recreateAudioContext();
      const writableAudio = audio as UniApp.InnerAudioContext & { volume?: number; obeyMuteSwitch?: boolean; autoplay?: boolean };
      writableAudio.volume = 1;
      writableAudio.obeyMuteSwitch = false;
      writableAudio.autoplay = false;
      audio.src = filename;
      resolveCurrent = resolve;
      audio.onPlay(() => {
        console.log('[TTS] audio play started');
      });
      audio.onEnded(() => finishSpeaking());
      audio.onStop(() => finishSpeaking());
      audio.onError((err) => {
        console.error('[TTS] audio play failed:', err);
        finishSpeaking();
        reject(err instanceof Error ? err : new Error('语音播放失败'));
      });
      setTimeout(() => audio.play(), 80);
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
