// ============================================================
// Hero Slides API — توابع ارتباط با وب‌سرویس اسلایدر صفحه اصلی
// ============================================================

import { API } from '@/src/shared-utils/functions';
import type { HeroSlide } from '@/src/shared-types';

/** Get all slides (admin — with pagination & search) */
export async function fetchSlides(params: {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
} = {}): Promise<{
  data: HeroSlide[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.per_page) query.set('per_page', String(params.per_page));
  if (params.search) query.set('search', params.search);
  if (params.is_active !== undefined) query.set('is_active', params.is_active ? '1' : '0');

  return API(`admin/hero-slides?${query.toString()}`);
}

/** Create a new slide */
export async function createSlide(
  data: Partial<HeroSlide>
): Promise<{ message: string; data: HeroSlide }> {
  return API('admin/hero-slides', data, 'POST');
}

/** Update an existing slide */
export async function updateSlide(
  id: number,
  data: Partial<HeroSlide>
): Promise<{ message: string; data: HeroSlide }> {
  return API(`admin/hero-slides/${id}`, data, 'PUT');
}

/** Delete a slide */
export async function deleteSlide(
  id: number
): Promise<{ message: string }> {
  return API(`admin/hero-slides/${id}`, {}, 'DELETE');
}

/** Reorder slides */
export async function reorderSlides(
  slides: { id: number; sort_order: number }[]
): Promise<{ message: string }> {
  return API('admin/hero-slides/reorder', { slides }, 'PUT');
}
