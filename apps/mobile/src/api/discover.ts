import { request } from '@/utils/request';
import type { Article } from '@/types/domain';

export const discoverApi = {
  listArticles(category?: string, page = 1) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    params.set('page', String(page));
    return request<{ items: Article[]; total: number }>(`/discover/articles?${params}`);
  },

  getArticle(id: string) {
    return request<Article>(`/discover/articles/${id}`);
  },
};
