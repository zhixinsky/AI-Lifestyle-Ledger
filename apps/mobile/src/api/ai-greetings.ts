import { request } from '@/utils/request';

export type GreetingPeriodParam =
  | 'midnight'
  | 'morning'
  | 'forenoon'
  | 'noon'
  | 'afternoon'
  | 'evening'
  | 'night';

export interface TodayGreetingResponse {
  enabled: boolean;
  title: string | null;
  subtitles: string[];
  source: 'ai' | 'default' | null;
}

export const aiGreetingsApi = {
  today(params: { period: GreetingPeriodParam; date?: string }) {
    const q = [`period=${encodeURIComponent(params.period)}`];
    if (params.date) q.push(`date=${encodeURIComponent(params.date)}`);
    return request<TodayGreetingResponse>(`/ai-greetings/today?${q.join('&')}`);
  },
};
