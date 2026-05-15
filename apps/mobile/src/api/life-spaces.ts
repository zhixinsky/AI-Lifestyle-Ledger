import { request } from '@/utils/request';
import type { BookType, LifeSpace } from '@/types/domain';

export interface HomeCardSetting {
  key: string;
  sort: number;
  isVisible: boolean;
}

export const lifeSpaceApi = {
  list() {
    return request<LifeSpace[]>('/life-spaces');
  },
  create(type: BookType) {
    return request<LifeSpace>('/life-spaces', { method: 'POST', data: { type } });
  },
  updateSettings(items: Array<{ id: string; sort?: number; isVisible?: boolean }>) {
    return request<LifeSpace[]>('/life-spaces/settings', { method: 'POST', data: { items } });
  },
  homeCards() {
    return request<HomeCardSetting[]>('/life-spaces/home-cards');
  },
  updateHomeCards(items: Array<{ key: string; sort?: number; isVisible?: boolean }>) {
    return request<HomeCardSetting[]>('/life-spaces/home-cards', { method: 'POST', data: { items } });
  },
};
