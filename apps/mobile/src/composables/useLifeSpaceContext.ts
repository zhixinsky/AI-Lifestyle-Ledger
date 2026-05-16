import { computed, ref } from 'vue';
import { lifeSpaceApi } from '@/api/life-spaces';
import type { LifeSpace } from '@/types/domain';
import {
  resolveCurrentLifeSpaceId,
  setCurrentLifeSpaceId,
} from '@/utils/life-space-selection';
import { normalizeLifeSpace, resolveLifeSpaceColor, stripLifeSpaceQuotes } from '@/utils/life-space';
export function useLifeSpaceContext() {
  const spaces = ref<LifeSpace[]>([]);
  const currentId = ref('');
  const loading = ref(false);

  const showPicker = computed(() => spaces.value.length > 1);
  const currentSpace = computed(() => spaces.value.find((s) => s.id === currentId.value));
  const currentName = computed(() =>
    stripLifeSpaceQuotes(currentSpace.value?.name || '日常生活'),
  );
  const currentColor = computed(() => {
    const s = currentSpace.value;
    return s ? resolveLifeSpaceColor(s) : resolveLifeSpaceColor({ type: 'daily', color: '' });
  });

  async function load() {
    loading.value = true;
    try {
      const list = await lifeSpaceApi.list();
      spaces.value = list
        .filter((s) => s.isVisible !== false)
        .map((s) => normalizeLifeSpace(s));
      currentId.value = resolveCurrentLifeSpaceId(spaces.value);
    } catch {
      spaces.value = [];
      currentId.value = '';
    } finally {
      loading.value = false;
    }
  }

  function select(id: string, persist = true) {
    if (!spaces.value.some((s) => s.id === id)) return;
    currentId.value = id;
    if (persist) setCurrentLifeSpaceId(id);
  }

  return {
    spaces,
    currentId,
    loading,
    showPicker,
    currentSpace,
    currentName,
    currentColor,
    load,
    select,
  };
}
