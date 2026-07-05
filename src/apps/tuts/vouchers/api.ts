// ============================================================
// Vouchers API — ارتباط با بک‌اند برای بن‌های تخفیف
// ============================================================

import { API } from '@/src/shared-utils';
import type { CourseCoupon } from '@/src/shared-types';

export const vouchersApi = {
  // ========== Coupons / Vouchers (بن‌های تخفیف) ==========

  async getCoupons(params?: { page?: number; per_page?: number; is_active?: boolean }): Promise<{ data: CourseCoupon[]; meta: any }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    if (params?.is_active !== undefined) query.set('is_active', String(params.is_active));
    const qs = query.toString();
    const url = qs ? `coupons?${qs}` : 'coupons';
    return API<any>(url);
  },

  async getCoupon(id: number): Promise<CourseCoupon> {
    const data = await API<any>(`coupons/${id}`);
    return data.data;
  },

  async createCoupon(couponData: any): Promise<CourseCoupon> {
    const data = await API<any>('coupons', couponData, 'POST');
    return data.data;
  },

  async updateCoupon(id: number, couponData: any): Promise<CourseCoupon> {
    const data = await API<any>(`coupons/${id}`, couponData, 'PUT');
    return data.data;
  },

  async deleteCoupon(id: number): Promise<void> {
    await API(`coupons/${id}`, {}, 'DELETE');
  },

  async generateCouponCode(params?: { length?: number; prefix?: string }): Promise<{ code: string }> {
    const query = new URLSearchParams();
    if (params?.length) query.set('length', String(params.length));
    if (params?.prefix) query.set('prefix', params.prefix);
    const qs = query.toString();
    const url = qs ? `coupons/generate-code?${qs}` : 'coupons/generate-code';
    const data = await API<any>(url);
    return data.data;
  },

  async validateCoupon(code: string, courseId: number): Promise<{ valid: boolean; discount?: number; message?: string }> {
    const data = await API<any>('coupons/validate', { code, course_id: courseId }, 'POST');
    return data.data;
  },

  async generateCoupon(couponData: any): Promise<CourseCoupon> {
    const data = await API<any>('coupons/generate', couponData, 'POST');
    return data.data;
  },

  async getCouponCourses(params?: { search?: string; limit?: number }): Promise<{ id: number; title: string }[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    const url = qs ? `coupons/courses?${qs}` : 'coupons/courses';
    const data = await API<any>(url);
    return data.data;
  },
};
