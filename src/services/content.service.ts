import axiosInstance from '../lib/axios';

export interface Article {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  body?: string;
  coverImage?: string | null;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string | null;
  authorName?: string;
  isFeatured: boolean;
  views: number;
  updatedAt: string;
}

export interface Short {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnail?: string | null;
  durationSec: number;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string | null;
  views: number;
  likes: number;
  updatedAt: string;
}

export const ARTICLE_CATEGORIES = ['general', 'match-report', 'analysis', 'preview', 'tournament', 'transfers', 'rules', 'venues', 'interview'];

type Page<T> = { result: T[]; pagination: { page: number; total: number; totalPages: number } };
const unwrap = <T,>(res: any): T => res.data?.data;

export const contentService = {
  async listArticles(params: Record<string, any>) {
    return unwrap<Page<Article>>(await axiosInstance.get('/admin/news', { params }));
  },
  async getArticle(id: string) {
    return unwrap<{ result: Article }>(await axiosInstance.get(`/admin/news/${id}`)).result;
  },
  async saveArticle(id: string | null, dto: Record<string, any>) {
    const res = id ? await axiosInstance.patch(`/admin/news/${id}`, dto) : await axiosInstance.post('/admin/news', dto);
    return unwrap<{ result: Article }>(res).result;
  },
  async deleteArticle(id: string) {
    await axiosInstance.delete(`/admin/news/${id}`);
  },

  async listShorts(params: Record<string, any>) {
    return unwrap<Page<Short>>(await axiosInstance.get('/admin/shorts', { params }));
  },
  async saveShort(id: string | null, dto: Record<string, any>) {
    const res = id ? await axiosInstance.patch(`/admin/shorts/${id}`, dto) : await axiosInstance.post('/admin/shorts', dto);
    return unwrap<{ result: Short }>(res).result;
  },
  async deleteShort(id: string) {
    await axiosInstance.delete(`/admin/shorts/${id}`);
  },
};

/** Backend validation errors arrive as { message: string | string[] } */
export function errorText(e: any, fallback: string): string {
  const m = e?.response?.data?.message ?? e?.response?.data?.userMessage;
  return Array.isArray(m) ? m.join(', ') : m || fallback;
}
