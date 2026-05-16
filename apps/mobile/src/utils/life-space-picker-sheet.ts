import { ref } from 'vue';
import type { LifeSpace } from '@/types/domain';
import { normalizeLifeSpace } from '@/utils/life-space';

export type LifeSpacePickerExtra = {
  label: string;
  onPick: () => void;
};

const visible = ref(false);
const spaces = ref<LifeSpace[]>([]);
const currentId = ref('');
const title = ref('选择生活空间');
const extras = ref<LifeSpacePickerExtra[]>([]);

let onSelectCb: ((id: string) => void) | null = null;

export function useLifeSpacePickerSheetState() {
  return { visible, spaces, currentId, title, extras };
}

export function openLifeSpacePickerSheet(opts: {
  spaces: LifeSpace[];
  currentId?: string;
  title?: string;
  onSelect: (id: string) => void;
  extras?: LifeSpacePickerExtra[];
}) {
  spaces.value = opts.spaces.map((s) => normalizeLifeSpace(s));
  currentId.value = opts.currentId || '';
  title.value = opts.title || '选择生活空间';
  extras.value = opts.extras || [];
  onSelectCb = opts.onSelect;
  visible.value = true;
}

export function closeLifeSpacePickerSheet() {
  visible.value = false;
  onSelectCb = null;
  extras.value = [];
}

export function pickLifeSpaceFromSheet(id: string) {
  onSelectCb?.(id);
  closeLifeSpacePickerSheet();
}

export function pickLifeSpaceSheetExtra(extra: LifeSpacePickerExtra) {
  extra.onPick();
  closeLifeSpacePickerSheet();
}
