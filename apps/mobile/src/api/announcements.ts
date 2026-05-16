import { request } from '@/utils/request';

export type ActiveAnnouncement = {
  id: string;
  title: string;
  content: string;
  type: 'popup' | 'banner' | 'notice';
  position: string;
  requireRead: boolean;
  read: boolean;
};

export const announcementsApi = {
  getActive(position?: string) {
    const qs = position ? `?position=${encodeURIComponent(position)}` : '';
    return request<ActiveAnnouncement[]>(`/announcements/active${qs}`);
  },
  markRead(id: string) {
    return request(`/announcements/${id}/read`, { method: 'POST' });
  },
};
