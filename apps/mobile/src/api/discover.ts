import { request } from '@/utils/request';
import type { Article } from '@/types/domain';

export const discoverApi = {
  listArticles(category?: string, page = 1) {
    const parts: string[] = [`page=${page}`];
    if (category) parts.push(`category=${encodeURIComponent(category)}`);
    return request<{ items: Article[]; total: number }>(`/discover/articles?${parts.join('&')}`);
  },

  getArticle(id: string) {
    return request<Article>(`/discover/articles/${id}`);
  },
};
