// ============================================================
// News API — توابع ارتباط با وب‌سرویس‌های اخبار
// ============================================================

import { API } from '@/src/shared-utils/functions';
import type { NewsItem, NewsCategory, NewsAnalytics, NewsComment } from '@/src/shared-types';

// ===== News CRUD =====

/** Get paginated news list with optional filters */
export async function fetchNews(params: {
  page?: number;
  per_page?: number;
  search?: string;
  category_id?: number | string;
  status?: string;
  target_audience?: string;
  sort?: string;
} = {}): Promise<{
  data: NewsItem[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.per_page) query.set('per_page', String(params.per_page));
  if (params.search) query.set('search', params.search);
  if (params.category_id) query.set('category_id', String(params.category_id));
  if (params.status) query.set('status', params.status);
  if (params.target_audience) query.set('target_audience', params.target_audience);
  if (params.sort) query.set('sort', params.sort);

  return API(`news?${query.toString()}`);
}

/** Get single news article with full content */
export async function fetchNewsById(id: number): Promise<{ data: NewsItem }> {
  return API(`news/${id}`);
}

/** Create a new news article */
export async function createNews(data: {
  title: string;
  summary?: string;
  content: string;
  category_id?: number | null;
  image_url?: string;
  status: 'published' | 'draft' | 'archived';
  target_audience?: 'all' | 'students' | 'professors' | 'staff';
  is_pinned?: boolean;
  tags?: string[];
  attachments?: { name: string; size: string; url: string }[];
}): Promise<{ message: string; data: NewsItem }> {
  return API('news', data, 'POST');
}

/** Update a news article */
export async function updateNews(id: number, data: Partial<{
  title: string;
  summary: string;
  content: string;
  category_id: number | null;
  image_url: string;
  status: 'published' | 'draft' | 'archived';
  target_audience?: 'all' | 'students' | 'professors' | 'staff';
  is_pinned: boolean;
  tags: string[];
  attachments: { name: string; size: string; url: string }[];
}>): Promise<{ message: string; data: NewsItem }> {
  return API(`news/${id}`, data, 'PUT');
}

/** Delete a news article */
export async function deleteNews(id: number): Promise<{ message: string }> {
  return API(`news/${id}`, {}, 'DELETE');
}

// ===== News Actions =====

/** Toggle pinned status */
export async function togglePin(id: number): Promise<{ message: string; data: { is_pinned: boolean } }> {
  return API(`news/${id}/toggle-pin`, {}, 'PUT');
}

/** Like a news article */
export async function likeNews(id: number): Promise<{ data: { likes_count: number } }> {
  return API(`news/${id}/like`, {}, 'POST');
}

/** Increment views count */
export async function incrementViews(id: number): Promise<{ data: { views_count: number } }> {
  return API(`news/${id}/views`, {}, 'POST');
}

// ===== Categories =====

/** Get all categories with news count */
export async function fetchCategories(): Promise<{ data: NewsCategory[] }> {
  return API('news-categories');
}

/** Create a new category */
export async function createCategory(data: {
  name: string;
  slug?: string;
  color?: string;
  description?: string;
}): Promise<{ message: string; data: NewsCategory }> {
  return API('news-categories', data, 'POST');
}

/** Update a category */
export async function updateCategory(id: number, data: Partial<{
  name: string;
  slug: string;
  color: string;
  description: string;
  is_active: boolean;
}>): Promise<{ message: string; data: NewsCategory }> {
  return API(`news-categories/${id}`, data, 'PUT');
}

/** Delete a category */
export async function deleteCategory(id: number): Promise<{ message: string }> {
  return API(`news-categories/${id}`, {}, 'DELETE');
}

// ===== Analytics =====

/** Get news analytics */
export async function fetchAnalytics(): Promise<{ data: NewsAnalytics }> {
  return API('news-analytics');
}

// ===== Comments Moderation =====

/** Get all comments (with optional filters) for moderation */
export async function fetchComments(params: {
  page?: number;
  per_page?: number;
  news_id?: number;
  status?: 'pending' | 'approved';
} = {}): Promise<{
  data: NewsComment[];
  current_page: number;
  last_page: number;
  total: number;
}> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.per_page) query.set('per_page', String(params.per_page));
  if (params.news_id) query.set('news_id', String(params.news_id));
  if (params.status) query.set('status', params.status);
  return API(`news-comments?${query.toString()}`);
}

/** Approve a comment */
export async function approveComment(id: number): Promise<{ message: string; data: { is_approved: boolean } }> {
  return API(`news-comments/${id}/approve`, {}, 'PUT');
}

/** Delete a comment */
export async function deleteComment(id: number): Promise<{ message: string }> {
  return API(`news-comments/${id}`, {}, 'DELETE');
}
