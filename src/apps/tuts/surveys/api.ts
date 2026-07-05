// ============================================================
// Surveys API — ارتباط با بک‌اند برای نظرسنجی دوره‌ها
// ============================================================

import { API } from '@/src/shared-utils';
import { API_BASE_URL, TOKEN_STRING } from '@/src/shared-constants';
import type { CourseSurvey, CourseSurveyStats } from '@/src/shared-types';

export const surveysApi = {
  async getSurveys(params?: { course_id?: number; search?: string; page?: number; per_page?: number }): Promise<{ data: CourseSurvey[]; meta: any }> {
    const query = new URLSearchParams();
    if (params?.course_id) query.set('course_id', String(params.course_id));
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    const qs = query.toString();
    const url = qs ? `surveys?${qs}` : 'surveys';
    return API<any>(url);
  },

  async getSurveyStatistics(): Promise<CourseSurveyStats> {
    const data = await API<any>('surveys/statistics');
    return data.data;
  },

  async deleteSurvey(id: number): Promise<void> {
    await API(`surveys/${id}`, {}, 'DELETE');
  },

  async exportSurveys(params?: { course_id?: string; search?: string; from_date?: string; to_date?: string }): Promise<void> {
    const query = new URLSearchParams();
    if (params?.course_id) query.set('course_id', params.course_id);
    if (params?.search) query.set('search', params.search);
    if (params?.from_date) query.set('from_date', params.from_date);
    if (params?.to_date) query.set('to_date', params.to_date);
    const qs = query.toString();
    const url = qs ? `surveys/export?${qs}` : 'surveys/export';
    const token = localStorage.getItem(TOKEN_STRING);
    const fullUrl = `${API_BASE_URL}/${url}`;
    const response = await fetch(fullUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Export failed');
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'survey-report.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  },
};
