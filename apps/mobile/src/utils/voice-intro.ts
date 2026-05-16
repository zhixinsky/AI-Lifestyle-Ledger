export const VOICE_INTRO_STORAGE_KEY = 'hasShownVoiceIntro';

export const VOICE_INTRO_MSG = {
  hello: '你好呀，我是AI米粒 ✨',
  invite:
    '允许麦克风后，\n你可以直接对我说：\n\n下午茶30\n今天买菜68\n帮我分析最近消费',
  granted: '太好啦，现在可以直接和我说话了 🎤',
  denied: '没关系，你也可以先打字和我聊天哦 ✨',
} as const;

export function hasShownVoiceIntro(): boolean {
  try {
    const v = uni.getStorageSync(VOICE_INTRO_STORAGE_KEY);
    return v === true || v === 'true' || v === 1;
  } catch {
    return false;
  }
}

export function markVoiceIntroShown() {
  try {
    uni.setStorageSync(VOICE_INTRO_STORAGE_KEY, true);
  } catch {
    /* ignore */
  }
}

export function hasRecordPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    uni.getSetting({
      success: (res) => resolve(!!res.authSetting?.['scope.record']),
      fail: () => resolve(false),
    });
  });
}

export function requestRecordPermission(): Promise<'granted' | 'denied'> {
  return new Promise((resolve) => {
    uni.authorize({
      scope: 'scope.record',
      success: () => resolve('granted'),
      fail: () => resolve('denied'),
    });
  });
}
