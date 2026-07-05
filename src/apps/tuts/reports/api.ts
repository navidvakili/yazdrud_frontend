// ============================================================
// Reports API — ارتباط با بک‌اند برای گزارشات ثبت‌نام
// ============================================================

import { API } from '@/src/shared-utils';
import { API_BASE_URL, TOKEN_STRING } from '@/src/shared-constants';
import type { CourseRegistration } from '@/src/shared-types';

export const reportsApi = {
  async getAllRegistrations(params?: {
    course_id?: number; status?: string; page?: number; per_page?: number;
    payment_method?: string; search?: string; year?: string; refunded?: string;
  }): Promise<{ data: CourseRegistration[]; meta: any; stats?: { total_confirmed: number; online_paid: number; bank_verified: number; total_amount: number } }> {
    const query = new URLSearchParams();
    if (params?.course_id) query.set('course_id', String(params.course_id));
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    if (params?.payment_method) query.set('payment_method', params.payment_method);
    if (params?.search) query.set('search', params.search);
    if (params?.year) query.set('year', params.year);
    if (params?.refunded) query.set('refunded', params.refunded);
    const qs = query.toString();
    const url = qs ? `courses/registrations?${qs}` : 'courses/registrations';
    return API<any>(url);
  },

  async exportRegistrations(params?: {
    course_id?: string; search?: string; year?: string;
    status?: string; payment_method?: string; refunded?: string;
  }): Promise<void> {
    const query = new URLSearchParams();
    if (params?.course_id) query.set('course_id', params.course_id);
    if (params?.search) query.set('search', params.search);
    if (params?.year) query.set('year', params.year);
    if (params?.status) query.set('status', params.status);
    if (params?.payment_method) query.set('payment_method', params.payment_method);
    if (params?.refunded) query.set('refunded', params.refunded);
    const qs = query.toString();
    const url = qs ? `courses/registrations/export?${qs}` : 'courses/registrations/export';
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
    a.download = 'registrations-report.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  },
};
