// ============================================================
// Smart Page Builder API — ارتباط با وب‌سرویس صفحات هوشمند + منابع داده
// ============================================================

import { API } from '@/src/shared-utils/functions';
import type { MediaFile, MediaFolderDto } from '../gallery/types';
import type {
  NewsCategory,
  NewsItem,
} from '@/src/shared-types';

// ===== SmartPage CRUD =====

export interface SmartPageDto {
  id?: number;
  title: string;
  slug: string;
  parent_id?: number | null;
  parent_slug?: string | null;
  sort_order?: number;
  /** انواع صفحهٔ اختصاصی‌ای که این صفحه به‌عنوان لایوت مشترکشان متصل است (یک صفحه می‌تواند هم‌زمان لایوتِ چند نوع باشد) */
  dedicated_page_types?: string[];
  status: 'published' | 'draft';
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    og_image?: string;
  } | null;
  schema: Record<string, unknown>;
  language?: string;
  translation_group?: string | null;
  author_name?: string | null;
  author_username?: string | null;
  author_role?: string | null;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

/** Admin list of pages (lightweight rows, no schema) */
export const fetchSmartPages = async (params: {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  lang?: string;
} = {}): Promise<PaginatedResponse<SmartPageDto>> => {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.search) qs.set('search', params.search);
  if (params.status) qs.set('status', params.status);
  if (params.lang) qs.set('lang', params.lang);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return API<PaginatedResponse<SmartPageDto>>(`smart-pages${suffix}`);
};

/** Admin single page (full schema) */
export const fetchSmartPage = async (id: number): Promise<SmartPageDto> => {
  const res = await API<{ data: SmartPageDto }>(`smart-pages/${id}`);
  return res.data;
};

/** لایوت مشترک (SmartPage) متصل به یک نوع صفحهٔ اختصاصی، اگر وجود داشته باشد */
export const getSmartPageForDedicatedPageType = async (
  pageType: string
): Promise<{ id: number; slug: string; status: 'published' | 'draft' } | null> => {
  const res = await API<{ data: { id: number; slug: string; status: 'published' | 'draft' } | null }>(
    `smart-pages/for-dedicated-page-type/${pageType}`
  );
  return res.data;
};

/** اتصال یک صفحهٔ Page Builder به‌عنوان لایوت مشترک یک نوع صفحهٔ اختصاصی — جایگزین اتصال قبلی همان نوع می‌شود، اما همان صفحه می‌تواند هم‌زمان لایوت انواع دیگر هم باشد */
export const linkDedicatedPageType = async (
  pageType: string,
  smartPageId: number
): Promise<{ message: string }> => {
  return API('smart-pages/dedicated-page-type-links', { page_type: pageType, smart_page_id: smartPageId }, 'POST');
};

/** قطع اتصال لایوتِ یک نوع صفحهٔ اختصاصی (خودِ صفحهٔ Page Builder حذف نمی‌شود) */
export const unlinkDedicatedPageType = async (pageType: string): Promise<{ message: string }> => {
  return API(`smart-pages/dedicated-page-type-links/${pageType}`, {}, 'DELETE');
};

/** Admin list of CHILD pages of a page (lightweight rows for the canvas widget) */
export const fetchSmartPageChildren = async (parentId: number): Promise<SmartPageDto[]> => {
  return API<SmartPageDto[]>(`smart-pages/${parentId}/children`);
};

/** A node of the recursive descendant tree of a page */
export interface SmartPageTreeNode extends SmartPageDto {
  children: SmartPageTreeNode[];
}

/** Admin TREE of ALL descendant pages (nested) — for the child-pages manager dialog */
export const fetchSmartPageChildrenTree = async (parentId: number): Promise<SmartPageTreeNode[]> => {
  return API<SmartPageTreeNode[]>(`smart-pages/${parentId}/children/tree`);
};

/** Create a new smart page */
export const createSmartPage = async (data: {
  title: string;
  slug: string;
  parent_id?: number | null;
  sort_order?: number;
  status?: 'published' | 'draft';
  seo?: SmartPageDto['seo'];
  schema: Record<string, unknown>;
  lang?: string;
}): Promise<{ message: string; data: SmartPageDto }> => {
  return API('smart-pages', data, 'POST');
};

/** Update a smart page */
export const updateSmartPage = async (
  id: number,
  data: Partial<{
    title: string;
    slug: string;
    parent_id?: number | null;
    sort_order?: number;
    status: 'published' | 'draft';
    seo: SmartPageDto['seo'];
    schema: Record<string, unknown>;
    lang: string;
  }>
): Promise<{ message: string; data: SmartPageDto }> => {
  return API(`smart-pages/${id}`, data, 'PUT');
};

/** Delete a smart page */
export const deleteSmartPage = async (id: number): Promise<{ message: string }> => {
  return API(`smart-pages/${id}`, {}, 'DELETE');
};

/** Duplicate a page into another language (copies the layout/content as a translation starting point) */
export const duplicateSmartPage = async (
  id: number,
  lang: string
): Promise<{ message: string; data: SmartPageDto }> => {
  return API(`smart-pages/${id}/duplicate`, { lang }, 'POST');
};

