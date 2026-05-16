import { computed, ref } from 'vue';
import { lifeSpaceApi } from '@/api/life-spaces';
import type { LifeSpace } from '@/types/domain';
import {
  resolveCurrentLifeSpaceId,
  setCurrentLifeSpaceId,
} from '@/utils/life-space-selection';

export function useLifeSpaceContext() {
  const spaces = ref<LifeSpace[]>([]);
  const currentId = ref('');
  const loading = ref(false);

  const showPicker = computed(() => spaces.value.length > 1);
  const currentSpace = computed(() => spaces.value.find((s) => s.id === currentId.value));
  const currentName = computed(() => currentSpace.value?.name || '日常生活');

  async function load() {
    loading.value = true;
    try {
      const list = await lifeSpaceApi.list();
      spaces.value = list.filter((s) => s.isVisible !== false);
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

  function openPicker(onSelect?: (id: string) => void) {
    if (spaces.value.length <= 1) return;
    uni.showActionSheet({
      itemList: spaces.value.map((s) => s.name),
      success: (res) => {
        const picked = spaces.value[res.tapIndex];
        if (!picked) return;
        if (onSelect) onSelect(picked.id);
        else select(picked.id);
      },
    });
  }

  return {
    spaces,
    currentId,
    loading,
    showPicker,
    currentSpace,
    currentName,
    load,
    select,
    openPicker,
  };
}
