export type HubInputMode = 'voice' | 'text';

export const HUB_INPUT_MODE_KEY = 'mili_hub_input_mode';

export function readHubInputMode(): HubInputMode {
  try {
    const v = uni.getStorageSync(HUB_INPUT_MODE_KEY);
    return v === 'text' ? 'text' : 'voice';
  } catch {
    return 'voice';
  }
}

export function writeHubInputMode(mode: HubInputMode) {
  try {
    uni.setStorageSync(HUB_INPUT_MODE_KEY, mode);
  } catch {
    /* ignore */
  }
}
