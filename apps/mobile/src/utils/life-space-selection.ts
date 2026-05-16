import type { LifeSpace } from '@/types/domain';
import { stripLifeSpaceQuotes } from '@/utils/life-space';

export const STORAGE_CURRENT_LIFE_SPACE_ID = 'currentLifeSpaceId';
export const STORAGE_DEFAULT_LIFE_SPACE_ID = 'defaultLifeSpaceId';

function readId(key: string): string | null {
  try {
    const v = uni.getStorageSync(key);
    if (typeof v === 'string' && v.trim()) return v.trim();
    return null;
  } catch {
    return null;
  }
}

export function getCurrentLifeSpaceId(): string | null {
  return readId(STORAGE_CURRENT_LIFE_SPACE_ID);
}

export function setCurrentLifeSpaceId(id: string) {
  try {
    uni.setStorageSync(STORAGE_CURRENT_LIFE_SPACE_ID, id);
  } catch {
    /* ignore */
  }
}

export function getDefaultLifeSpaceId(): string | null {
  return readId(STORAGE_DEFAULT_LIFE_SPACE_ID);
}

export function setDefaultLifeSpaceId(id: string) {
  try {
    uni.setStorageSync(STORAGE_DEFAULT_LIFE_SPACE_ID, id);
  } catch {
    /* ignore */
  }
}

export function clearDefaultLifeSpaceId() {
  try {
    uni.removeStorageSync(STORAGE_DEFAULT_LIFE_SPACE_ID);
  } catch {
    /* ignore */
  }
}

function pickValidId(spaces: LifeSpace[], id: string | null): string | null {
  if (!id) return null;
  return spaces.some((s) => s.id === id) ? id : null;
}

/** 进入 AI米粒页时：default → current → 日常生活 */
export function resolveCurrentLifeSpaceId(spaces: LifeSpace[]): string {
  if (!spaces.length) return '';
  const daily = spaces.find((s) => s.type === 'daily') || spaces[0];
  return (
    pickValidId(spaces, getDefaultLifeSpaceId()) ||
    pickValidId(spaces, getCurrentLifeSpaceId()) ||
    daily.id
  );
}

export function resolveDefaultLifeSpaceLabel(spaces: LifeSpace[]): string {
  const id = getDefaultLifeSpaceId();
  if (!id) return '未设置（沿用上次选择）';
  const name = spaces.find((s) => s.id === id)?.name;
  return name ? stripLifeSpaceQuotes(name) : '未设置（沿用上次选择）';
}
