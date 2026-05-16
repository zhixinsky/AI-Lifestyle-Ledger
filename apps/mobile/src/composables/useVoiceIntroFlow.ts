import { ref } from 'vue';
import {
  VOICE_INTRO_MSG,
  hasRecordPermission,
  hasShownVoiceIntro,
  markVoiceIntroShown,
  requestRecordPermission,
} from '@/utils/voice-intro';

export interface VoiceIntroMessage {
  id: string;
  fullText: string;
  displayText: string;
  typing: boolean;
}

export function useVoiceIntroFlow() {
  const active = ref(false);
  const messages = ref<VoiceIntroMessage[]>([]);
  const showAuthBtn = ref(false);
  const authLoading = ref(false);
  const celebration = ref(false);
  const finished = ref(false);

  let timers: ReturnType<typeof setTimeout>[] = [];
  let typeTimer: ReturnType<typeof setTimeout> | null = null;
  let destroyed = false;

  function clearAllTimers() {
    timers.forEach((t) => clearTimeout(t));
    timers = [];
    if (typeTimer) {
      clearTimeout(typeTimer);
      typeTimer = null;
    }
  }

  function delay(ms: number) {
    return new Promise<void>((resolve) => {
      const t = setTimeout(() => resolve(), ms);
      timers.push(t);
    });
  }

  function typeMessage(msgId: string, text: string, speed = 52): Promise<void> {
    return new Promise((resolve) => {
      const row = messages.value.find((m) => m.id === msgId);
      if (!row) {
        resolve();
        return;
      }
      row.typing = true;
      row.displayText = '';
      let i = 0;
      const tick = () => {
        if (destroyed) {
          resolve();
          return;
        }
        if (i < text.length) {
          row.displayText += text[i];
          i += 1;
          typeTimer = setTimeout(tick, speed);
        } else {
          row.typing = false;
          typeTimer = null;
          resolve();
        }
      };
      tick();
    });
  }

  function addMessage(id: string, fullText: string) {
    messages.value.push({
      id,
      fullText,
      displayText: '',
      typing: false,
    });
  }

  async function runWelcomeSequence() {
    active.value = true;
    finished.value = false;
    showAuthBtn.value = false;
    messages.value = [];

    addMessage('hello', VOICE_INTRO_MSG.hello);
    await typeMessage('hello', VOICE_INTRO_MSG.hello);
    if (destroyed) return;

    await delay(800);
    if (destroyed) return;

    addMessage('invite', VOICE_INTRO_MSG.invite);
    await typeMessage('invite', VOICE_INTRO_MSG.invite, 48);
    if (destroyed) return;

    showAuthBtn.value = true;
  }

  async function tryStart(openPanel: () => void): Promise<boolean> {
    if (hasShownVoiceIntro()) return false;

    // #ifndef MP-WEIXIN
    markVoiceIntroShown();
    return false;
    // #endif

    // #ifdef MP-WEIXIN
    if (await hasRecordPermission()) {
      markVoiceIntroShown();
      return false;
    }

    destroyed = false;
    messages.value = [];
    showAuthBtn.value = false;
    celebration.value = false;
    finished.value = false;
    openPanel();
    void runWelcomeSequence();
    return true;
    // #endif
  }

  async function authorize(): Promise<void> {
    if (authLoading.value || finished.value) return;
    authLoading.value = true;
    showAuthBtn.value = false;

    const result = await requestRecordPermission();
    if (destroyed) return;

    if (result === 'granted') {
      addMessage('result', VOICE_INTRO_MSG.granted);
      await typeMessage('result', VOICE_INTRO_MSG.granted, 50);
      if (!destroyed) {
        celebration.value = true;
      }
    } else {
      addMessage('result', VOICE_INTRO_MSG.denied);
      await typeMessage('result', VOICE_INTRO_MSG.denied, 50);
    }

    authLoading.value = false;
    finished.value = true;
    markVoiceIntroShown();
  }

  function destroy() {
    destroyed = true;
    clearAllTimers();
    active.value = false;
    showAuthBtn.value = false;
    authLoading.value = false;
    messages.value = [];
  }

  function dismissCelebration() {
    celebration.value = false;
  }

  return {
    active,
    messages,
    showAuthBtn,
    authLoading,
    celebration,
    finished,
    tryStart,
    authorize,
    destroy,
    dismissCelebration,
  };
}