// ===== Data-source fetchers (هر بخش به وب‌سرویس مختص خود متصل می‌شود) =====

/** اخبار — برای ویجت news-feed */
export const fetchDataSourceNews = async (params: {
  page?: number;
  per_page?: number;
  category_id?: number | null;
  status?: string;
  lang?: string;
} = {}) => {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.category_id) qs.set('category_id', String(params.category_id));
  if (params.status) qs.set('status', params.status);
  if (params.lang) qs.set('lang', params.lang);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return API<PaginatedResponse<NewsItem>>(`news${suffix}`);
};

/** دسته‌بندی اخبار — برای فیلتر گروه در تنظیمات ویجت خبر */
export const fetchDataSourceNewsCategories = async (lang?: string): Promise<NewsCategory[]> => {
  const qs = lang ? `?lang=${lang}` : '';
  const res = await API<{ data: NewsCategory[] }>(`news-categories${qs}`);
  return res.data;
};

/** رسانه — برای ویجت‌های image-gallery و file-manager */
export const fetchDataSourceMedia = async (params: {
  per_page?: number;
  folder_id?: string | null;
  search?: string;
  type?: 'all' | 'image' | 'video' | 'audio' | 'document';
} = {}) => {
  const qs = new URLSearchParams();
  qs.set('page', '1');
  qs.set('per_page', String(params.per_page ?? 100));
  if (params.search) qs.set('search', params.search);
  if (params.folder_id) qs.set('folder_id', params.folder_id);
  if (params.type && params.type !== 'all') qs.set('type', params.type);
  return API<{
    data: MediaFile[];
    current_page: number;
    last_page: number;
    total: number;
  }>(`media?${qs.toString()}`);
};

/** پوشه‌های رسانه — برای فیلتر پوشه در تنظیمات ویجت گالری/فایل */
export const fetchDataSourceMediaFolders = async (): Promise<MediaFolderDto[]> => {
  const res = await API<{ data: MediaFolderDto[] }>('media/folders');
  return res.data;
};

// ===== Dedicated Pages blocks — اتصال به یک صفحهٔ اختصاصی مشخص =====

export interface DedicatedPageOption {
  id: number;
  title: string;
  page_type: string;
  slug: string;
}

/** فهرست صفحات اختصاصی — برای دراپ‌داون «انتخاب صفحهٔ اختصاصی» در پنل تنظیمات */
export const fetchDataSourceDedicatedPages = async (): Promise<DedicatedPageOption[]> => {
  const res = await API<{ data: DedicatedPageOption[] }>('dedicated-pages?per_page=200');
  return res.data;
};

export interface DedicatedPageContentItem {
  id: number;
  type: string;
  title: string;
  summary: string | null;
  content: string | null;
  category_slug: string | null;
  category_title: string | null;
  author: string;
  status: string;
  published_date: string | null;
  views: number;
  file_url: string | null;
  file_size: string | null;
  image_url: string | null;
  gallery_images?: string[] | null;
  /** فیلدهای اختصاصی نوع رویداد: instructor, event_time, location, registration_link, event_status */
  metadata?: Record<string, any> | null;
}

/** محتوای یک صفحهٔ اختصاصی، تفکیک‌شده براساس نوع — برای بلوک‌های dp-news/dp-announcements/dp-journal-issues/dp-articles/dp-gallery/dp-events */
export const fetchDedicatedPageContentsForWidget = async (
  pageId: number | string,
  type: string,
  limit: number,
  sort: 'asc' | 'desc' = 'desc'
): Promise<DedicatedPageContentItem[]> => {
  const qs = new URLSearchParams({ type, status: 'published', per_page: String(limit), sort });
  const res = await API<{ data: DedicatedPageContentItem[] }>(`dedicated-pages/${pageId}/contents?${qs.toString()}`);
  return res.data;
};

export interface DedicatedPageTaxonomyOption {
  id: number;
  slug: string;
  title: string;
}

/** دسته‌بندی‌های یک صفحهٔ اختصاصی — برای فیلتر دسته در تنظیمات بلوک گالری */
export const fetchDedicatedPageTaxonomiesForWidget = async (
  pageId: number | string
): Promise<DedicatedPageTaxonomyOption[]> => {
  const res = await API<{ data: DedicatedPageTaxonomyOption[] }>(`dedicated-pages/${pageId}/taxonomies`);
  return res.data;
};

export interface DedicatedPageMemberItem {
  id: number;
  name: string;
  role_title: string | null;
  field_of_study: string | null;
  email: string | null;
  image_url: string | null;
  sort_order: number;
}

/** اعضای شورای مرکزی/کادر اجرایی یک صفحهٔ اختصاصی — برای بلوک dp-members */
export const fetchDedicatedPageMembersForWidget = async (
  pageId: number | string
): Promise<DedicatedPageMemberItem[]> => {
  const res = await API<{ data: DedicatedPageMemberItem[] }>(`dedicated-pages/${pageId}/members`);
  return res.data;
};
