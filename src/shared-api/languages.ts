// ============================================================
// Languages API — مدیریت زبان‌های محتوا
// ============================================================

import { API } from '@/src/shared-utils/functions';
import type { Language, LanguagePayload } from '@/src/shared-types';

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

/** Get all languages (admin) */
export const fetchLanguages = async (params: { page?: number; per_page?: number; search?: string } = {}) => {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.search) qs.set('search', params.search);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return API<PaginatedResponse<Language>>(`languages${suffix}`);
};

/** Create a new language */
export const createLanguage = async (data: LanguagePayload) => {
  return API<{ data: Language; message?: string }>('languages', data, 'POST');
};

/** Update an existing language */
export const updateLanguage = async (id: number, data: Partial<LanguagePayload>) => {
  return API<{ data: Language; message?: string }>(`languages/${id}`, data, 'PUT');
};

/** Delete a language */
export const deleteLanguage = async (id: number) => {
  return API<{ message: string }>(`languages/${id}`, {}, 'DELETE');
};

/** Get the raw content of a language's locale file (public site .ts) */
export const fetchLocale = async (code: string) => {
  return API<{ data: { code: string; content: string } }>(`languages/${code}/locale`);
};

/** Save the raw content of a language's locale file (public site .ts) */
export const saveLocale = async (code: string, content: string) => {
  return API<{ message: string }>(`languages/${code}/locale`, { content }, 'PUT');
};
