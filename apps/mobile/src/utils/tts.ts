import { ref } from 'vue';

export const VOICE_REPLY_STORAGE_KEY = 'voiceReplyEnabled';

/** 微信同声传译单次合成建议不超过约 100 字，超出需分段 */
const WECHAT_TTS_CHUNK_SIZE = 100;

export const isSpeaking = ref(false);

let audioContext: UniApp.InnerAudioContext | null = null;
let resolveCurrent: (() => void) | null = null;
let speakSessionId = 0;

function normalizeSpeakText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

/** 按标点优先切分，保证长回复能完整朗读 */
export function splitTextForTts(text: string, maxLen = WECHAT_TTS_CHUNK_SIZE): string[] {
  const compact = normalizeSpeakText(text);
  if (!compact) return [];
  if (compact.length <= maxLen) return [compact];

  const chunks: string[] = [];
  const parts = compact.split(/(?<=[。！？；.!?;])/);

  let buf = '';
  const flush = () => {
    const piece = buf.trim();
    if (piece) chunks.push(piece);
    buf = '';
  };

  const pushHardSlices = (segment: string) => {
    for (let i = 0; i < segment.length; i += maxLen) {
      const slice = segment.slice(i, i + maxLen).trim();
      if (slice) chunks.push(slice);
    }
  };

  for (const part of parts) {
    if (!part) continue;
    const candidate = buf + part;
    if (candidate.length <= maxLen) {
      buf = candidate;
      continue;
    }
    flush();
    if (part.length <= maxLen) {
      buf = part;
    } else {
      pushHardSlices(part);
    }
  }
  flush();
  return chunks.length ? chunks : [compact.slice(0, maxLen)];
}

export function readStorageFlag(key: string) {
  try {
    const value = uni.getStorageSync(key);
    return value === true || value === 1 || value === '1' || value === 'true';
  } catch {
    return false;
  }
}

/** 未设置过时默认开启，并写入本地持久化 */
export function getVoiceReplyEnabled() {
  try {
    const value = uni.getStorageSync(VOICE_REPLY_STORAGE_KEY);
    if (value === '' || value === undefined || value === null) {
      uni.setStorageSync(VOICE_REPLY_STORAGE_KEY, true);
      return true;
    }
    if (value === false || value === 0 || value === '0' || value === 'false') return false;
    return true;
  } catch {
    return true;
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
            resolve(res.filename);
          } else {
            reject(new Error('TTS missing filename'));
          }
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

function playAudioFileMp(filename: string, session: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (session !== speakSessionId) {
      resolve();
      return;
    }
    const audio = recreateAudioContext();
    const writableAudio = audio as UniApp.InnerAudioContext & {
      volume?: number;
      obeyMuteSwitch?: boolean;
      autoplay?: boolean;
    };
    writableAudio.volume = 1;
    writableAudio.obeyMuteSwitch = false;
    writableAudio.autoplay = false;
    audio.src = filename;
    const done = () => resolve();
    audio.onEnded(done);
    audio.onStop(done);
    audio.onError((err) => {
      console.error('[TTS] audio play failed:', err);
      reject(err instanceof Error ? err : new Error('语音播放失败'));
    });
    setTimeout(() => {
      if (session !== speakSessionId) {
        resolve();
        return;
      }
      audio.play();
    }, 60);
  });
}

async function speakChunkMp(chunk: string, session: number) {
  if (session !== speakSessionId || !chunk) return;
  const filename = await textToSpeechMp(chunk);
  if (session !== speakSessionId) return;
  await playAudioFileMp(filename, session);
}

async function speakChunksMp(chunks: string[], session: number) {
  configureMiniProgramAudio();
  for (let i = 0; i < chunks.length; i += 1) {
    if (session !== speakSessionId) return;
    await speakChunkMp(chunks[i], session);
    if (session !== speakSessionId) return;
    if (i < chunks.length - 1) {
      await new Promise<void>((r) => setTimeout(r, 80));
    }
  }
}

function speakWithWebApi(text: string, session: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (session !== speakSessionId) {
      resolve();
      return;
    }
    if (typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
      reject(new Error('Speech synthesis unavailable'));
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.onend = () => {
      if (session === speakSessionId) finishSpeaking();
      resolve();
    };
    utterance.onerror = () => {
      if (session === speakSessionId) finishSpeaking();
      reject(new Error('Speech synthesis failed'));
    };
    resolveCurrent = resolve;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}

export async function speakText(text: string) {
  const normalized = normalizeSpeakText(text);
  if (!normalized) return;

  speakSessionId += 1;
  const session = speakSessionId;
  stopSpeakInternal();
  isSpeaking.value = true;

  try {
    // #ifdef MP-WEIXIN
    const chunks = splitTextForTts(normalized);
    await speakChunksMp(chunks, session);
    // #endif

    // #ifndef MP-WEIXIN
    await speakWithWebApi(normalized, session);
    // #endif
  } catch (err) {
    if (session === speakSessionId) finishSpeaking();
    throw err;
  } finally {
    if (session === speakSessionId) {
      finishSpeaking();
    }
  }
}

function stopSpeakInternal() {
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
}

export function stopSpeak() {
  speakSessionId += 1;
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

/** 在用户交互时预热音频（如按住说话），提高后续自动播报成功率 */
export function warmupTtsAudio() {
  // #ifdef MP-WEIXIN
  configureMiniProgramAudio();
  // #endif
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
