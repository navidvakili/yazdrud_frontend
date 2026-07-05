// ============================================================
// VoucherService — API calls for coupons/vouchers management
// ============================================================

import api from '@/src/shared-api';
import type { TutVoucher } from '../types';
import { mapVoucher } from '../utils';

export const VoucherService = {
  /** Fetch all vouchers */
  async getVouchers(): Promise<TutVoucher[]> {
    const res = await api.getCoupons({ per_page: 1000 });
    return (res.data || []).map(mapVoucher);
  },

  /** Fetch a single voucher by ID */
  async getVoucher(id: number): Promise<TutVoucher> {
    const coupon = await api.getCoupon(id);
    return mapVoucher(coupon);
  },

  /** Create a new voucher */
  async createVoucher(data: any): Promise<TutVoucher> {
    const result = await api.createCoupon(data);
    return mapVoucher(result);
  },

  /** Update an existing voucher */
  async updateVoucher(id: number, data: any): Promise<void> {
    await api.updateCoupon(id, data);
  },

  /** Delete a voucher */
  async deleteVoucher(id: number): Promise<void> {
    await api.deleteCoupon(id);
  },

  /** Generate a random coupon code */
  async generateCode(params?: { length?: number; prefix?: string }): Promise<string> {
    const result = await api.generateCouponCode(params);
    return result.code;
  },

  /** Validate a coupon code for a course */
  async validateCoupon(code: string, courseId: number): Promise<{ valid: boolean; discount?: number; message?: string }> {
    return await api.validateCoupon(code, courseId);
  },
};
