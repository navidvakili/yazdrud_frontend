// ============================================================
// Certificates API — ارتباط با بک‌اند برای صدور گواهی
// ============================================================

import { API } from '@/src/shared-utils';
import { API_BASE_URL, TOKEN_STRING } from '@/src/shared-constants';

export const certificatesApi = {
  async getCertificateRegistrations(params?: {
    course_id?: number; certificate_status?: string; has_certificate?: boolean;
    search?: string; page?: number; per_page?: number;
  }): Promise<{ data: any[]; meta: any }> {
    const query = new URLSearchParams();
    if (params?.course_id) query.set('course_id', String(params.course_id));
    if (params?.certificate_status) query.set('certificate_status', params.certificate_status);
    if (params?.has_certificate !== undefined) query.set('has_certificate', String(params.has_certificate));
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    const qs = query.toString();
    const url = qs ? `certificates?${qs}` : 'certificates';
    return API<any>(url);
  },

  async approveCertificate(registerId: string): Promise<any> {
    const data = await API<any>(`certificates/approve/${registerId}`, {}, 'POST');
    return data;
  },

  async rejectCertificate(registerId: string): Promise<any> {
    const data = await API<any>(`certificates/reject/${registerId}`, {}, 'POST');
    return data;
  },

  async approveAllCertificates(courseId: number): Promise<any> {
    const data = await API<any>('certificates/approve-all', { course_id: courseId }, 'POST');
    return data;
  },

  async downloadAllCertificates(courseId?: number): Promise<Blob> {
    const token = localStorage.getItem(TOKEN_STRING);
    const params = courseId ? `?course_id=${courseId}` : '';
    const response = await fetch(`${API_BASE_URL}/certificates/download-all${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'خطا در دریافت فایل فشرده');
    }
    return response.blob();
  },
};
