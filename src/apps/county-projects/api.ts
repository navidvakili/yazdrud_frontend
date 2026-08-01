// ============================================================
// County Projects API — توابع ارتباط با وب‌سرویس نقشه پروژه‌های عمرانی
// ============================================================

import { API } from '@/src/shared-utils/functions';
import type { CountyProject } from '@/src/shared-types';

/** Get all county projects (admin — with pagination & search) */
export async function fetchCountyProjects(params: {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
} = {}): Promise<{
  data: CountyProject[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}> {
  const query = new URLSearchParams();
  query.set('lang', 'fa');
  if (params.page) query.set('page', String(params.page));
  if (params.per_page) query.set('per_page', String(params.per_page));
  if (params.search) query.set('search', params.search);
  if (params.is_active !== undefined) query.set('is_active', params.is_active ? '1' : '0');

  return API(`admin/county-projects?${query.toString()}`);
}

/** Update a single county project */
export async function updateCountyProject(
  id: number,
  data: Partial<CountyProject>
): Promise<{ message: string; data: CountyProject }> {
  return API(`admin/county-projects/${id}`, { ...data, lang: 'fa' }, 'PUT');
}

/** Batch update multiple county projects at once */
export async function updateCountyProjectsBatch(
  counties: Partial<CountyProject>[]
): Promise<{ message: string; data: CountyProject[] }> {
  return API('admin/county-projects/batch', { counties, lang: 'fa' }, 'PUT');
}
