// ============================================================
// Stats API — ارتباط با بک‌اند برای آمار و نمودارها
// ============================================================

import { API } from '@/src/shared-utils';
import type { DetailedCourseStats } from '@/src/shared-types';

export const statsApi = {
  async getDetailedCourseStatistics(params?: { year?: string; course_id?: string }): Promise<DetailedCourseStats> {
    let url = 'courses/statistics/detailed';
    if (params?.year || params?.course_id) {
      const qs = new URLSearchParams();
      if (params.year) qs.set('year', params.year);
      if (params.course_id) qs.set('course_id', params.course_id);
      url += '?' + qs.toString();
    }
    const data = await API<any>(url);
    return data.data;
  },
};
