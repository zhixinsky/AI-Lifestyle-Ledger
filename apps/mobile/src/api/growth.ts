import { request } from '@/utils/request';
import type { Badge, Challenge } from '@/types/domain';

export const growthApi = {
  listBadges() {
    return request<Badge[]>('/growth/badges');
  },

  listChallenges() {
    return request<Challenge[]>('/growth/challenges');
  },

  joinChallenge(id: string) {
    return request('/growth/challenges/' + id + '/join', { method: 'POST' });
  },

  checkBadges() {
    return request<string[]>('/growth/check-badges', { method: 'POST' });
  },
};
